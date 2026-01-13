const hre = require("hardhat");
const axios = require("axios");

// 🎮 AUTOMATED GAME PLAYER
// Continuously plays games with configurable settings
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || "0x61d11C622Bd98A71aD9361833379A2066Ad29CCa";
const RESOLVER_API_URL = process.env.RESOLVER_API_URL || "http://localhost:3000/api/resolve-game-production";

// Configuration
const CONFIG = {
  BET_AMOUNT: "0.01", // Bet amount in MNT
  GAMES_TO_PLAY: 3, // Number of games to play (0 = infinite)
  DELAY_BETWEEN_GAMES: 3000, // Delay in ms between games
  DELAY_BEFORE_RESOLVE: 2000, // Delay before resolving game
  WIN_PROBABILITY: 0.55, // 55% win rate
  MIN_MULTIPLIER: 1.5, // Minimum multiplier for wins
  MAX_MULTIPLIER: 2.5, // Maximum multiplier for wins
  GAME_TYPES: ["coinflip", "mines", "rugs", "paaji"], // Game types to play
};

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
    inputs: [{ internalType: "address", name: "account", type: "address" }],
    name: "getUserStats",
    outputs: [
      { internalType: "uint256", name: "totalBet", type: "uint256" },
      { internalType: "uint256", name: "totalWon", type: "uint256" },
      { internalType: "uint256", name: "totalLost", type: "uint256" },
      { internalType: "uint256", name: "withdrawableBalance", type: "uint256" },
      { internalType: "uint256", name: "gamesPlayed", type: "uint256" },
      { internalType: "uint256", name: "gamesWon", type: "uint256" },
      { internalType: "uint256", name: "joinBlock", type: "uint256" },
      { internalType: "uint256", name: "joinTimestamp", type: "uint256" },
      { internalType: "uint256", name: "lastPlayBlock", type: "uint256" },
      { internalType: "uint256", name: "lastPlayTimestamp", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
];

// Generate random game outcome
function generateOutcome() {
  const didWin = Math.random() < CONFIG.WIN_PROBABILITY;
  let multiplier = 1.0;

  if (didWin) {
    multiplier = CONFIG.MIN_MULTIPLIER + Math.random() * (CONFIG.MAX_MULTIPLIER - CONFIG.MIN_MULTIPLIER);
  }

  return {
    didWin,
    multiplier: parseFloat(multiplier.toFixed(2)),
  };
}

// Get random game type
function getRandomGameType() {
  const index = Math.floor(Math.random() * CONFIG.GAME_TYPES.length);
  return CONFIG.GAME_TYPES[index];
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
  };
}

