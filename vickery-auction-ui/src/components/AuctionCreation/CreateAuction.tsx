import React, { useState } from 'react';
import './CreateAuction.css';
import { ethers } from 'ethers';
import '../contractsConfig.json';
import AuctionContractABI from './path/to/AuctionContractABI.json';

const contractAddress = "YOUR_CONTRACT_ADDRESS";

const CreateAuction = () => {
  // State for auction creation form
  const [selectedNFTContract, setSelectedNFTContract] = useState('');
  const [selectedTokenContract, setSelectedTokenContract] = useState('');
  const [nftId, setNftId] = useState('');
  const [startTime, setStartTime] = useState('');
  const [bidPeriod, setBidPeriod] = useState('');
  const [revealPeriod, setRevealPeriod] = useState('');
  const [reservePrice, setReservePrice] = useState('');

  // Function to get the auction contract instance
  const getAuctionContract = (signer: ethers.Signer) => {
    return new ethers.Contract(contractAddress, AuctionContractABI, signer);
  };

  // Function to handle auction creation form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!window.ethereum) {
      alert("Please install MetaMask to create an auction.");
      return;
    }

    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const auctionContract = getAuctionContract(signer);

      // Convert form inputs to correct types
      const formattedNftId = parseInt(nftId);
      const formattedStartTime = parseInt(startTime);
      const formattedBidPeriod = parseInt(bidPeriod);
      const formattedRevealPeriod = parseInt(revealPeriod);
      const formattedReservePrice = ethers.utils.parseUnits(reservePrice, 18);

      const tx = await auctionContract.createAuction(
        selectedNFTContract,
        formattedNftId,
        selectedTokenContract,
        formattedStartTime,
        formattedBidPeriod,
        formattedRevealPeriod,
        formattedReservePrice
      );

      await tx.wait();
      console.log("Auction created successfully");
    } catch (error) {
      console.error("Failed to create auction:", error);
      alert("Error creating auction. Check the console for more details.");
    }
  };

  return (
    <div className="create-auction-container">
            <form onSubmit={handleSubmit} className="create-auction-form">
                <h2>Create a New Auction</h2>
                <label>
        Select NFT Contract:
        <select 
          value={selectedNFTContract} 
          onChange={(e) => setSelectedNFTContract(e.target.value)}
        >
          {contractsConfig.erc721Contracts.map((contract) => (
            <option key={contract.address} value={contract.address}>{contract.name}</option>
          ))}
        </select>
      </label>

      <label>
        Select ERC20 Token Contract:
        <select 
          value={selectedTokenContract} 
          onChange={(e) => setSelectedTokenContract(e.target.value)}
        >
          {contractsConfig.erc20Contracts.map((contract) => (
            <option key={contract.address} value={contract.address}>{contract.name}</option>
          ))}
        </select>
      </label>

      {/* Add input fields for NFT ID, start time, bid period, reveal period, reserve price */}
      {/* Example: */}
      <label>
        NFT ID:
        <input type="text" value={nftId} onChange={(e) => setNftId(e.target.value)} />
      </label>

      {/* Repeat for other fields... */}
                <button type="submit">Create Auction</button>
            </form>
        </div>
  );
};

export default CreateAuction;
