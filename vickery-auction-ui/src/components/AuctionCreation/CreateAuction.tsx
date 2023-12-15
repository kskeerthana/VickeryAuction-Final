import React, { useState, useEffect } from 'react';
import './CreateAuction.css';
import { ethers } from 'ethers';
import contractsData from '../../contractsConfig.json';
import VickreyAuction from '../../VickeryAuction.json';
const yourContractAddress = "0x822dF9c648F1D6A25c632908C7Eb1968531F1Ef4"; 


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
  
  const createAuction = async () => {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(contractAddress, VickreyAuction.abi, signer);
      try {
        // const tokenId = document.getElementById("tokenId") as HTMLInputElement;
        // const startTime = document.getElementById("startTime") as HTMLInputElement;
        // const bidPeriod = document.getElementById("bidPeriod") as HTMLInputElement;
        // const revealPeriod = document.getElementById("revealPeriod") as HTMLInputElement;
        // const reservePrice = document.getElementById("reservePrice") as HTMLInputElement;

        // const tokenID = tokenId.value;
        // const auctionStartTime = startTime.value;
        // const autionBidPeriod = bidPeriod.value;
        // const auctionRevealPeriod = revealPeriod.value;
        // const auctionReservePrice = reservePrice.value;

        
        let tokenID = 1;
        const auctiontokenID = ethers.utils.defaultAbiCoder.encode(['uint256'], [tokenID]);
        let StartTime = 60;
        const auctionStartTime = ethers.utils.defaultAbiCoder.encode(['uint32'], [StartTime]);
        let BidPeriod = 60;
        const auctionBidPeriod = ethers.utils.defaultAbiCoder.encode(['uint32'], [BidPeriod]);
        let RevealPeriod = 60;
        const auctionRevealPeriod = ethers.utils.defaultAbiCoder.encode(['uint32'], [RevealPeriod]);
        let ReservePrice = 1000;
        const auctionReservePrice = ethers.utils.defaultAbiCoder.encode(['uint96'], [ReservePrice]);
        const auctionselectedErc721 = ethers.utils.defaultAbiCoder.encode(['address'], [selectedErc721]);
        const auctionselectedErc20 = ethers.utils.defaultAbiCoder.encode(['address'], [selectedErc20]);

        console.log(auctiontokenID, auctionStartTime, auctionBidPeriod, auctionRevealPeriod, auctionReservePrice, auctionselectedErc721, auctionselectedErc20)

        await contract.createAuction(auctionselectedErc721, auctiontokenID, auctionselectedErc20, auctionStartTime, auctionBidPeriod, auctionRevealPeriod, auctionReservePrice);

        window.alert(`Auction created for: ${selectedErc721}`);

    } catch (error: any) {
        window.alert(
            'Error!' + (error && error.reason ? `\n\n${error.reason}` : `${error.message}`)
        );
      }
    };

  const deployAuction = async () => {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const VickeryAuction = new ethers.ContractFactory(VickreyAuction.abi, VickreyAuction.bytecode, signer);
    try {
      const basicVickeryAuction = await VickeryAuction.deploy();

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
      
      <button type="submit" onClick={deployAuction}>Deploy Auction</button>
      <button type="submit" onClick={createAuction}>Create Auction</button>
    </form>
  );
}

export default CreateAuction;
