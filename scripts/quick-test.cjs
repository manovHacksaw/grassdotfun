const hre = require("hardhat");

// Quick test to verify contract connection and wallet balance
async function main() {
  console.log("\n🔍 Quick Test - Mantle Sepolia Connection\n");

  const [signer] = await hre.ethers.getSigners();
  const address = await signer.getAddress();
  const balance = await hre.ethers.provider.getBalance(address);

  console.log("✅ Wallet Address:", address);
  console.log("💰 Balance:", hre.ethers.formatEther(balance), "MNT");

  // Test contract connection
  const CONTRACT_ADDRESS = "0x61d11C622Bd98A71aD9361833379A2066Ad29CCa";
  const contractABI = [
    {
      inputs: [],
      name: "getContractStats",
      outputs: [
        { internalType: "uint256", name: "totalUsers", type: "uint256" },
        { internalType: "uint256", name: "totalBets", type: "uint256" },
        { internalType: "uint256", name: "totalWinnings", type: "uint256" },
        { internalType: "uint256", name: "totalGames", type: "uint256" },
      ],
      stateMutability: "view",
      type: "function",
    },
  ];

  const contract = new hre.ethers.Contract(CONTRACT_ADDRESS, contractABI, hre.ethers.provider);

  try {
    const stats = await contract.getContractStats();
    console.log("\n📊 Contract Stats:");
    console.log("   Total Users:", stats[0].toString());
    console.log("   Total Bets:", hre.ethers.formatEther(stats[1]), "MNT");
    console.log("   Total Winnings:", hre.ethers.formatEther(stats[2]), "MNT");
    console.log("   Total Games:", stats[3].toString());
    console.log("\n✅ Contract connection successful!");
  } catch (error) {
    console.error("\n❌ Contract connection failed:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
