import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  console.log("🚀 Starting deployment to Mantle Sepolia...\n");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying contracts with account:", deployer.address);

  // Check balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "MNT\n");

  if (balance === 0n) {
    console.error("❌ Error: Deployer account has no MNT balance!");
    console.error("Please fund the account before deploying.");
    process.exit(1);
  }

  // Deploy SecureGames contract
  console.log("📦 Deploying SecureGames contract...");
  const SecureGames = await ethers.getContractFactory("SecureGames");

  // Use deployer as resolver (can be changed later)
  const resolverAddress = deployer.address;
  console.log("🎯 Resolver address:", resolverAddress);

  const secureGames = await SecureGames.deploy(resolverAddress);
  await secureGames.waitForDeployment();

  const contractAddress = await secureGames.getAddress();
  console.log("✅ SecureGames deployed to:", contractAddress);

  // Get deployment transaction details
  const deploymentTx = secureGames.deploymentTransaction();
  const receipt = await deploymentTx.wait();

  console.log("📋 Transaction hash:", deploymentTx.hash);
  console.log("📦 Block number:", receipt.blockNumber);
  console.log("⛽ Gas used:", receipt.gasUsed.toString());

  // Get network info
  const network = await ethers.provider.getNetwork();
  console.log("🌐 Network:", network.name);
  console.log("🔗 Chain ID:", network.chainId.toString());

  // Update deployment-info.json
  const deploymentInfo = {
    network: "Mantle Sepolia Testnet",
    chainId: Number(network.chainId),
    contractAddress: contractAddress,
    deployer: deployer.address,
    resolver: resolverAddress,
    transactionHash: deploymentTx.hash,
    blockNumber: receipt.blockNumber,
    timestamp: new Date().toISOString()
  };

  const deploymentInfoPath = path.join(process.cwd(), "deployment-info.json");
  fs.writeFileSync(deploymentInfoPath, JSON.stringify(deploymentInfo, null, 2));
  console.log("\n✅ Deployment info saved to deployment-info.json");

  console.log("\n🎉 Deployment completed successfully!");
  console.log("\n📝 Contract verification command:");
  console.log(`npx hardhat verify --network mantleSepolia ${contractAddress} ${resolverAddress}`);

  console.log("\n🔍 View on Explorer:");
  console.log(`https://sepolia.mantlescan.xyz/address/${contractAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
