import React,{useState} from 'react';
import { ethers } from 'ethers';
import logo from './logo.svg';
import './App.css';
import CreateAuction from './components/AuctionCreation/CreateAuction';
import VickeryAuctionTable from './components/AuctionCreation/FetchAuctions';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';

declare global {
  interface Window {
    ethereum: any;
  }
}

function App() {
  const [userAddress, setUserAddress] = useState('');
  const contractAddress = "0xeC3Ca7cB7015159c65fcB4A8fBCD46De4BeD1323"; 
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
    console.log("trying to connect");
  };

  const disconnectWallet = () => {
    setUserAddress('');
  };

  return (
    <Router>
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
          <Link to="/create">
            <button className="button">Interact</button>
          </Link>
          <Link to="/auctionsTable">
            <button className="button">Auctions</button>
          </Link>
          
        </div>
        <Routes>
            <Route path="/create" element={<CreateAuction />} />
        </Routes>
        <Routes>
            <Route path="/auctionsTable" element={ <VickeryAuctionTable contractAddress={contractAddress} />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
