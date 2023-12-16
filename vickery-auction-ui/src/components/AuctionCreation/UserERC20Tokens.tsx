import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';
const erc20Contracts = [
  {
    name: 'Token1',
    symbol: 'T1',
    address: '0xTokenAddress1',
  },
  {
    name: 'Token2',
    symbol: 'T2',
    address: '0xTokenAddress2',
  },
  // Add more contracts as needed
];

const UserERC20Tokens = ({ userAddress }) => {
  const [userTokenBalances, setUserTokenBalances] = useState([]);  useEffect(() => {
    const fetchUserTokenBalances = async () => {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();      // Fetch user's token balances for each contract
      const userTokenBalanceData = await Promise.all(
        erc20Contracts.map(async (contract) => {
          const contractInstance = new ethers.Contract(contract.address, ['function balanceOf(address) view returns (uint256)'], signer);
          const tokenBalance = await contractInstance.balanceOf(userAddress);
          return {
            contractName: contract.name,
            contractSymbol: contract.symbol,
            tokenBalance: tokenBalance.toNumber(),
          };
        })
      );      
      setUserTokenBalances(userTokenBalanceData);
    };    
    if (userAddress) {
      fetchUserTokenBalances();
    }
  }, [userAddress]);  
  
  return (
    <div>
      <h2>User's ERC20 Tokens:</h2>
      {userTokenBalances.map((token, index) => (
        <div key={index}>
          <h3>{token.contractName}</h3>
          <p>Symbol: {token.contractSymbol}</p>
          <p>Token Balance: {token.tokenBalance}</p>
          {/* You can add more details or formatting as needed */}
        </div>
      ))}
    </div>
  );
};

export default UserERC20Tokens;