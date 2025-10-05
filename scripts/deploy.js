const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Starting SecureGames deployment to U2U Solaris Mainnet...");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying contracts with account:", deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "U2U");

  // Set the resolver address (you can change this to your desired resolver address)
  const resolverAddress = deployer.address; // Using deployer as resolver for now
  console.log("🔧 Resolver address:", resolverAddress);

  // Deploy the SecureGames contract
  console.log("📦 Deploying SecureGames contract...");
  const SecureGames = await ethers.getContractFactory("SecureGames");
  const secureGames = await SecureGames.deploy(resolverAddress);

  await secureGames.waitForDeployment();
  const contractAddress = await secureGames.getAddress();

  console.log("✅ SecureGames deployed to:", contractAddress);
  console.log("🔗 Transaction hash:", secureGames.deploymentTransaction().hash);

  // Verify deployment
  console.log("🔍 Verifying deployment...");
  const owner = await secureGames.owner();
  const resolver = await secureGames.getResolverAccount();
  
  console.log("👤 Contract owner:", owner);
  console.log("🔧 Contract resolver:", resolver);

  // Save deployment info
  const deploymentInfo = {
    network: "U2U Solaris Mainnet",
    chainId: 39,
    contractAddress: contractAddress,
    deployer: deployer.address,
    resolver: resolverAddress,
    transactionHash: secureGames.deploymentTransaction().hash,
    blockNumber: await secureGames.deploymentTransaction().getBlockNumber(),
    timestamp: new Date().toISOString(),
  };

  console.log("📋 Deployment Summary:");
  console.log(JSON.stringify(deploymentInfo, null, 2));

  // Save to file for reference
  const fs = require('fs');
  fs.writeFileSync(
    './deployment-info.json', 
    JSON.stringify(deploymentInfo, null, 2)
  );
  console.log("💾 Deployment info saved to deployment-info.json");

  console.log("🎉 Deployment completed successfully!");
  console.log("🔗 View on U2UScan:", `https://u2uscan.xyz/address/${contractAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
