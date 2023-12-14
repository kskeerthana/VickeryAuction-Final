import React, { useState, useEffect } from 'react';
import './CreateAuction.css';
import { ethers } from 'ethers';
import contractsData from '../../contractsConfig.json';
import YourContractABI from '../../AuctionContractABI.json';
const yourContractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; 


function CreateAuction() {
  const [selectedErc721, setSelectedErc721] = useState('');
  const [selectedErc20, setSelectedErc20] = useState('');
  const [contractAddress, setContractAddress] = useState('');

  const handleSubmit = async (e :React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
  };

  const handleErc721Change = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedErc721(e.target.value);
  };
  
  const handleErc20Change = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedErc20(e.target.value);
  };
  
  const deployAuction = async () => {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const VickeryAuction = new ethers.ContractFactory(YourContractABI.abi, YourContractABI.bytecode, signer);
      try {
        const tokenId = document.getElementById("tokenId") as HTMLInputElement;
        const startTime = document.getElementById("startTime") as HTMLInputElement;
        const bidPeriod = document.getElementById("bidPeriod") as HTMLInputElement;
        const revealPeriod = document.getElementById("revealPeriod") as HTMLInputElement;
        const reservePrice = document.getElementById("reservePrice") as HTMLInputElement;

        const tokenID = tokenId.value;
        const auctionStartTime = startTime.value;
        const autionBidPeriod = bidPeriod.value;
        const auctionRevealPeriod = revealPeriod.value;
        const auctionReservePrice = reservePrice.value;
        
        const basicVickeryAuction = await VickeryAuction.deploy(
          tokenID,
          auctionStartTime,
          autionBidPeriod,
          auctionRevealPeriod,
          auctionReservePrice,
          selectedErc20,
          selectedErc721
          );

        await basicVickeryAuction.deployed();

        const deployedAddress = basicVickeryAuction.address;
        window.alert(`Contract deployed to: ${deployedAddress}`);
        setContractAddress(deployedAddress)

        const deployed = document.getElementById("deployedAt") as HTMLInputElement;
        deployed.textContent = `Deployed at ${deployedAddress}`


    } catch (error: any) {
        window.alert(
            'Error!' + (error && error.reason ? `\n\n${error.reason}` : `${error.message}`)
        );
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Dropdown for ERC721 Contracts */}
      <select name="tokenContract" onChange={handleErc721Change} value={selectedErc721}>
        <option value="">Select NFT Collection</option>
        {contractsData.erc721Contracts.map(contract => (
          <option key={contract.address} value={contract.address}>{contract.name}</option>
        ))}
      </select>

      {/* Dropdown for ERC20 Tokens */}
      <select name="erc20Token" onChange={handleErc20Change} value={selectedErc20}>
        <option value="">Select ERC20 Token</option>
        {contractsData.erc20Contracts.map(contract => (
          <option key={contract.address} value={contract.address}>{contract.name}</option>
        ))}
      </select>
      
      <button type="submit">Create Auction</button>
    </form>
  );
}

export default CreateAuction;
