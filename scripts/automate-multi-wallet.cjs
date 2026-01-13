const hre = require("hardhat");
const fs = require("fs");
const path = require("path");
const axios = require("axios");

// 🎮 MULTI-WALLET GAME AUTOMATION FOR MANTLE SEPOLIA
// Creates multiple wallets, funds them, and plays games automatically
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || "0x61d11C622Bd98A71aD9361833379A2066Ad29CCa";
const RESOLVER_API_URL = process.env.RESOLVER_API_URL || "http://localhost:3000/api/resolve-game-production";

// Configuration
const CONFIG = {
  NUMBER_OF_WALLETS: 10,
  GAMES_PER_WALLET: 5,
  FUNDING_PER_WALLET: "0.15", // MNT per wallet
  BET_AMOUNT: "0.01", // MNT per game
  REFUND_THRESHOLD: "0.05", // Re-fund if below this
  DELAY_BETWEEN_GAMES: 2000,
  DELAY_BEFORE_RESOLVE: 1500,
  WIN_PROBABILITY: 0.52,
  MIN_MULTIPLIER: 1.5,
  MAX_MULTIPLIER: 2.5,
  GAME_TYPES: ["coinflip", "mines", "rugs", "paaji"],
  WALLETS_FILE: path.join(__dirname, "auto-wallets.json"),
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
    inputs: [{ internalType: "address", name: "account", type: "address" }],
    name: "getUserStats",
    outputs: [
      { internalType: "uint256", name: "totalBet", type: "uint256" },
      { internalType: "uint256", name: "totalWon", type: "uint256" },
      { internalType: "uint256", name: "totalLost", type: "uint256" },
      { internalType: "uint256", name: "withdrawableBalance", type: "uint256" },
      { internalType: "uint256", name: "gamesPlayed", type: "uint256" },
      { internalType: "uint256", name: "gamesWon", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
];

// Generate or load wallets
function getOrCreateWallets() {
  if (fs.existsSync(CONFIG.WALLETS_FILE)) {
    console.log(`📂 Loading existing wallets from ${CONFIG.WALLETS_FILE}`);
    const wallets = JSON.parse(fs.readFileSync(CONFIG.WALLETS_FILE, "utf8"));
    console.log(`✅ Loaded ${wallets.length} wallets\n`);
    return wallets;
  }

  console.log(`🔑 Creating ${CONFIG.NUMBER_OF_WALLETS} new wallets...\n`);
  const wallets = [];
  for (let i = 0; i < CONFIG.NUMBER_OF_WALLETS; i++) {
    const wallet = hre.ethers.Wallet.createRandom();
    wallets.push({
      id: i + 1,
      address: wallet.address,
      privateKey: wallet.privateKey,
      gamesPlayed: 0,
      gamesWon: 0,
    });
    console.log(`  Wallet ${i + 1}: ${wallet.address}`);
  }
  fs.writeFileSync(CONFIG.WALLETS_FILE, JSON.stringify(wallets, null, 2));
  console.log(`\n✅ Wallets saved to ${CONFIG.WALLETS_FILE}\n`);
  return wallets;
}

// Fund a wallet
async function fundWallet(funder, walletAddress, amount) {
  const balance = await hre.ethers.provider.getBalance(walletAddress);
  const balanceMNT = parseFloat(hre.ethers.formatEther(balance));
  const targetMNT = parseFloat(amount);

  if (balanceMNT < targetMNT) {
    const needed = targetMNT - balanceMNT;
    console.log(`  💰 Funding ${walletAddress.slice(0, 10)}... Adding: ${needed.toFixed(4)} MNT`);

    const tx = await funder.sendTransaction({
      to: walletAddress,
      value: hre.ethers.parseEther(needed.toFixed(6)),
    });
    await tx.wait();
    console.log(`  ✅ Funded - Tx: ${tx.hash.slice(0, 20)}...`);
    await sleep(1000);
    return true;
  }
  return false;
}

// Fund all wallets
async function fundAllWallets(wallets) {
  console.log(`\n💰 Funding wallets...\n`);
  const [funder] = await hre.ethers.getSigners();
  const funderBalance = await hre.ethers.provider.getBalance(funder.address);
  console.log(`Funder: ${funder.address}`);
  console.log(`Balance: ${hre.ethers.formatEther(funderBalance)} MNT\n`);

  for (let i = 0; i < wallets.length; i++) {
    const wallet = wallets[i];
    const balance = await hre.ethers.provider.getBalance(wallet.address);
    const balanceMNT = parseFloat(hre.ethers.formatEther(balance));

    if (balanceMNT < parseFloat(CONFIG.REFUND_THRESHOLD)) {
      await fundWallet(funder, wallet.address, CONFIG.FUNDING_PER_WALLET);
    } else {
      console.log(`  ✅ Wallet ${i + 1}: ${balanceMNT.toFixed(4)} MNT (sufficient)`);
    }
  }
  console.log("\n✅ Funding complete!\n");
}

// Generate game outcome
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

// Play a single game
async function playGame(walletData, gameNumber) {
  const gameId = `mw-${walletData.id}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  const gameType = getRandomGameType();

  console.log(`\n${"─".repeat(50)}`);
  console.log(`🎮 Wallet ${walletData.id} - Game ${gameNumber}`);
  console.log(`${"─".repeat(50)}`);
  console.log(`📝 Game ID: ${gameId}`);
  console.log(`🎯 Type: ${gameType}`);
  console.log(`💰 Bet: ${CONFIG.BET_AMOUNT} MNT`);

  try {
    // Create signer from private key
    const wallet = new hre.ethers.Wallet(walletData.privateKey, hre.ethers.provider);
    const contract = new hre.ethers.Contract(CONTRACT_ADDRESS, contractABI, wallet);
    const betAmountWei = hre.ethers.parseEther(CONFIG.BET_AMOUNT);

    // Start game
    console.log(`⏳ Starting game...`);
    const startTx = await contract.startGame(gameId, gameType, { value: betAmountWei });
    console.log(`📤 Tx: ${startTx.hash}`);
    await startTx.wait();
    console.log(`✅ Started!`);

    // Wait before resolving
    await sleep(CONFIG.DELAY_BEFORE_RESOLVE);

    // Generate outcome and resolve
    const outcome = generateOutcome();
    console.log(`🎲 Outcome: ${outcome.didWin ? "WIN 🎉" : "LOSE 😔"} ${outcome.didWin ? `(${outcome.multiplier}x)` : ""}`);

    const resolveResponse = await axios.post(RESOLVER_API_URL, {
      gameId,
      didWin: outcome.didWin,
      multiplier: outcome.multiplier,
      gameType,
      player: walletData.address,
    });

    if (resolveResponse.data.success) {
      console.log(`✅ Resolved: ${resolveResponse.data.transactionHash.slice(0, 20)}...`);
      if (outcome.didWin) walletData.gamesWon++;
    } else {
      console.log(`❌ Resolution failed: ${resolveResponse.data.message}`);
      return false;
    }

    walletData.gamesPlayed++;
    return true;
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    return false;
  }
}

// Play games for a single wallet
async function playGamesForWallet(walletData) {
  console.log(`\n${"═".repeat(60)}`);
  console.log(`🎮 Starting games for Wallet ${walletData.id}`);
  console.log(`   Address: ${walletData.address}`);
  console.log(`${"═".repeat(60)}`);

  let successCount = 0;

  for (let i = 1; i <= CONFIG.GAMES_PER_WALLET; i++) {
    const success = await playGame(walletData, i);
    if (success) successCount++;

    // Check balance
    const balance = await hre.ethers.provider.getBalance(walletData.address);
    const balanceMNT = parseFloat(hre.ethers.formatEther(balance));
    console.log(`💰 Balance: ${balanceMNT.toFixed(4)} MNT`);

    if (balanceMNT < parseFloat(CONFIG.BET_AMOUNT) * 1.5) {
      console.log(`⚠️  Low balance, stopping games for this wallet`);
      break;
    }

    if (i < CONFIG.GAMES_PER_WALLET) {
      await sleep(CONFIG.DELAY_BETWEEN_GAMES);
    }
  }

  console.log(`\n📊 Wallet ${walletData.id} Summary:`);
  console.log(`   Played: ${successCount}/${CONFIG.GAMES_PER_WALLET}`);
  console.log(`   Won: ${walletData.gamesWon}`);
}

// Main function
async function main() {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║       🎮 MULTI-WALLET AUTOMATION - MANTLE SEPOLIA          ║
╚════════════════════════════════════════════════════════════╝
  `);

  console.log(`\n📋 Configuration:`);
  console.log(`   Wallets: ${CONFIG.NUMBER_OF_WALLETS}`);
  console.log(`   Games per wallet: ${CONFIG.GAMES_PER_WALLET}`);
  console.log(`   Bet amount: ${CONFIG.BET_AMOUNT} MNT`);
  console.log(`   Win probability: ${(CONFIG.WIN_PROBABILITY * 100).toFixed(0)}%`);
  console.log(`   Game types: ${CONFIG.GAME_TYPES.join(", ")}`);

  // Get or create wallets
  const wallets = getOrCreateWallets();

  // Fund wallets
  await fundAllWallets(wallets);

  console.log(`\n🚀 Starting automation...\n`);
  const startTime = Date.now();

  let totalGames = 0;
  let totalWins = 0;

  // Play games for each wallet
  for (let i = 0; i < wallets.length; i++) {
    await playGamesForWallet(wallets[i]);
    totalGames += wallets[i].gamesPlayed;
    totalWins += wallets[i].gamesWon;

    // Save progress
    fs.writeFileSync(CONFIG.WALLETS_FILE, JSON.stringify(wallets, null, 2));
  }

  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);

  console.log(`\n${"═".repeat(60)}`);
  console.log(`🏁 Automation Complete!`);
  console.log(`${"═".repeat(60)}`);
  console.log(`⏱️  Duration: ${duration}s`);
  console.log(`🎮 Total games: ${totalGames}`);
  console.log(`🏆 Total wins: ${totalWins}`);
  console.log(`📊 Win rate: ${((totalWins / totalGames) * 100).toFixed(1)}%`);

  console.log(`\n📂 Wallet data saved to: ${CONFIG.WALLETS_FILE}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Fatal error:", error);
    process.exit(1);
  });
