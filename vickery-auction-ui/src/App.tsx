import React,{useState} from 'react';
import { ethers } from 'ethers';
import logo from './logo.svg';
import './App.css';

function App() {
  const [userAddress, setUserAddress] = useState('');

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        // Request account access if needed
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        // We currently consider the first account as the user's account
        setUserAddress(accounts[0]);
      } catch (error) {
        console.error("Error connecting to MetaMask: ", error);
      }
    } else {
      console.error("Non-Ethereum browser detected. You should consider trying MetaMask!");
    }
  };

  const disconnectWallet = () => {
    setUserAddress('');
  };

  return (
    <div className="app-container">
      <div className="header">
        {userAddress && <p className="user-address">Connected: {userAddress}</p>}
      </div>

      <h1 className="title">Vickery Auction</h1>
      <p className="description">
        Hello! 👋 - <span>Place your best bids here!</span>
      </p>
      <div className="buttons-container">
        {userAddress ? (
          <button className="button" onClick={disconnectWallet}>Disconnect</button>
        ) : (
          <button className="button" onClick={connectWallet}>Connect</button>
        )}
        <button className="button">Interact</button>
        <button className="button">Auctions</button>
      </div>
    </div>
  );
}

export default App;
