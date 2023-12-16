import React, { useState, useEffect } from 'react';
import './CreateAuction.css';
import { ethers } from 'ethers';
import contractsData from '../../contractsConfig.json';
import VickreyAuction from '../../VickeryAuction.json';
const yourContractAddress = "0xeC3Ca7cB7015159c65fcB4A8fBCD46De4BeD1323"; 


function CreateAuction() {
  const [selectedErc721, setSelectedErc721] = useState('');
  const [selectedErc20, setSelectedErc20] = useState('');
  const [contractAddress, setContractAddress] = useState('');
  const [selectedTokenId, setSelectedTokenId] = useState('12345678');
  const [startTime, setStartTime] = useState('');
  const [bidPeriod, setBidPeriod] = useState('');
  const [revealPeriod, setRevealPeriod] = useState('');
  const [reservePrice, setReservePrice] = useState('');

  const handleSubmit = async (e :React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
  };

  const handleErc721Change = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedErc721(e.target.value);
  };
  
  const handleErc20Change = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedErc20(e.target.value);
  };
  
  const handleTokenIdChange = (e: React.ChangeEvent<HTMLSelectElement>) => setSelectedTokenId(e.target.value);
  const handleStartTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => setStartTime(e.target.value);
  const handleBidPeriodChange = (e: React.ChangeEvent<HTMLInputElement>) => setBidPeriod(e.target.value);
  const handleRevealPeriodChange = (e: React.ChangeEvent<HTMLInputElement>) => setRevealPeriod(e.target.value);
  const handleReservePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => setReservePrice(e.target.value);
  
  const createAuction = async () => {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(yourContractAddress, VickreyAuction.abi, signer);
      try {
        const auctionTokenID = ethers.utils.defaultAbiCoder.encode(['uint256'], [selectedTokenId]);
        const auctionStartTime = ethers.utils.defaultAbiCoder.encode(['uint32'], [startTime]);
        const auctionBidPeriod = ethers.utils.defaultAbiCoder.encode(['uint32'], [bidPeriod]);
        const auctionRevealPeriod = ethers.utils.defaultAbiCoder.encode(['uint32'], [revealPeriod]);
        const auctionReservePrice = ethers.utils.defaultAbiCoder.encode(['uint96'], [reservePrice]);
        
        const tx = await contract.createAuction(selectedErc721, auctionTokenID, selectedErc20, auctionStartTime, auctionBidPeriod, auctionRevealPeriod, auctionReservePrice);
        
        await tx.wait();    

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
    <div className="create-auction-container">
      <form onSubmit={handleSubmit} className="create-auction-form">

        {/* Section 1: ERC dropdowns and Deploy button */}
        <div className="section">
          <select name="tokenContract" onChange={handleErc721Change} value={selectedErc721}>
            <option value="">Select NFT Collection</option>
            {contractsData.erc721Contracts.map(contract => (
          <option key={contract.address} value={contract.address}>{contract.name}</option>
        ))}
          </select>

          <select name="erc20Token" onChange={handleErc20Change} value={selectedErc20}>
            <option value="">Select ERC20 Token</option>
            {contractsData.erc20Contracts.map(contract => (
          <option key={contract.address} value={contract.address}>{contract.name}</option>
        ))}
          </select>

          <button type="button" onClick={deployAuction} className="button">Deploy Auction</button>
        </div>

        {/* Section 2: Token dropdown, Input fields, and Create Auction button */}
        <div className="section">
          <select name="tokenId" onChange={handleTokenIdChange} value={selectedTokenId}>
            <option value="12345678">Token ID: 12345678</option>
            {/* Additional token IDs */}
          </select>

          {/* Input fields */}
          <input type="text" placeholder="Start Time" value={startTime} onChange={handleStartTimeChange} />
          <input type="text" placeholder="Bid Period" value={bidPeriod} onChange={handleBidPeriodChange} />
          <input type="text" placeholder="Reveal Period" value={revealPeriod} onChange={handleRevealPeriodChange} />
          <input type="text" placeholder="Reserve Price" value={reservePrice} onChange={handleReservePriceChange} />

          <button type="button" onClick={createAuction} className="button">Create Auction</button>
        </div>

      </form>
    </div>
  );
}

export default CreateAuction;
