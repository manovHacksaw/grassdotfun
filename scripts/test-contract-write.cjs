const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

// Contract address
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || "0x61d11C622Bd98A71aD9361833379A2066Ad29CCa";
const BET_AMOUNT = "0.01";

async function main() {
  console.log("\n" + "=".repeat(70));
  console.log("🧪 CONTRACT WRITE FUNCTION TEST (startGame)");
  console.log("=".repeat(70));

  // Get a test wallet (use one from the generated wallets or create new)
  const [signer] = await hre.ethers.getSigners();
  console.log(`\n💰 Test Wallet: ${signer.address}`);
  
  const balance = await hre.ethers.provider.getBalance(signer.address);
  console.log(`💰 Balance: ${hre.ethers.formatEther(balance)} MNT`);

  if (parseFloat(hre.ethers.formatEther(balance)) < 0.1) {
    console.error(`\n❌ Need at least 0.1 MNT for testing!`);
    return;
  }

  // Load ABI
  let contractABI;
  const abiPath = path.join(__dirname, "../contract/abi.json");
  if (fs.existsSync(abiPath)) {
    contractABI = JSON.parse(fs.readFileSync(abiPath, "utf8"));
  } else {
    console.error(`❌ ABI file not found`);
    return;
  }

  const contract = new hre.ethers.Contract(
    CONTRACT_ADDRESS,
    contractABI,
    signer
  );

  // Generate unique game ID
  const gameId = `test-write-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  const gameType = "coinflip";
  const betAmountWei = hre.ethers.parseEther(BET_AMOUNT);

  console.log(`\n📋 Test Parameters:`);
  console.log(`   Game ID: ${gameId}`);
  console.log(`   Game Type: ${gameType}`);
  console.log(`   Bet Amount: ${BET_AMOUNT} MNT (${betAmountWei.toString()} wei)`);

  // Test 1: Estimate gas
  console.log(`\n🔍 Step 1: Estimating gas...`);
  let gasEstimate;
  try {
    gasEstimate = await contract.startGame.estimateGas(gameId, gameType, {
      value: betAmountWei,
    });
    console.log(`✅ Gas estimate: ${gasEstimate.toString()} (${gasEstimate.toString()})`);
    console.log(`   Gas in hex: 0x${gasEstimate.toString(16)}`);
  } catch (error) {
    console.error(`❌ Gas estimation failed: ${error.message}`);
    console.error(`   Error details: ${JSON.stringify(error, null, 2).substring(0, 500)}`);
    return;
  }

  // Test 2: Try with different gas limits
  const gasLimitsToTest = [
    gasEstimate,                    // Exact estimate
    (gasEstimate * 110n) / 100n,   // +10%
    (gasEstimate * 120n) / 100n,   // +20%
    (gasEstimate * 150n) / 100n,   // +50%
    (gasEstimate * 200n) / 100n,   // +100%
    500000n,                        // Fixed 500k
    800000n,                        // Fixed 800k
    1000000n,                       // Fixed 1M
  ];

  console.log(`\n🔍 Step 2: Testing with different gas limits...\n`);

  for (let i = 0; i < gasLimitsToTest.length; i++) {
    const testGasLimit = gasLimitsToTest[i];
    const gasLimitEth = hre.ethers.formatUnits(testGasLimit * 25000000000n, "ether"); // Approx gas cost at 25 GWei
    
    console.log(`   Test ${i + 1}: Gas limit = ${testGasLimit.toString()} (~${gasLimitEth} MNT at 25 GWei)`);
    
    // Generate new game ID for each test
    const testGameId = `${gameId}-test${i}`;
    
    try {
      // Check if game already exists
      try {
        const existing = await contract.getGameDetails(testGameId);
        if (existing[7]) { // existsFlag
          console.log(`      ⏭️  Game ID already exists, skipping...`);
          continue;
        }
      } catch (e) {
        // Game doesn't exist, continue
      }

      const tx = await contract.startGame(testGameId, gameType, {
        value: betAmountWei,
        gasLimit: testGasLimit,
      });
      
      console.log(`      ✅ Transaction sent: ${tx.hash}`);
      
      const receipt = await tx.wait();
      
      if (receipt.status === 1) {
        console.log(`      ✅✅ SUCCESS! Transaction confirmed in block ${receipt.blockNumber}`);
        console.log(`      ✅ Gas used: ${receipt.gasUsed.toString()}`);
        console.log(`      ✅ Gas limit was sufficient: ${testGasLimit.toString()}`);
        console.log(`\n🎉 Found working gas limit: ${testGasLimit.toString()}`);
        console.log(`   Gas used: ${receipt.gasUsed.toString()}`);
        console.log(`   Efficiency: ${((Number(receipt.gasUsed) / Number(testGasLimit)) * 100).toFixed(1)}%\n`);
        return; // Success! Exit
      } else {
        console.log(`      ❌ Transaction reverted (status: 0)`);
      }
    } catch (error) {
      let errorMsg = error.message;
      if (error.reason) {
        errorMsg = error.reason;
      } else if (error.data) {
        errorMsg = `Error data: ${error.data.substring(0, 100)}`;
      }
      console.log(`      ❌ Failed: ${errorMsg.substring(0, 100)}`);
    }
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  console.log(`\n❌ All gas limit tests failed. Contract may have other issues.`);
  console.log(`   Check the contract requirements and ensure the wallet has proper permissions.\n`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Error:", error);
    process.exit(1);
  });





