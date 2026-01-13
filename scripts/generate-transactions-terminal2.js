import hre from "hardhat";
import fs from "fs";
import path from "path";
import axios from "axios";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 🎲 TERMINAL 2 - Optimized for 1.2 MNT budget
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || "0x61d11C622Bd98A71aD9361833379A2066Ad29CCa";
const RESOLVER_API_URL = process.env.RESOLVER_API_URL || "https://grassdotfun.vercel.app/api/resolve-game-production";
const NUMBER_OF_WALLETS = 3; // Reduced for 1.2 MNT budget
const TOTAL_GAMES = 60; // 60 games = 120 transactions (start + resolve)
const FUNDING_PER_WALLET = "0.25"; // Each wallet gets 0.25 MNT (enough for ~20 games at 0.01 + gas)
const BET_AMOUNT = "0.01"; // Minimum bet amount per game
const DELAY_BETWEEN_TRANSACTIONS = 1500;
const DELAY_BEFORE_RESOLVE = 2000; // Wait before resolving
const WALLETS_FILE = path.join(__dirname, "generated-wallets-terminal2.json");

// Game types available on the platform
const GAME_TYPES = ["coinflip", "mines", "crash", "paaji"];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Generate wallets
function generateWallets(count) {
  console.log(`\n🔑 [TERMINAL 2] Creating ${count} random wallets...\n`);
  const wallets = [];
  for (let i = 0; i < count; i++) {
    const wallet = hre.ethers.Wallet.createRandom();
    wallets.push({
      address: wallet.address,
      privateKey: wallet.privateKey,
      gamesPlayed: 0,
    });
    console.log(`  Wallet ${i + 1}: ${wallet.address}`);
  }
  fs.writeFileSync(WALLETS_FILE, JSON.stringify(wallets, null, 2));
  console.log(`\n✅ Wallets saved to generated-wallets-terminal2.json`);
  return wallets;
}

// Fund wallets
async function fundWallets(wallets, amountPerWallet) {
  console.log(
    `\n💰 [TERMINAL 2] Funding ${wallets.length} wallets with ${amountPerWallet} MNT each...\n`
  );
  const [funder] = await hre.ethers.getSigners();
  const funderBalance = await hre.ethers.provider.getBalance(funder.address);
  console.log(`Funder: ${funder.address}`);
  console.log(`Balance: ${hre.ethers.formatEther(funderBalance)} MNT\n`);
  const totalNeeded = parseFloat(amountPerWallet) * wallets.length;
  const gasBuffer = 0.2; // Gas buffer for funding transactions
  if (parseFloat(hre.ethers.formatEther(funderBalance)) < totalNeeded + gasBuffer) {
    throw new Error(`Need at least ${(totalNeeded + gasBuffer).toFixed(2)} MNT (have ${hre.ethers.formatEther(funderBalance)})`);
  }
  for (let i = 0; i < wallets.length; i++) {
    const wallet = wallets[i];
    console.log(
      `Funding ${i + 1}/${wallets.length}: ${wallet.address.slice(0, 10)}...`
    );
    const tx = await funder.sendTransaction({
      to: wallet.address,
      value: hre.ethers.parseEther(amountPerWallet),
      gasLimit: 21000,
    });
    await tx.wait();
    console.log(`  ✅ Funded - Tx: ${tx.hash.slice(0, 20)}...`);
    await sleep(1000);
  }
  console.log("\n✅ All wallets funded!\n");
}

// Get random game type
function getRandomGameType() {
  return GAME_TYPES[Math.floor(Math.random() * GAME_TYPES.length)];
}

// Calculate win/loss and multiplier based on game type
function calculateGameOutcome(gameType) {
  let didWin;
  let multiplier;
  
  switch (gameType) {
    case "coinflip":
      // 50% win rate, 1.95x multiplier
      didWin = Math.random() > 0.5;
      multiplier = didWin ? 195 : 100; // 195% = 1.95x
      break;
    case "mines":
      // 40-60% win rate, variable multiplier (1.5x to 24x)
      didWin = Math.random() > 0.45;
      if (didWin) {
        multiplier = Math.floor(Math.random() * 2250) + 150; // 150% to 2400% (1.5x to 24x)
      } else {
        multiplier = 100;
      }
      break;
    case "crash":
      // 30-50% win rate, variable multiplier (1.1x to 10x)
      didWin = Math.random() > 0.6;
      if (didWin) {
        multiplier = Math.floor(Math.random() * 900) + 110; // 110% to 1000% (1.1x to 10x)
      } else {
        multiplier = 100;
      }
      break;
    case "paaji":
      // 45-65% win rate, variable multiplier (1.2x to 5x)
      didWin = Math.random() > 0.5;
      if (didWin) {
        multiplier = Math.floor(Math.random() * 380) + 120; // 120% to 500% (1.2x to 5x)
      } else {
        multiplier = 100;
      }
      break;
    default:
      didWin = Math.random() > 0.5;
      multiplier = didWin ? 150 : 100;
  }
  
  return { didWin, multiplier };
}

