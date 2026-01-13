const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

// Contract address
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || "0x61d11C622Bd98A71aD9361833379A2066Ad29CCa";

async function main() {
  console.log("\n" + "=".repeat(70));
  console.log("🔍 CONTRACT VIEW FUNCTION TEST");
  console.log("=".repeat(70));

  console.log(`\n📋 Configuration:`);
  console.log(`   Network: ${hre.network.name}`);
  console.log(`   Contract: ${CONTRACT_ADDRESS}`);
  console.log(`   RPC: ${hre.ethers.provider.connection?.url || 'default'}`);

  // Load ABI
  let contractABI;
  const abiPath = path.join(__dirname, "../contract/abi.json");
  if (fs.existsSync(abiPath)) {
    contractABI = JSON.parse(fs.readFileSync(abiPath, "utf8"));
    console.log(`\n✅ Loaded ABI from ${abiPath} (${contractABI.length} functions)`);
  } else {
    console.error(`\n❌ ABI file not found at ${abiPath}`);
    return;
  }

  // Verify contract exists
  console.log(`\n🔍 Step 1: Verifying contract exists...`);
  try {
    const code = await hre.ethers.provider.getCode(CONTRACT_ADDRESS);
    if (code === "0x") {
      console.error(`❌ No contract found at address ${CONTRACT_ADDRESS}`);
      console.error(`   Please verify the contract address is correct!`);
      return;
    }
    console.log(`✅ Contract code found (${code.length} bytes)`);
  } catch (error) {
    console.error(`❌ Failed to get contract code: ${error.message}`);
    return;
  }

  // Create contract instance
  const contract = new hre.ethers.Contract(
    CONTRACT_ADDRESS,
    contractABI,
    hre.ethers.provider
  );

  // Test 1: Get resolver account
  console.log(`\n🔍 Step 2: Testing getResolverAccount()...`);
  try {
    const resolver = await contract.getResolverAccount();
    console.log(`✅ Resolver account: ${resolver}`);
  } catch (error) {
    console.error(`❌ Failed: ${error.message}`);
  }

  // Test 2: Get owner
  console.log(`\n🔍 Step 3: Testing owner()...`);
  try {
    const owner = await contract.owner();
    console.log(`✅ Owner: ${owner}`);
  } catch (error) {
    console.error(`❌ Failed: ${error.message}`);
  }

  // Test 3: Get contract stats
  console.log(`\n🔍 Step 4: Testing getContractStats()...`);
  try {
    const stats = await contract.getContractStats();
    console.log(`✅ Contract Stats:`);
    console.log(`   Total Users: ${stats[0].toString()}`);
    console.log(`   Total Bets: ${hre.ethers.formatEther(stats[1])} CELO`);
    console.log(`   Total Winnings: ${hre.ethers.formatEther(stats[2])} CELO`);
    console.log(`   Total Games: ${stats[3].toString()}`);
  } catch (error) {
    console.error(`❌ Failed: ${error.message}`);
  }

  // Test 4: Get all users
  console.log(`\n🔍 Step 5: Testing getAllUsers()...`);
  try {
    const users = await contract.getAllUsers();
    console.log(`✅ Total users: ${users.length}`);
    if (users.length > 0) {
      console.log(`   First 5 users:`);
      users.slice(0, 5).forEach((user, i) => {
        console.log(`   ${i + 1}. ${user}`);
      });
    }
  } catch (error) {
    console.error(`❌ Failed: ${error.message}`);
  }

  // Test 5: Get pending games
  console.log(`\n🔍 Step 6: Testing getPendingGames()...`);
  try {
    const pendingGames = await contract.getPendingGames();
    console.log(`✅ Pending games: ${pendingGames.length}`);
    if (pendingGames.length > 0) {
      console.log(`   First 5 pending games:`);
      pendingGames.slice(0, 5).forEach((gameId, i) => {
        console.log(`   ${i + 1}. ${gameId}`);
      });
    }
  } catch (error) {
    console.error(`❌ Failed: ${error.message}`);
  }

  // Test 6: Get user stats for a test address
  console.log(`\n🔍 Step 7: Testing getUserStats() with test address...`);
  try {
    // Use one of the wallet addresses from the failed transactions
    const testAddress = "0x3Fc172864Aff140f212e22F5f56E0586A13e4c74";
    const userStats = await contract.getUserStats(testAddress);
    console.log(`✅ User Stats for ${testAddress}:`);
    console.log(`   Total Bet: ${hre.ethers.formatEther(userStats[0])} CELO`);
    console.log(`   Total Won: ${hre.ethers.formatEther(userStats[1])} CELO`);
    console.log(`   Total Lost: ${hre.ethers.formatEther(userStats[2])} CELO`);
    console.log(`   Withdrawable: ${hre.ethers.formatEther(userStats[3])} CELO`);
    console.log(`   Games Played: ${userStats[4].toString()}`);
    console.log(`   Games Won: ${userStats[5].toString()}`);
  } catch (error) {
    console.error(`❌ Failed: ${error.message}`);
  }

  // Test 7: Check network info
  console.log(`\n🔍 Step 8: Checking network info...`);
  try {
    const network = await hre.ethers.provider.getNetwork();
    const blockNumber = await hre.ethers.provider.getBlockNumber();
    const gasPrice = await hre.ethers.provider.getFeeData();
    
    console.log(`✅ Network Info:`);
    console.log(`   Chain ID: ${network.chainId}`);
    console.log(`   Network Name: ${network.name}`);
    console.log(`   Current Block: ${blockNumber}`);
    console.log(`   Gas Price: ${gasPrice.gasPrice ? hre.ethers.formatUnits(gasPrice.gasPrice, "gwei") + " GWei" : "N/A"}`);
  } catch (error) {
    console.error(`❌ Failed: ${error.message}`);
  }

  // Test 8: Try to get game details for a non-existent game (should return existsFlag: false)
  console.log(`\n🔍 Step 9: Testing getGameDetails() with non-existent game...`);
  try {
    const gameDetails = await contract.getGameDetails("non-existent-game-id-12345");
    console.log(`✅ Game Details (non-existent):`);
    console.log(`   ID: ${gameDetails[0]}`);
    console.log(`   Player: ${gameDetails[1]}`);
    console.log(`   Amount: ${hre.ethers.formatEther(gameDetails[2])} CELO`);
    console.log(`   Status: ${gameDetails[3]}`);
    console.log(`   Exists: ${gameDetails[7]}`);
  } catch (error) {
    console.error(`❌ Failed: ${error.message}`);
  }

  console.log("\n" + "=".repeat(70));
  console.log("✅ VIEW FUNCTION TEST COMPLETE");
  console.log("=".repeat(70));
  console.log("\n💡 If all view functions work, the contract is accessible.");
  console.log("   Next step: Test a write function with proper gas limit.\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Error:", error);
    process.exit(1);
  });

