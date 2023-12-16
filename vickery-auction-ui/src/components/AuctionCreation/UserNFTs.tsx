import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';
const nftContracts = [
  {
    name: 'Contract1',
    address: '0xContractAddress1',
  },
  {
    name: 'Contract2',
    address: '0xContractAddress2',
  },
  // Add more contracts as needed
];

const UserNFTs = ({ userAddress }) => {
  const [userNFTs, setUserNFTs] = useState([]);  useEffect(() => {
    const fetchUserNFTs = async () => {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();      // Fetch user's NFTs for each contract
      const userNFTData = await Promise.all(
        nftContracts.map(async (contract) => {
          const contractInstance = new ethers.Contract(contract.address, ['function balanceOf(address) view returns (uint256)'], signer);
          const nftCount = await contractInstance.balanceOf(userAddress);
          return {
            contractName: contract.name,
            nftCount: nftCount.toNumber(),
          };
        })
      );      
      setUserNFTs(userNFTData);
    };    
    if (userAddress) {
      fetchUserNFTs();
    }
  }, [userAddress]);  
  
  return (
    <div>
      <h2>User's NFTs:</h2>
      {userNFTs.map((nft, index) => (
        <div key={index}>
          <h3>{nft.contractName}</h3>
          <p>Number of NFTs owned: {nft.nftCount}</p>
          {/* You can add more details or iterate over specific NFTs here */}
        </div>
      ))}
    </div>
  );
};

export default UserNFTs;