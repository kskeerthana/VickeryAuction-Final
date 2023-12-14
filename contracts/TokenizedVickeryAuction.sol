// SPDX-License-Identifier: AGPL-3.0
pragma solidity ^0.8.20;
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

/// @title An on-chain, over-collateralization, sealed-bid, second-price auction
contract TokenizedVickeryAuction is Initializable {
    /// @dev Representation of an auction in storage. Occupies three slots.
    /// @param seller The address selling the auctioned asset.
    /// @param startTime The unix timestamp at which bidding can start.
    /// @param endOfBiddingPeriod The unix timestamp after which bids can no
    ///        longer be placed.
    /// @param endOfRevealPeriod The unix timestamp after which commitments can
    ///        no longer be opened.
    /// @param numUnrevealedBids The number of bid commitments that have not
    ///        yet been opened.
    /// @param highestBid The value of the highest bid revealed so far, or
    ///        the reserve price if no bids have exceeded it.
    /// @param secondHighestBid The value of the second-highest bid revealed
    ///        so far, or the reserve price if no two bids have exceeded it.
    /// @param highestBidder The bidder that placed the highest bid.
    /// @param index Auctions selling the same asset (i.e. tokenContract-tokenId
    ///        pair) share the same storage. This value is incremented for
    ///        each new auction of a particular asset.
    struct Auction {
        address seller;
        uint32 startTime;
        uint32 endOfBiddingPeriod;
        uint32 endOfRevealPeriod;
        uint64 numUnrevealedBids;
        uint96 highestBid;
        uint96 secondHighestBid;
        uint96 reservePrice;
        address highestBidder;
        uint64 index;
        address erc20Token;
        address tokenContract;
        uint256 tokenId;
    }
    /// @param commitment The hash commitment of a bid value.
    /// @param collateral The amount of collateral backing the bid.
    struct Bid {
        bytes20 commitment;
        uint96 collateral; //collateral in ERC20 tokens
    }
    /// @notice A mapping storing auction parameters and state, indexed by
    ///         the ERC721 contract address and token ID of the asset being
    ///         auctioned.
    mapping(address => mapping(uint256 => Auction)) public auctions;
    event BidRevealed(address tokenContract, uint256 tokenId, address sender, uint96 bidValue, bytes32 nonce);
    event BidCommitted(address tokenContract, uint256 tokenId, address sender, bytes20 commitment, uint256 erc20Tokens);
    event AuctionEnded(address tokenContract, uint256 tokenId);
    event CollateralWithdrawn(address tokenContract, uint256 tokenId, uint64 auctionIndex, address sender, uint96 collateralAmount);
    /// @notice A mapping storing bid commitments and records of collateral,
    ///         indexed by: ERC721 contract address, token ID, auction index,
    ///         and bidder address. If the commitment is `bytes20(0)`, either
    ///         no commitment was made or the commitment was opened.
    mapping(
        address // ERC721 token contract
            => mapping(
                uint256 // ERC721 token ID
                    => mapping(
                    uint64 // Auction index
                        => mapping(address // Bidder
                            => Bid
                )
            )
        )
    ) public bids;
    /// @notice Creates an auction for the given ERC721 asset with the given
    ///         auction parameters.
    /// @param tokenContract The address of the ERC721 contract for the asset
    ///        being auctioned.
    /// @param tokenId The ERC721 token ID of the asset being auctioned.
    /// @param startTime The unix timestamp at which bidding can start.
    /// @param bidPeriod The duration of the bidding period, in seconds.
    /// @param revealPeriod The duration of the commitment reveal period,
    ///        in seconds.
    /// @param reservePrice The minimum price that the asset will be sold for.
    ///        If no bids exceed this price, the asset is returned to `seller`.
    function createAuction(
        address tokenContract,
        uint256 tokenId,
        address erc20Token,
        uint32 startTime,
        uint32 bidPeriod,
        uint32 revealPeriod,
        uint96 reservePrice
    ) public virtual{
        require(startTime >= block.timestamp, "Start time must be in the future");
        require(bidPeriod >= 0, "Bid period must be greater than 0");
        require(revealPeriod >= 0, "Reveal period must be greater than 0");
        require(reservePrice > 0, "Reserve price must be greater than 0");
        IERC721 tokenAddress = IERC721(tokenContract);
        require(tokenAddress.ownerOf(tokenId) == msg.sender, "Caller is not the token owner");
        require(tokenAddress.getApproved(tokenId) == address(this), "Token is not approved for transfer");
        // require(tokenContract.getApproved(tokenId) == address(this), "Contract not approved to transfer token");
        // require(auctions[tokenContract][tokenId].startTime == 0, "Auction already exists for this token");
        
        if(auctions[tokenContract][tokenId].startTime > 0){
            auctions[tokenContract][tokenId].index++;
        }
        else{
            auctions[tokenContract][tokenId].index = 0;
        }
        // Creating a new auction
        Auction memory newAuction = Auction({
            seller: msg.sender,
            startTime: startTime,
            endOfBiddingPeriod: startTime + bidPeriod,
            endOfRevealPeriod: startTime + bidPeriod + revealPeriod,
            numUnrevealedBids: 0,
            highestBid: reservePrice, // Initialize the highest bid with the reserve price
            secondHighestBid: reservePrice, // Initialize the second highest bid with the reserve price
            reservePrice: reservePrice,
            highestBidder: address(0),
            index: auctions[tokenContract][tokenId].index, // Update this index based on your auction management logic
            erc20Token: erc20Token,
            tokenContract: tokenContract,
            tokenId: tokenId
        });
        // Store the new auction
        auctions[tokenContract][tokenId] = newAuction;
        }
    /// @notice Commits to a bid on an item being auctioned. If a bid was
    ///         previously committed to, overwrites the previous commitment.
    ///         Value attached to this call is used as collateral for the bid.
    /// @param tokenContract The address of the ERC721 contract for the asset
    ///        being auctioned.
    /// @param tokenId The ERC721 token ID of the asset being auctioned.
    /// @param commitment The commitment to the bid, computed as
    ///        `bytes20(keccak256(abi.encode(nonce, bidValue, tokenContract, tokenId, auctionIndex)))`.
    /// @param erc20Tokens The amount of ERC20 tokens to be used as collateral
    function commitBid(address tokenContract, uint256 tokenId, bytes20 commitment, uint256 erc20Tokens) external {
        // Ensure the auction exists for the given ERC721 token
        Auction storage auction = auctions[tokenContract][tokenId];
        require(auction.startTime > 0, "Auction does not exist for this token");
        // Ensure the bidding period is active
        require(block.timestamp >= auction.startTime && block.timestamp <= auction.endOfBiddingPeriod, "Bidding period is not active");
        // Ensure a valid amount of ERC20 tokens is provided as collateral
        require(erc20Tokens > 0, "Collateral amount must be greater than 0");
        // Store or update the bid
        Bid storage bid = bids[tokenContract][tokenId][auction.index][msg.sender];
        bid.commitment = commitment;
        bid.collateral = uint96(erc20Tokens);
        // Transfer the ERC20 tokens to this contract as collateral
        require(IERC20(auction.erc20Token).transferFrom(msg.sender, address(this), erc20Tokens), "Failed to transfer ERC20 tokens");
        // Increment the count of unrevealed bids
        auctions[tokenContract][tokenId].numUnrevealedBids++;
        // Optionally, you can emit an event here to log the bid commitment
        emit BidCommitted(tokenContract, tokenId, msg.sender, commitment, erc20Tokens);
    }
    /// @notice Reveals the value of a bid that was previously committed to.
    /// @param tokenContract The address of the ERC721 contract for the asset
    ///        being auctioned.
    /// @param tokenId The ERC721 token ID of the asset being auctioned.
    /// @param bidValue The value of the bid.
    /// @param nonce The random input used to obfuscate the commitment.
    function revealBid(address tokenContract, uint256 tokenId, uint96 bidValue, bytes32 nonce) external {
        // Ensure the auction exists for the given ERC721 token
        Auction storage auction = auctions[tokenContract][tokenId];
        require(auction.startTime > 0, "Auction does not exist for this token");
        // Ensure the reveal period is active
        require(block.timestamp > auction.endOfBiddingPeriod && block.timestamp <= auction.endOfRevealPeriod, "Reveal period is not active");
        // Retrieve the bid for the sender
        Bid storage bid = bids[tokenContract][tokenId][auction.index][msg.sender];
        require(bid.commitment != bytes20(0), "No commitment found for this bidder");
        // Recreate the commitment hash from the provided values
        bytes20 recreatedCommitment = bytes20(keccak256(abi.encodePacked(nonce, bidValue, tokenContract, tokenId, auction.index)));
        require(recreatedCommitment == bid.commitment, "Provided bid does not match commitment");
        // Update the auction state based on the revealed bid
        if (bidValue > auction.highestBid) {
            auction.secondHighestBid = auction.highestBid;
            auction.highestBid = bidValue;
            auction.highestBidder = msg.sender;
        } else if (bidValue > auction.secondHighestBid && bidValue < auction.highestBid) {
            auction.secondHighestBid = bidValue;
        }
        // Clear the bid commitment to prevent multiple reveals
        bid.commitment = bytes20(0);
        // Optionally, emit an event to log the bid reveal
        emit BidRevealed(tokenContract, tokenId, msg.sender, bidValue, nonce);
    }
    /// @notice Ends an active auction. Can only end an auction if the bid reveal
    ///         phase is over, or if all bids have been revealed. Disburses the auction
    ///         proceeds to the seller. Transfers the auctioned asset to the winning
    ///         bidder and returns any excess collateral. If no bidder exceeded the
    ///         auction's reserve price, returns the asset to the seller.
    /// @param tokenContract The address of the ERC721 contract for the asset auctioned.
    /// @param tokenId The ERC721 token ID of the asset auctioned.
    function endAuction(address tokenContract, uint256 tokenId) external {
        // Retrieve the auction
        Auction storage auction = auctions[tokenContract][tokenId];
        require(auction.startTime > 0, "Auction does not exist for this token");
        require(block.timestamp > auction.endOfRevealPeriod || auction.numUnrevealedBids == 0, "Auction cannot be ended yet");
        // Transfer the ERC721 token to the highest bidder if the reserve price is met
        if (auction.highestBid >= auction.reservePrice && auction.highestBidder != address(0)) {
            IERC721(tokenContract).transferFrom(auction.seller, auction.highestBidder, tokenId);
            // Transfer the highest bid amount to the seller
            require(IERC20(auction.erc20Token).transfer(auction.seller, auction.highestBid), "Failed to transfer bid amount to seller");
            // Return any excess collateral to the highest bidder
            uint256 excessAmount = bids[tokenContract][tokenId][auction.index][auction.highestBidder].collateral - auction.highestBid;
            if (excessAmount > 0) {
                require(IERC20(auction.erc20Token).transfer(auction.highestBidder, excessAmount), "Failed to return excess collateral");
            }
        } else {
            // If the reserve price is not met, return the ERC721 token to the seller
            IERC721(tokenContract).transferFrom(address(this), auction.seller, tokenId);
        }
        // Handle collateral return for other bidders
        // [This part of the code depends on how you're storing the bidders and their bids.
        // You'll need to iterate over all bids (except the highest bidder) and return the collateral.]
        // Clear the auction data
        delete auctions[tokenContract][tokenId];
        // Optionally, emit an event to log the auction end
        emit AuctionEnded(tokenContract, tokenId);
    }
    /// @notice Withdraws collateral. Bidder must have opened their bid commitment
    ///         and cannot be in the running to win the auction.
    /// @param tokenContract The address of the ERC721 contract for the asset
    ///        that was auctioned.
    /// @param tokenId The ERC721 token ID of the asset that was auctioned.
    /// @param auctionIndex The index of the auction that was being bid on.
    function withdrawCollateral(address tokenContract, uint256 tokenId, uint64 auctionIndex) external {
        // Retrieve the auction
        Auction storage auction = auctions[tokenContract][tokenId];
        require(auction.startTime > 0, "Auction does not exist for this token");
        // Ensure the caller is not the highest bidder
        require(auction.highestBidder != msg.sender, "Highest bidder cannot withdraw collateral");
        // Retrieve the bid for the caller
        Bid storage bid = bids[tokenContract][tokenId][auctionIndex][msg.sender];
        require(bid.commitment == bytes20(0), "Bid commitment not opened");
        require(bid.collateral > 0, "No collateral to withdraw");
        // Transfer the collateral back to the bidder
        uint96 collateralAmount = bid.collateral;
        require(IERC20(auction.erc20Token).transfer(msg.sender, collateralAmount), "Failed to transfer collateral");
        // Reset the bidder's bid to prevent re-entry
        delete bids[tokenContract][tokenId][auctionIndex][msg.sender];
        // Optionally, emit an event to log the collateral withdrawal
        emit CollateralWithdrawn(tokenContract, tokenId, auctionIndex, msg.sender, collateralAmount);
    }
    /// @notice Gets the parameters and state of an auction in storage.
    /// @param tokenContract The address of the ERC721 contract for the asset auctioned.
    /// @param tokenId The ERC721 token ID of the asset auctioned.
    function getAuction(address tokenContract, uint256 tokenId) external view returns (Auction memory auction) {
        // Retrieve the auction from the mapping using the tokenContract and tokenId
        auction = auctions[tokenContract][tokenId];
        // You could add a check to ensure the auction exists
        require(auction.startTime > 0, "Auction does not exist for this token");
        return auction;
    }

    function getAuctionIndex(address tokenContract, uint256 tokenId) public view returns (uint64) {
        return auctions[tokenContract][tokenId].index;
}


    function getCurrentHighestBid(address tokenContract, uint256 tokenId) public view returns (uint96, address) {
    Auction storage auction = auctions[tokenContract][tokenId];
    return (auction.highestBid, auction.highestBidder);
    }

}