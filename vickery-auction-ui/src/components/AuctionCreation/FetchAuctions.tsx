import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import './VickeryAuctionTable.css';
import TokenizedVickeryAuctionArtifact from '../../VickeryAuction.json';

const VickeryAuctionTable = ({ contractAddress }) => {
  const [auctions, setAuctions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchAuctions = async () => {
      setIsLoading(true);
      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const contract = new ethers.Contract(contractAddress, TokenizedVickeryAuctionArtifact.abi, provider);

        // Example: Fetch a list of token IDs (adjust based on your contract's data structure)
        const tokenIds = [12345678];
        const fetchedAuctions = await Promise.all(tokenIds.map(async (tokenId) => {
          const auction = await contract.getAuction(contractAddress, tokenId);
          const currentTime = Math.floor(Date.now() / 1000);
          const isAuctionOpen = currentTime >= auction.startTime && currentTime <= auction.endOfRevealPeriod;
          const timeLeft = isAuctionOpen ? auction.endOfRevealPeriod - currentTime : 0;
          return { ...auction, tokenId, isAuctionOpen, timeLeft };
        }));

        setAuctions(fetchedAuctions);
      } catch (error) {
        console.error('Error fetching auctions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAuctions();
  }, [contractAddress]);

  const handleBidSubmit = (auction) => {
    // Implement bid submission logic here
  };

  return (
    <>
    <div className="vickery-auction-table-container">
      {isLoading ? <p>Loading...</p> :
        <table className="table table-bordered table-responsive">
          <thead>
            <tr>
              <th className='text-center'>NFT ID</th>
              <th className='text-center'>Auction Status</th>
              <th className='text-center'>Start Time</th>
              <th className='text-center'>Time Left</th>
              <th className='text-center'>Number of Bids</th>
              <th className='text-center'>Action</th>
            </tr>
          </thead>
          <tbody>
            {auctions.map((auction, index) => (
              <tr key={index}>
                <td className='text-center'>{auction.tokenId}</td>
                <td className='text-center'>{auction.isAuctionOpen ? "Open" : "Closed"}</td>
                <td className='text-center'>{new Date(auction.startTime * 1000).toLocaleString()}</td>
                <td className='text-center'>{auction.timeLeft > 0 ? `${auction.timeLeft} seconds` : "Closed"}</td>
                <td className='text-center'>{auction.numUnrevealedBids}</td>
                <td className='text-center'>
                  {auction.isAuctionOpen && (
                    <button className='btn btn-primary' onClick={() => handleBidSubmit(auction)}>Submit Bid</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      }
      </div>
    </>
  );
};

export default VickeryAuctionTable;
