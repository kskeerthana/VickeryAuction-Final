// scripts/deploy.js
const hre = require("hardhat");

async function main() {
    const [deployer] = await hre.ethers.getSigners();

    console.log("Deploying contracts with the account:", deployer.address);

    // Deploy ModifiedERC721
    const ModifiedERC721 = await hre.ethers.getContractFactory("ERC721Token");
    const modifiedErc721 = await ModifiedERC721.deploy();
    await modifiedErc721.deployed();
    console.log("ModifiedERC721 deployed to:", modifiedErc721.address);

    // Deploy other tokens (ERC20Token1, ERC20Token2, ERC20Token3) similarly
    const ERC20Token1 = await hre.ethers.getContractFactory("ERC20Token");
    const erc20Token1 = await ERC20Token1.deploy();
    await erc20Token1.deployed();
    console.log("ERC20Token1 deployed to:", erc20Token1.address);
  }

main()
    .then(() => process.exit(0))
    .catch((error) => {
    console.error(error);
    process.exit(1);
});
