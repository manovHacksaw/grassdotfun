const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying SecureGames contract...");

  // Get the contract factory
  const SecureGames = await ethers.getContractFactory("SecureGames");

  // Deploy the contract with a resolver address
  // For testing, we'll use the deployer as the resolver
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());

  // Deploy with deployer as resolver (same private key)
  const secureGames = await SecureGames.deploy(deployer.address);

  await secureGames.waitForDeployment();

  const contractAddress = await secureGames.getAddress();
  console.log("SecureGames deployed to:", contractAddress);
  console.log("Resolver set to:", deployer.address);

  // Verify deployment
  const resolver = await secureGames.getResolverAccount();
  console.log("Verified resolver address:", resolver);

  // Save deployment info
  const deploymentInfo = {
    contractAddress: contractAddress,
    resolverAddress: deployer.address,
    deployerAddress: deployer.address,
    network: hre.network.name,
    timestamp: new Date().toISOString()
  };

  console.log("\nDeployment Summary:");
  console.log(JSON.stringify(deploymentInfo, null, 2));

  // Instructions for next steps
  console.log("\nNext steps:");
  console.log("1. Update your frontend to use contract address:", contractAddress);
  console.log("2. Set the resolver address in your backend:", deployer.address);
  console.log("3. Fund the contract with ETH for payouts");
  console.log("4. Test the contract functions");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
