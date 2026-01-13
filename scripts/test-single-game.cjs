const hre = require("hardhat");
const axios = require("axios");

// 🧪 SINGLE GAME TEST SCRIPT
// Tests one complete game cycle: start -> resolve -> verify
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || "0x61d11C622Bd98A71aD9361833379A2066Ad29CCa";
const RESOLVER_API_URL = process.env.RESOLVER_API_URL || "http://localhost:3000/api/resolve-game-production";
const BET_AMOUNT = "0.01"; // Fixed bet amount
const MAX_WIN_AMOUNT = "0.1"; // Maximum win per game
const MAX_MULTIPLIER = 10.0; // Maximum multiplier (10x)

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Contract ABI
const contractABI = [
  {
    inputs: [
      { internalType: "string", name: "gameId", type: "string" },
      { internalType: "string", name: "gameType", type: "string" },
    ],
    name: "startGame",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [{ internalType: "string", name: "gameId", type: "string" }],
    name: "getGameDetails",
    outputs: [
      { internalType: "string", name: "id", type: "string" },
      { internalType: "address", name: "player", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
      { internalType: "uint8", name: "status", type: "uint8" },
      { internalType: "uint256", name: "blockNumber", type: "uint256" },
      { internalType: "string", name: "gameType", type: "string" },
      { internalType: "uint256", name: "multiplierPercent", type: "uint256" },
      { internalType: "bool", name: "existsFlag", type: "bool" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{"internalType": "address", "name": "account", "type": "address"}],
    name: "getUserStats",
    outputs: [
      {"internalType": "uint256", "name": "totalBet", "type": "uint256"},
      {"internalType": "uint256", "name": "totalWon", "type": "uint256"},
      {"internalType": "uint256", "name": "totalLost", "type": "uint256"},
      {"internalType": "uint256", "name": "withdrawableBalance", "type": "uint256"},
      {"internalType": "uint256", "name": "gamesPlayed", "type": "uint256"},
      {"internalType": "uint256", "name": "gamesWon", "type": "uint256"},
      {"internalType": "uint256", "name": "joinBlock", "type": "uint256"},
      {"internalType": "uint256", "name": "joinTimestamp", "type": "uint256"},
      {"internalType": "uint256", "name": "lastPlayBlock", "type": "uint256"},
      {"internalType": "uint256", "name": "lastPlayTimestamp", "type": "uint256"}
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getContractStats",
    outputs: [
      {"internalType": "uint256", "name": "totalUsers", "type": "uint256"},
      {"internalType": "uint256", "name": "totalBets", "type": "uint256"},
      {"internalType": "uint256", "name": "totalWinnings", "type": "uint256"},
      {"internalType": "uint256", "name": "totalGames", "type": "uint256"}
    ],
    stateMutability: "view",
    type: "function",
  },
];

// Calculate game outcome
function calculateGameOutcome(gameType, betAmount) {
  const maxWinCELO = parseFloat(MAX_WIN_AMOUNT);
  const betAmountNum = parseFloat(betAmount);
  const MAX_MULTIPLIER_PERCENT = Math.floor((maxWinCELO / betAmountNum) * 100);
  const MAX_ALLOWED_MULTIPLIER_PERCENT = 1000; // 10x = 1000%
  
  const effectiveMaxMultiplier = Math.min(
    Math.max(MAX_MULTIPLIER_PERCENT, 100),
    MAX_ALLOWED_MULTIPLIER_PERCENT
  );
  
  const didWin = Math.random() > 0.5;
  const multiplierPercent = didWin ? Math.min(195, effectiveMaxMultiplier) : 100;
  const multiplierDecimal = multiplierPercent / 100;
  
  return { didWin, multiplier: multiplierDecimal, multiplierPercent };
}

// Get user stats
async function getUserStats(address) {
  const contract = new hre.ethers.Contract(CONTRACT_ADDRESS, contractABI, hre.ethers.provider);
  const stats = await contract.getUserStats(address);
  return {
    totalBet: hre.ethers.formatEther(stats[0]),
    totalWon: hre.ethers.formatEther(stats[1]),
    totalLost: hre.ethers.formatEther(stats[2]),
    withdrawableBalance: hre.ethers.formatEther(stats[3]),
    gamesPlayed: stats[4].toString(),
    gamesWon: stats[5].toString(),
    joinBlock: stats[6].toString(),
    joinTimestamp: stats[7].toString(),
    lastPlayBlock: stats[8].toString(),
    lastPlayTimestamp: stats[9].toString(),
  };
}

// Get contract stats
async function getContractStats() {
  const contract = new hre.ethers.Contract(CONTRACT_ADDRESS, contractABI, hre.ethers.provider);
  const stats = await contract.getContractStats();
  return {
    totalUsers: stats[0].toString(),
    totalBets: hre.ethers.formatEther(stats[1]),
    totalWinnings: hre.ethers.formatEther(stats[2]),
    totalGames: stats[3].toString(),
  };
}

// Get game details
async function getGameDetails(gameId) {
  const contract = new hre.ethers.Contract(CONTRACT_ADDRESS, contractABI, hre.ethers.provider);
  const details = await contract.getGameDetails(gameId);
  return {
    id: details[0],
    player: details[1],
    amount: hre.ethers.formatEther(details[2]),
    status: details[3].toString(), // 0: Pending, 1: Won, 2: Lost
    blockNumber: details[4].toString(),
    gameType: details[5],
    multiplierPercent: details[6].toString(),
    existsFlag: details[7],
  };
}

async function main() {
  console.log("\n🧪 SINGLE GAME TEST SCRIPT");
  console.log("=" .repeat(50));
  console.log(`Contract: ${CONTRACT_ADDRESS}`);
  console.log(`Resolver API: ${RESOLVER_API_URL}`);
  console.log(`Bet Amount: ${BET_AMOUNT} MNT`);
  console.log(`Max Win: ${MAX_WIN_AMOUNT} MNT`);
  console.log(`Max Multiplier: ${MAX_MULTIPLIER}x\n`);

  // Get funder wallet
  const [funder] = await hre.ethers.getSigners();
  console.log(`💰 Funder: ${funder.address}`);
  const funderBalance = await hre.ethers.provider.getBalance(funder.address);
  console.log(`   Balance: ${hre.ethers.formatEther(funderBalance)} MNT\n`);

  // Create test wallet
  const testWallet = hre.ethers.Wallet.createRandom().connect(hre.ethers.provider);
  console.log(`🎲 Test Wallet: ${testWallet.address}`);
  
  // Fund the wallet
  const fundingAmount = hre.ethers.parseEther("0.20");
  console.log(`💸 Funding wallet with ${hre.ethers.formatEther(fundingAmount)} MNT...`);
  const fundTx = await funder.sendTransaction({
    to: testWallet.address,
    value: fundingAmount,
  });
  await fundTx.wait();
  const walletBalance = await hre.ethers.provider.getBalance(testWallet.address);
  console.log(`✅ Wallet funded. Balance: ${hre.ethers.formatEther(walletBalance)} MNT\n`);

  // Get initial stats
  console.log("📊 Getting initial stats...");
  console.log("   User Stats:");
  const initialStats = await getUserStats(testWallet.address);
  console.log(`     Games Played: ${initialStats.gamesPlayed}`);
  console.log(`     Games Won: ${initialStats.gamesWon}`);
  console.log(`     Total Bet: ${initialStats.totalBet} MNT`);
  console.log(`     Total Won: ${initialStats.totalWon} MNT`);
  
  console.log("   Contract Stats:");
  const initialContractStats = await getContractStats();
  console.log(`     Total Users: ${initialContractStats.totalUsers}`);
  console.log(`     Total Bets: ${initialContractStats.totalBets} MNT`);
  console.log(`     Total Winnings: ${initialContractStats.totalWinnings} MNT`);
  console.log(`     Total Games: ${initialContractStats.totalGames}\n`);

  // Generate game ID and outcome
  const gameId = `test-${Date.now()}-${testWallet.address.slice(2, 10)}`;
  const gameType = "coinflip";
  const { didWin, multiplier, multiplierPercent } = calculateGameOutcome(gameType, BET_AMOUNT);
  
  console.log("🎮 Game Details:");
  console.log(`   Game ID: ${gameId}`);
  console.log(`   Game Type: ${gameType}`);
  console.log(`   Outcome: ${didWin ? "WIN" : "LOSE"}`);
  console.log(`   Multiplier: ${multiplier}x (${multiplierPercent}%)`);
  console.log(`   Bet Amount: ${BET_AMOUNT} MNT\n`);

  // Start game
  console.log("🚀 Starting game on-chain...");
  const contract = new hre.ethers.Contract(CONTRACT_ADDRESS, contractABI, testWallet);
  const betAmountWei = hre.ethers.parseEther(BET_AMOUNT);
  
  let startTx;
  try {
    startTx = await contract.startGame(gameId, gameType, {
      value: betAmountWei,
    });
    console.log(`   Transaction sent: ${startTx.hash}`);
    
    const startReceipt = await startTx.wait();
    console.log(`✅ Game started! Block: ${startReceipt.blockNumber}, Status: ${startReceipt.status ? "Success" : "Failed"}\n`);
  } catch (error) {
    console.error(`❌ Failed to start game:`, error.message);
    process.exit(1);
  }

  // Verify game was created
  console.log("🔍 Verifying game was created...");
  const gameDetails = await getGameDetails(gameId);
  console.log(`   Game ID: ${gameDetails.id}`);
  console.log(`   Player: ${gameDetails.player}`);
  console.log(`   Amount: ${gameDetails.amount} MNT`);
  console.log(`   Status: ${gameDetails.status} (0=Pending, 1=Won, 2=Lost)`);
  console.log(`   Game Type: ${gameDetails.gameType}\n`);

  if (gameDetails.status !== "0") {
    console.error(`❌ ERROR: Game status is ${gameDetails.status}, expected 0 (Pending)`);
    process.exit(1);
  }

  // Wait a bit before resolving
  console.log("⏳ Waiting 2 seconds before resolving...\n");
  await sleep(2000);

  // Resolve game via API
  console.log("🔧 Resolving game via API...");
  console.log(`   API URL: ${RESOLVER_API_URL}`);
  console.log(`   Payload: { gameId: "${gameId}", didWin: ${didWin}, multiplier: ${multiplier} (${multiplierPercent}%), gameType: "${gameType}", player: "${testWallet.address}" }`);
  
  let resolveResponse;
  let resolveTxHash;
  try {
    resolveResponse = await axios.post(RESOLVER_API_URL, {
      gameId,
      didWin,
      multiplier, // Send as decimal (e.g., 1.95)
      gameType,
      player: testWallet.address,
    }, {
      timeout: 60000, // 60 second timeout
    });
    
    console.log(`   Response Status: ${resolveResponse.status}`);
    console.log(`   Response Data:`, JSON.stringify(resolveResponse.data, null, 2));
    
    if (resolveResponse.data.success) {
      resolveTxHash = resolveResponse.data.transactionHash;
      console.log(`✅ Game resolved! Transaction: ${resolveTxHash}\n`);
    } else {
      console.error(`❌ API returned success=false:`, resolveResponse.data);
      process.exit(1);
    }
  } catch (apiError) {
    console.error(`❌ API call failed:`);
    if (apiError.response) {
      console.error(`   Status: ${apiError.response.status}`);
      console.error(`   Data:`, JSON.stringify(apiError.response.data, null, 2));
    } else {
      console.error(`   Error:`, apiError.message);
    }
    process.exit(1);
  }

  // Wait for transaction to be mined and verify receipt
  console.log("⏳ Waiting for transaction to be mined...");
  if (resolveTxHash) {
    try {
      // Poll for transaction receipt
      let receipt = null;
      let attempts = 0;
      const maxAttempts = 30; // 30 seconds max
      
      while (!receipt && attempts < maxAttempts) {
        await sleep(1000);
        try {
          receipt = await hre.ethers.provider.getTransactionReceipt(resolveTxHash);
        } catch (e) {
          // Transaction not mined yet
        }
        attempts++;
        if (attempts % 5 === 0) {
          console.log(`   Still waiting... (${attempts}s)`);
        }
      }
      
      if (!receipt) {
        console.error(`❌ ERROR: Transaction not found after ${maxAttempts} seconds!`);
        console.error(`   Transaction Hash: ${resolveTxHash}`);
        process.exit(1);
      }
      
      console.log(`   Transaction Receipt:`);
      console.log(`     Block Number: ${receipt.blockNumber}`);
      console.log(`     Status: ${receipt.status ? "✅ Success" : "❌ Failed"}`);
      console.log(`     Gas Used: ${receipt.gasUsed.toString()}`);
      
      if (!receipt.status) {
        console.error(`❌ ERROR: Transaction failed!`);
        process.exit(1);
      }
      console.log(`✅ Transaction confirmed on-chain!\n`);
    } catch (txError) {
      console.error(`❌ Error checking transaction:`, txError.message);
      console.log(`   Transaction Hash: ${resolveTxHash}`);
      console.log(`   Continuing anyway to check stats...\n`);
    }
  } else {
    console.log("⏳ Waiting 5 seconds...\n");
    await sleep(5000);
  }

  // Verify game was resolved
  console.log("🔍 Verifying game was resolved...");
  const resolvedGameDetails = await getGameDetails(gameId);
  console.log(`   Game ID: ${resolvedGameDetails.id}`);
  console.log(`   Status: ${resolvedGameDetails.status} (0=Pending, 1=Won, 2=Lost)`);
  console.log(`   Multiplier: ${resolvedGameDetails.multiplierPercent}%\n`);

  if (resolvedGameDetails.status === "0") {
    console.error(`❌ ERROR: Game is still pending after resolution!`);
    process.exit(1);
  }

  const expectedStatus = didWin ? "1" : "2";
  if (resolvedGameDetails.status !== expectedStatus) {
    console.error(`❌ ERROR: Game status is ${resolvedGameDetails.status}, expected ${expectedStatus}`);
    process.exit(1);
  }

  // Get final stats
  console.log("📊 Getting final stats...");
  console.log("   User Stats:");
  const finalStats = await getUserStats(testWallet.address);
  console.log(`     Games Played: ${finalStats.gamesPlayed} (was ${initialStats.gamesPlayed})`);
  console.log(`     Games Won: ${finalStats.gamesWon} (was ${initialStats.gamesWon})`);
  console.log(`     Total Bet: ${finalStats.totalBet} MNT (was ${initialStats.totalBet})`);
  console.log(`     Total Won: ${finalStats.totalWon} MNT (was ${initialStats.totalWon})`);
  
  console.log("   Contract Stats:");
  const finalContractStats = await getContractStats();
  console.log(`     Total Users: ${finalContractStats.totalUsers} (was ${initialContractStats.totalUsers})`);
  console.log(`     Total Bets: ${finalContractStats.totalBets} MNT (was ${initialContractStats.totalBets})`);
  console.log(`     Total Winnings: ${finalContractStats.totalWinnings} MNT (was ${initialContractStats.totalWinnings})`);
  console.log(`     Total Games: ${finalContractStats.totalGames} (was ${initialContractStats.totalGames})\n`);

  // Verify user stats
  const gamesPlayedBefore = parseInt(initialStats.gamesPlayed);
  const gamesPlayedAfter = parseInt(finalStats.gamesPlayed);
  
  if (gamesPlayedAfter === gamesPlayedBefore + 1) {
    console.log("✅ SUCCESS: User gamesPlayed incremented correctly!");
  } else {
    console.error(`❌ ERROR: User gamesPlayed did not increment!`);
    console.error(`   Expected: ${gamesPlayedBefore + 1}`);
    console.error(`   Got: ${gamesPlayedAfter}`);
    process.exit(1);
  }

  const totalBetBefore = parseFloat(initialStats.totalBet);
  const totalBetAfter = parseFloat(finalStats.totalBet);
  const betAmountFloat = parseFloat(BET_AMOUNT);
  
  if (Math.abs(totalBetAfter - (totalBetBefore + betAmountFloat)) < 0.0001) {
    console.log("✅ SUCCESS: User totalBet incremented correctly!");
  } else {
    console.error(`❌ ERROR: User totalBet did not increment correctly!`);
    console.error(`   Expected: ${totalBetBefore + betAmountFloat}`);
    console.error(`   Got: ${totalBetAfter}`);
  }

  if (didWin) {
    const gamesWonBefore = parseInt(initialStats.gamesWon);
    const gamesWonAfter = parseInt(finalStats.gamesWon);
    
    if (gamesWonAfter === gamesWonBefore + 1) {
      console.log("✅ SUCCESS: User gamesWon incremented correctly!");
    } else {
      console.error(`❌ ERROR: User gamesWon did not increment!`);
    }
  }

  // Verify contract stats
  const contractTotalGamesBefore = parseInt(initialContractStats.totalGames);
  const contractTotalGamesAfter = parseInt(finalContractStats.totalGames);
  
  if (contractTotalGamesAfter === contractTotalGamesBefore + 1) {
    console.log("✅ SUCCESS: Contract totalGames incremented correctly!");
  } else {
    console.error(`❌ ERROR: Contract totalGames did not increment!`);
    console.error(`   Expected: ${contractTotalGamesBefore + 1}`);
    console.error(`   Got: ${contractTotalGamesAfter}`);
  }

  const contractTotalBetsBefore = parseFloat(initialContractStats.totalBets);
  const contractTotalBetsAfter = parseFloat(finalContractStats.totalBets);
  
  if (Math.abs(contractTotalBetsAfter - (contractTotalBetsBefore + betAmountFloat)) < 0.0001) {
    console.log("✅ SUCCESS: Contract totalBets incremented correctly!");
  } else {
    console.error(`❌ ERROR: Contract totalBets did not increment correctly!`);
    console.error(`   Expected: ${contractTotalBetsBefore + betAmountFloat}`);
    console.error(`   Got: ${contractTotalBetsAfter}`);
  }

  console.log("\n" + "=".repeat(50));
  console.log("✅ TEST COMPLETED SUCCESSFULLY!");
  console.log("=".repeat(50) + "\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ TEST FAILED:");
    console.error(error);
    process.exit(1);
  });

