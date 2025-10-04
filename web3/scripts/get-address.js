const { ethers } = require("hardhat");
const config = require("../config.js");

async function main() {
  console.log("Getting address from private key...");
  
  // Create wallet from private key
  const wallet = new ethers.Wallet(config.PRIVATE_KEY);
  
  console.log("Private Key:", config.PRIVATE_KEY);
  console.log("Address:", wallet.address);
  console.log("Public Key:", wallet.publicKey);
  
  // Check if this address has any ETH on Sepolia
  try {
    const provider = new ethers.JsonRpcProvider(config.SEPOLIA_URL);
    const balance = await provider.getBalance(wallet.address);
    console.log("Sepolia Balance:", ethers.formatEther(balance), "ETH");
    
    if (balance === 0n) {
      console.log("\n⚠️  WARNING: This address has no ETH on Sepolia testnet!");
      console.log("You need to fund this address with Sepolia ETH to deploy.");
      console.log("Get testnet ETH from: https://sepoliafaucet.com/");
    }
  } catch (error) {
    console.log("Could not check Sepolia balance:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