// Play a single game
async function playSingleGame(signer, gameNumber, totalGames) {
  const gameId = `auto-game-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  const gameType = getRandomGameType();
  const playerAddress = await signer.getAddress();

  console.log(`\n${"=".repeat(60)}`);
  console.log(`🎮 Game ${gameNumber}/${totalGames === 0 ? '∞' : totalGames}`);
  console.log(`${"=".repeat(60)}`);
  console.log(`📝 Game ID: ${gameId}`);
  console.log(`🎯 Game Type: ${gameType}`);
  console.log(`💰 Bet Amount: ${CONFIG.BET_AMOUNT} MNT`);
  console.log(`👤 Player: ${playerAddress}`);

  try {
    // Step 1: Start the game
    console.log(`\n⏳ Starting game...`);
    const contract = new hre.ethers.Contract(CONTRACT_ADDRESS, contractABI, signer);
    const betAmountWei = hre.ethers.parseEther(CONFIG.BET_AMOUNT);

    const startTx = await contract.startGame(gameId, gameType, { value: betAmountWei });
    console.log(`📤 Transaction sent: ${startTx.hash}`);

    const startReceipt = await startTx.wait();
    console.log(`✅ Game started in block ${startReceipt.blockNumber}`);

    // Step 2: Wait before resolving
    console.log(`\n⏱️  Waiting ${CONFIG.DELAY_BEFORE_RESOLVE}ms before resolving...`);
    await sleep(CONFIG.DELAY_BEFORE_RESOLVE);

    // Step 3: Generate outcome and resolve
    const outcome = generateOutcome();
    console.log(`\n🎲 Outcome: ${outcome.didWin ? "WIN 🎉" : "LOSE 😔"}`);
    if (outcome.didWin) {
      console.log(`📊 Multiplier: ${outcome.multiplier}x`);
    }

    console.log(`\n⏳ Resolving game via API...`);
    const resolveResponse = await axios.post(RESOLVER_API_URL, {
      gameId,
      didWin: outcome.didWin,
      multiplier: outcome.multiplier,
      gameType,
      player: playerAddress,
    });

    if (resolveResponse.data.success) {
      console.log(`✅ Game resolved: ${resolveResponse.data.transactionHash}`);
    } else {
      console.log(`❌ Resolution failed:`, resolveResponse.data.message);
      return false;
    }

    // Step 4: Verify game details
    await sleep(2000);
    const gameDetails = await contract.getGameDetails(gameId);
    const status = ["Pending", "Won", "Lost"][gameDetails[3]];

    console.log(`\n📊 Game Status: ${status}`);
    console.log(`💵 Game Amount: ${hre.ethers.formatEther(gameDetails[2])} MNT`);

    return true;
  } catch (error) {
    console.error(`\n❌ Error in game ${gameNumber}:`, error.message);
    return false;
  }
}

// Main automation function
async function main() {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║           🎮 AUTOMATED GAME PLAYER - MANTLE SEPOLIA        ║
╚════════════════════════════════════════════════════════════╝
  `);

  // Get signer
  const [signer] = await hre.ethers.getSigners();
  const playerAddress = await signer.getAddress();
  const balance = await hre.ethers.provider.getBalance(playerAddress);

  console.log(`\n📋 Configuration:`);
  console.log(`   Player Address: ${playerAddress}`);
  console.log(`   Balance: ${hre.ethers.formatEther(balance)} MNT`);
  console.log(`   Bet Amount: ${CONFIG.BET_AMOUNT} MNT`);
  console.log(`   Games to Play: ${CONFIG.GAMES_TO_PLAY === 0 ? 'Infinite' : CONFIG.GAMES_TO_PLAY}`);
  console.log(`   Win Probability: ${(CONFIG.WIN_PROBABILITY * 100).toFixed(0)}%`);
  console.log(`   Multiplier Range: ${CONFIG.MIN_MULTIPLIER}x - ${CONFIG.MAX_MULTIPLIER}x`);
  console.log(`   Game Types: ${CONFIG.GAME_TYPES.join(", ")}`);

  // Get initial stats
  console.log(`\n📊 Initial Stats:`);
  const initialStats = await getUserStats(playerAddress);
  console.log(`   Games Played: ${initialStats.gamesPlayed}`);
  console.log(`   Games Won: ${initialStats.gamesWon}`);
  console.log(`   Total Bet: ${initialStats.totalBet} MNT`);
  console.log(`   Total Won: ${initialStats.totalWon} MNT`);
  console.log(`   Withdrawable: ${initialStats.withdrawableBalance} MNT`);

  console.log(`\n🚀 Starting automation...`);
  console.log(`   Press Ctrl+C to stop\n`);

  let gameNumber = 1;
  let successCount = 0;
  let failCount = 0;

  const startTime = Date.now();

  while (CONFIG.GAMES_TO_PLAY === 0 || gameNumber <= CONFIG.GAMES_TO_PLAY) {
    const success = await playSingleGame(signer, gameNumber, CONFIG.GAMES_TO_PLAY);

    if (success) {
      successCount++;
    } else {
      failCount++;
    }

    // Show progress
    console.log(`\n📈 Progress: ${successCount} successful, ${failCount} failed`);

    // Check balance
    const currentBalance = await hre.ethers.provider.getBalance(playerAddress);
    console.log(`💰 Current Balance: ${hre.ethers.formatEther(currentBalance)} MNT`);

    // Stop if balance is too low
    const minBalance = hre.ethers.parseEther("0.05");
    if (currentBalance < minBalance) {
      console.log(`\n⚠️  Balance too low! Stopping automation.`);
      break;
    }

    // Delay before next game
    if (CONFIG.GAMES_TO_PLAY === 0 || gameNumber < CONFIG.GAMES_TO_PLAY) {
      console.log(`\n⏸️  Waiting ${CONFIG.DELAY_BETWEEN_GAMES}ms before next game...`);
      await sleep(CONFIG.DELAY_BETWEEN_GAMES);
    }

    gameNumber++;
  }

  // Final stats
  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);

  console.log(`\n${"=".repeat(60)}`);
  console.log(`🏁 Automation Complete!`);
  console.log(`${"=".repeat(60)}`);
  console.log(`⏱️  Duration: ${duration}s`);
  console.log(`✅ Successful: ${successCount}`);
  console.log(`❌ Failed: ${failCount}`);

  const finalStats = await getUserStats(playerAddress);
  console.log(`\n📊 Final Stats:`);
  console.log(`   Games Played: ${finalStats.gamesPlayed}`);
  console.log(`   Games Won: ${finalStats.gamesWon}`);
  console.log(`   Total Bet: ${finalStats.totalBet} MNT`);
  console.log(`   Total Won: ${finalStats.totalWon} MNT`);
  console.log(`   Withdrawable: ${finalStats.withdrawableBalance} MNT`);

  const profit = parseFloat(finalStats.totalWon) - parseFloat(finalStats.totalBet);
  console.log(`   Net Profit/Loss: ${profit >= 0 ? '+' : ''}${profit.toFixed(4)} MNT`);

  const finalBalance = await hre.ethers.provider.getBalance(playerAddress);
  console.log(`\n💰 Final Balance: ${hre.ethers.formatEther(finalBalance)} MNT`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Fatal error:", error);
    process.exit(1);
  });