// Play a single game (start + resolve)
async function playGame(wallet, gameNumber, totalGames, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const connectedWallet = new hre.ethers.Wallet(
        wallet.privateKey,
        hre.ethers.provider
      );

      // Get contract ABI for startGame
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
      ];

      const contract = new hre.ethers.Contract(
        CONTRACT_ADDRESS,
        contractABI,
        connectedWallet
      );

      // Generate unique game ID
      const gameId = `test-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      const gameType = getRandomGameType();
      const { didWin, multiplier } = calculateGameOutcome(gameType);

      // Start game
      const startTx = await contract.startGame(gameId, gameType, {
        value: hre.ethers.parseEther(BET_AMOUNT),
        gasLimit: 200000,
      });
      await startTx.wait();

      await sleep(DELAY_BEFORE_RESOLVE);

      // Resolve game via API
      try {
        const resolveResponse = await axios.post(RESOLVER_API_URL, {
          gameId,
          didWin,
          multiplier,
          gameType,
          player: wallet.address,
        });

        if (resolveResponse.data.success) {
          wallet.gamesPlayed++;
          const progress = ((gameNumber / totalGames) * 100).toFixed(1);
          console.log(
            `✅ [T2] Game ${gameNumber}/${totalGames} (${progress}%) | ` +
              `Wallet ${wallet.address.slice(0, 8)}... | ` +
              `Type: ${gameType} | ${didWin ? "WIN" : "LOSE"} ${multiplier}% | ` +
              `Txns: ${gameNumber * 2}`
          );
          await sleep(DELAY_BETWEEN_TRANSACTIONS);
          return true;
        } else {
          throw new Error("API resolution failed");
        }
      } catch (apiError) {
        console.error(
          `⚠️  [T2] API resolution failed for game ${gameNumber}:`,
          apiError.message
        );
        // Continue anyway - game was started
        wallet.gamesPlayed++;
        return true;
      }
    } catch (error) {
      if (attempt < retries) {
        console.error(
          `⚠️  [T2] Game ${gameNumber} attempt ${attempt} failed, retrying... (${error.message.slice(
            0,
            50
          )})`
        );
        await sleep(5000);
      } else {
        console.error(
          `❌ [T2] Game ${gameNumber} failed after ${retries} attempts:`,
          error.message.slice(0, 80)
        );
        return false;
      }
    }
  }
  return false;
}

// Get random wallet (weighted by usage)
function getRandomWallet(wallets) {
  const maxGames = Math.max(...wallets.map((w) => w.gamesPlayed));
  const weights = wallets.map((w) => maxGames - w.gamesPlayed + 1);
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  let random = Math.random() * totalWeight;
  for (let i = 0; i < wallets.length; i++) {
    random -= weights[i];
    if (random <= 0) {
      return wallets[i];
    }
  }
  return wallets[wallets.length - 1];
}

// Main execution
async function main() {
  console.log("\n" + "=".repeat(70));
  console.log("🎲 TERMINAL 2 - RANDOMIZED GAME TRANSACTION GENERATOR");
  console.log("   Playing real games: Coinflip, Mines, Crash, Paaji");
  console.log("=".repeat(70));

  const [mainWallet] = await hre.ethers.getSigners();
  const startBalance = await hre.ethers.provider.getBalance(mainWallet.address);
  console.log(`\n💰 Main Wallet: ${mainWallet.address}`);
  console.log(
    `💰 Starting Balance: ${hre.ethers.formatEther(startBalance)} MNT`
  );

  // Calculate required balance
  const requiredBalance = NUMBER_OF_WALLETS * parseFloat(FUNDING_PER_WALLET) + 0.2; // 0.2 for gas buffer
  if (parseFloat(hre.ethers.formatEther(startBalance)) < requiredBalance) {
    console.log(`\n❌ Need at least ${requiredBalance.toFixed(2)} MNT to run!`);
    console.log(`   Current balance: ${hre.ethers.formatEther(startBalance)} MNT`);
    return;
  }

  console.log(`\n📋 Configuration:`);
  console.log(`   Terminal: 2 (Second set)`);
  console.log(`   Contract: ${CONTRACT_ADDRESS}`);
  console.log(`   Resolver API: ${RESOLVER_API_URL}`);
  console.log(`   Wallets: ${NUMBER_OF_WALLETS}`);
  console.log(`   Total games: ${TOTAL_GAMES} (randomly distributed)`);
  console.log(`   Expected transactions: ${TOTAL_GAMES * 2}`);
  const estimatedCost = NUMBER_OF_WALLETS * parseFloat(FUNDING_PER_WALLET) + 0.2;
  console.log(
    `   Estimated cost: ~${estimatedCost.toFixed(2)} MNT`
  );
  console.log(
    `   Breakdown: ${NUMBER_OF_WALLETS} wallets × ${FUNDING_PER_WALLET} MNT = ${(NUMBER_OF_WALLETS * parseFloat(FUNDING_PER_WALLET)).toFixed(2)} MNT + ~0.2 MNT gas`
  );
  console.log(
    `   Estimated time: ~${Math.ceil(
      (TOTAL_GAMES * 2 * DELAY_BETWEEN_TRANSACTIONS) / 1000 / 60
    )} minutes`
  );
  console.log(`   Game types: ${GAME_TYPES.join(", ")}`);

  // Generate or load wallets
  let wallets;
  if (fs.existsSync(WALLETS_FILE)) {
    console.log(`\n📂 Loading existing wallets...`);
    wallets = JSON.parse(fs.readFileSync(WALLETS_FILE, "utf8"));
    console.log(`✅ Loaded ${wallets.length} wallets`);
  } else {
    wallets = generateWallets(NUMBER_OF_WALLETS);
  }

  // Fund wallets
  console.log(`\n⏳ Starting in 3 seconds...`);
  await sleep(3000);
  await fundWallets(wallets, FUNDING_PER_WALLET);

  // Execute games with random wallet selection
  console.log(`\n⏳ [TERMINAL 2] Starting randomized game execution...\n`);
  await sleep(3000);

  const startTime = Date.now();
  let successCount = 0;
  let failCount = 0;

  // Main game loop
  for (let i = 0; i < TOTAL_GAMES; i++) {
    const wallet = getRandomWallet(wallets);
    const success = await playGame(wallet, i + 1, TOTAL_GAMES);
    if (success) {
      successCount++;
    } else {
      failCount++;
    }

    // Show wallet distribution every 50 games
    if ((i + 1) % 50 === 0) {
      console.log(`\n📊 [T2] Wallet Distribution:`);
      wallets.forEach((w, idx) => {
        console.log(
          `   Wallet ${idx + 1}: ${w.gamesPlayed} games (${w.address.slice(
            0,
            10
          )}...)`
        );
      });
      console.log();
    }
  }

  // Final summary
  const endTime = Date.now();
  const totalTime = Math.ceil((endTime - startTime) / 1000);
  const endBalance = await hre.ethers.provider.getBalance(mainWallet.address);
  const totalSpent = hre.ethers.formatEther(startBalance - endBalance);

  console.log("\n" + "=".repeat(70));
  console.log("🎉 [TERMINAL 2] COMPLETE!");
  console.log("=".repeat(70));
  console.log(`\n📊 Final Summary:`);
  console.log(`   Terminal: 2`);
  console.log(`   Wallets used: ${wallets.length} different addresses`);
  console.log(`   Successful games: ${successCount}`);
  console.log(`   Failed games: ${failCount}`);
  console.log(`   Total transactions: ${successCount * 2}`);
  console.log(
    `   Time taken: ${Math.floor(totalTime / 60)}m ${totalTime % 60}s`
  );
  console.log(`   Total MNT spent: ${totalSpent}`);
  console.log(
    `   Main wallet balance: ${hre.ethers.formatEther(endBalance)} MNT`
  );
  console.log(`\n💡 To collect leftover funds, run:`);
  console.log(
    `   npx hardhat run scripts/collect-funds-terminal2.js --network celo\n`
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Error:", error);
    process.exit(1);
  });

