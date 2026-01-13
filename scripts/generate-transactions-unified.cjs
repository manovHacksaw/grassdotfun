const hre = require("hardhat");
const fs = require("fs");
const path = require("path");
const axios = require("axios");

// 🎲 UNIFIED TRANSACTION GENERATOR
// Creates 22 unique wallets, funds them, and makes them play games
// Relayer settles games on-chain via API route
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || "0x61d11C622Bd98A71aD9361833379A2066Ad29CCa";
const RESOLVER_API_URL = "https://grassdotfun.vercel.app/api/resolve-game-production" || "http://localhost:3000/api/resolve-game-production";
const NUMBER_OF_WALLETS = 22; // 22 unique wallets
const TOTAL_GAMES = 300; // 300 games = 600 transactions (start + resolve)
const FUNDING_PER_WALLET = "0.20"; // Each wallet gets 0.20 CELO (enough for ~12 games at 0.01 + gas)
const REFUND_THRESHOLD = "0.05"; // Re-fund wallet if balance drops below this
const MAX_WIN_AMOUNT = "0.1"; // Maximum win per game (10x multiplier with 0.01 bet)
const BET_AMOUNT = "0.01"; // Minimum bet amount per game
const DELAY_BETWEEN_TRANSACTIONS = 1500;
const DELAY_BEFORE_RESOLVE = 2000; // Wait before resolving
const WALLETS_FILE = path.join(__dirname, "generated-wallets-unified.json");

// Game types available on the platform
const GAME_TYPES = ["coinflip", "mines", "crash", "paaji"];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Generate wallets
function generateWallets(count) {
  console.log(`\n🔑 Creating ${count} random wallets...\n`);
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
  console.log(`\n✅ Wallets saved to generated-wallets-unified.json`);
  return wallets;
}

// Fund a single wallet
async function fundWallet(funder, wallet, targetAmount) {
  const balance = await hre.ethers.provider.getBalance(wallet.address);
  const balanceEth = parseFloat(hre.ethers.formatEther(balance));
  const targetEth = parseFloat(targetAmount);
  
  if (balanceEth < targetEth) {
    const needed = targetEth - balanceEth;
    console.log(`  Funding ${wallet.address.slice(0, 10)}... | Adding: ${needed.toFixed(4)} CELO`);
    
    const tx = await funder.sendTransaction({
      to: wallet.address,
      value: hre.ethers.parseEther(needed.toFixed(6)),
      gasLimit: 21000,
    });
    await tx.wait();
    const newBalance = await hre.ethers.provider.getBalance(wallet.address);
    console.log(`  ✅ Funded - Tx: ${tx.hash.slice(0, 20)}... | New balance: ${hre.ethers.formatEther(newBalance)} CELO`);
    await sleep(1000);
    return true;
  }
  return false;
}

// Fund wallets (only if needed)
async function fundWallets(wallets, amountPerWallet) {
  console.log(`\n💰 Checking and funding wallets...\n`);
  const [funder] = await hre.ethers.getSigners();
  const funderBalance = await hre.ethers.provider.getBalance(funder.address);
  console.log(`Funder: ${funder.address}`);
  console.log(`Balance: ${hre.ethers.formatEther(funderBalance)} CELO\n`);
  
  const minRequiredBalance = parseFloat(BET_AMOUNT) * 5 + 0.01; // Enough for 5 games + gas
  const targetBalance = parseFloat(amountPerWallet);
  
  // Check which wallets need funding
  const walletsToFund = [];
  let totalNeeded = 0;
  
  console.log("🔍 Checking wallet balances...\n");
  for (let i = 0; i < wallets.length; i++) {
    const wallet = wallets[i];
    const balance = await hre.ethers.provider.getBalance(wallet.address);
    const balanceEth = parseFloat(hre.ethers.formatEther(balance));
    
    if (balanceEth < minRequiredBalance) {
      const needed = targetBalance - balanceEth;
      walletsToFund.push({ wallet, index: i, currentBalance: balanceEth, needed });
      totalNeeded += needed;
      console.log(`  Wallet ${i + 1}: ${wallet.address.slice(0, 10)}... | Balance: ${balanceEth.toFixed(4)} CELO | ⚠️  Needs funding (${needed.toFixed(4)} CELO)`);
    } else {
      console.log(`  Wallet ${i + 1}: ${wallet.address.slice(0, 10)}... | Balance: ${balanceEth.toFixed(4)} CELO | ✅ Sufficient`);
    }
  }
  
  if (walletsToFund.length === 0) {
    console.log("\n✅ All wallets have sufficient balance, skipping funding!\n");
    return;
  }
  
  console.log(`\n📊 Funding Summary:`);
  console.log(`   Wallets needing funding: ${walletsToFund.length}/${wallets.length}`);
  console.log(`   Total CELO needed: ${totalNeeded.toFixed(4)}`);
  
  const gasBuffer = 0.1; // Gas buffer for funding transactions
  if (parseFloat(hre.ethers.formatEther(funderBalance)) < totalNeeded + gasBuffer) {
    throw new Error(`Need at least ${(totalNeeded + gasBuffer).toFixed(2)} CELO (have ${hre.ethers.formatEther(funderBalance)})`);
  }
  
  console.log(`\n💰 Funding ${walletsToFund.length} wallets...\n`);
  
  for (let i = 0; i < walletsToFund.length; i++) {
    const { wallet, index, needed } = walletsToFund[i];
    console.log(`Funding ${i + 1}/${walletsToFund.length}: Wallet ${index + 1} (${wallet.address.slice(0, 10)}...)`);
    console.log(`  Current: ${walletsToFund[i].currentBalance.toFixed(4)} CELO | Adding: ${needed.toFixed(4)} CELO`);
    
    await fundWallet(funder, wallet, amountPerWallet);
  }
  console.log("\n✅ Funding complete!\n");
  
  // Verify all wallets have balance
  console.log("🔍 Final wallet balances:\n");
  for (let i = 0; i < wallets.length; i++) {
    const balance = await hre.ethers.provider.getBalance(wallets[i].address);
    const balanceEth = parseFloat(hre.ethers.formatEther(balance));
    const status = balanceEth >= minRequiredBalance ? "✅" : "⚠️";
    console.log(`  ${status} Wallet ${i + 1}: ${balanceEth.toFixed(4)} CELO`);
  }
  console.log();
}

// Check and re-fund wallet if needed
async function checkAndRefundWallet(wallet) {
  const balance = await hre.ethers.provider.getBalance(wallet.address);
  const balanceEth = parseFloat(hre.ethers.formatEther(balance));
  const refundThreshold = parseFloat(REFUND_THRESHOLD);
  const targetBalance = parseFloat(FUNDING_PER_WALLET);
  
  if (balanceEth < refundThreshold) {
    const [funder] = await hre.ethers.getSigners();
    const funderBalance = await hre.ethers.provider.getBalance(funder.address);
    const needed = targetBalance - balanceEth;
    const gasBuffer = 0.01;
    
    if (parseFloat(hre.ethers.formatEther(funderBalance)) >= needed + gasBuffer) {
      console.log(`  💰 Re-funding wallet ${wallet.address.slice(0, 10)}... (balance: ${balanceEth.toFixed(4)} CELO)`);
      await fundWallet(funder, wallet, FUNDING_PER_WALLET);
      return true;
    } else {
      console.log(`  ⚠️  Cannot re-fund wallet ${wallet.address.slice(0, 10)}... (insufficient funds in main wallet)`);
      return false;
    }
  }
  return false;
}

// Get random game type
function getRandomGameType() {
  return GAME_TYPES[Math.floor(Math.random() * GAME_TYPES.length)];
}

// Calculate win/loss and multiplier based on game type
// Max win is capped at 0.1 CELO regardless of bet amount
function calculateGameOutcome(gameType, betAmount) {
  let didWin;
  let multiplierPercent;
  
  // Calculate max multiplier based on bet amount to ensure max win is 0.1 CELO
  const maxWinCELO = parseFloat(MAX_WIN_AMOUNT);
  const betAmountNum = parseFloat(betAmount);
  const MAX_MULTIPLIER_PERCENT = Math.floor((maxWinCELO / betAmountNum) * 100); // Convert to percentage
  
  // Cap at 10x maximum (1000%)
  const MAX_ALLOWED_MULTIPLIER_PERCENT = 1000; // 10x = 1000%
  
  // Ensure minimum multiplier is at least 100% (1x - break even)
  const effectiveMaxMultiplier = Math.min(
    Math.max(MAX_MULTIPLIER_PERCENT, 100),
    MAX_ALLOWED_MULTIPLIER_PERCENT
  );
  
  switch (gameType) {
    case "coinflip":
      didWin = Math.random() > 0.5;
      multiplierPercent = didWin ? Math.min(195, effectiveMaxMultiplier) : 100;
      break;
    case "mines":
      didWin = Math.random() > 0.45;
      if (didWin) {
        const range = effectiveMaxMultiplier - 150;
        multiplierPercent = range > 0 
          ? Math.floor(Math.random() * range) + 150
          : 150;
        multiplierPercent = Math.min(multiplierPercent, effectiveMaxMultiplier);
      } else {
        multiplierPercent = 100;
      }
      break;
    case "crash":
      didWin = Math.random() > 0.6;
      if (didWin) {
        const range = effectiveMaxMultiplier - 110;
        multiplierPercent = range > 0
          ? Math.floor(Math.random() * range) + 110
          : 110;
        multiplierPercent = Math.min(multiplierPercent, effectiveMaxMultiplier);
      } else {
        multiplierPercent = 100;
      }
      break;
    case "paaji":
      didWin = Math.random() > 0.5;
      if (didWin) {
        const range = effectiveMaxMultiplier - 120;
        multiplierPercent = range > 0
          ? Math.floor(Math.random() * range) + 120
          : 120;
        multiplierPercent = Math.min(multiplierPercent, effectiveMaxMultiplier);
      } else {
        multiplierPercent = 100;
      }
      break;
    default:
      didWin = Math.random() > 0.5;
      multiplierPercent = didWin ? Math.min(150, effectiveMaxMultiplier) : 100;
  }
  
  // Convert percentage to decimal for API (195% -> 1.95, 1000% -> 10.0)
  const multiplierDecimal = multiplierPercent / 100;
  
  return { didWin, multiplier: multiplierDecimal, multiplierPercent };
  
  // Final safety check
  multiplier = Math.min(multiplier, effectiveMaxMultiplier);
  
  // Double-check: calculate actual win amount and cap if needed
  const actualWin = (betAmountNum * multiplier) / 100;
  if (actualWin > maxWinCELO) {
    multiplier = Math.floor((maxWinCELO / betAmountNum) * 100);
  }
  
  return { didWin, multiplier };
}

// Play a single game (start + resolve)
async function playGame(wallet, gameNumber, totalGames, retries = 3) {
  // Declare walletBalance outside try block so it's accessible in catch
  let walletBalance = null;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const connectedWallet = new hre.ethers.Wallet(
        wallet.privateKey,
        hre.ethers.provider
      );

      // Check wallet balance before attempting
      try {
        walletBalance = await hre.ethers.provider.getBalance(connectedWallet.address);
      } catch (e) {
        walletBalance = null;
      }
      
      const betAmountWei = hre.ethers.parseEther(BET_AMOUNT);
      const estimatedGasCost = hre.ethers.parseEther("0.002");
      const minRequired = betAmountWei + estimatedGasCost;

      if (!walletBalance || walletBalance < minRequired) {
        // Try to re-fund the wallet
        const refunded = await checkAndRefundWallet(wallet);
        if (refunded) {
          // Re-check balance after funding
          walletBalance = await hre.ethers.provider.getBalance(connectedWallet.address);
          if (walletBalance < minRequired) {
            const balanceStr = hre.ethers.formatEther(walletBalance);
            throw new Error(
              `Insufficient balance after re-funding: ${balanceStr} CELO (need ${hre.ethers.formatEther(minRequired)})`
            );
          }
        } else {
          const balanceStr = walletBalance ? hre.ethers.formatEther(walletBalance) : "unknown";
          throw new Error(
            `Insufficient balance: ${balanceStr} CELO (need ${hre.ethers.formatEther(minRequired)})`
          );
        }
      }

      // Generate unique game ID
      let gameId = `test-${Date.now()}-${wallet.address.slice(2, 10)}-${Math.random().toString(36).substring(2, 9)}`;
      const gameType = getRandomGameType();
      const { didWin, multiplier } = calculateGameOutcome(gameType, BET_AMOUNT);

      // Load full ABI from contract file
      let contractABI;
      const abiPath = path.join(__dirname, "../contract/abi.json");
      if (fs.existsSync(abiPath)) {
        contractABI = JSON.parse(fs.readFileSync(abiPath, "utf8"));
      } else {
        contractABI = [
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
            inputs: [
              { internalType: "string", name: "gameId", type: "string" },
              { internalType: "bool", name: "didWin", type: "bool" },
              { internalType: "uint256", name: "multiplierPercent", type: "uint256" },
            ],
            name: "resolveGame",
            outputs: [],
            stateMutability: "nonpayable",
            type: "function",
          },
          {
            inputs: [],
            name: "getResolverAccount",
            outputs: [{"internalType": "address", "name": "", "type": "address"}],
            stateMutability: "view",
            type: "function",
          },
        ];
      }

      const contract = new hre.ethers.Contract(
        CONTRACT_ADDRESS,
        contractABI,
        connectedWallet
      );

      // Check if gameId already exists
      try {
        const gameDetails = await contract.getGameDetails(gameId);
        if (gameDetails.existsFlag) {
          gameId = `test-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
        }
      } catch (e) {
        // Game doesn't exist, that's fine
      }

      // Verify contract exists
      try {
        const code = await hre.ethers.provider.getCode(CONTRACT_ADDRESS);
        if (code === "0x") {
          throw new Error(`No contract found at address ${CONTRACT_ADDRESS}`);
        }
      } catch (codeError) {
        throw new Error(`Failed to verify contract: ${codeError.message}`);
      }

      // Let ethers.js handle gas estimation automatically
      let gasEstimate;
      try {
        gasEstimate = await contract.startGame.estimateGas(gameId, gameType, {
          value: betAmountWei,
        });
      } catch (gasError) {
        // Ignore gas estimation errors
      }
      
      let startTx;
      try {
        startTx = await contract.startGame(gameId, gameType, {
          value: betAmountWei,
        });
      } catch (txError) {
        let errorMsg = txError.message || "Unknown error";
        
        if (txError.data && txError.data !== "0x") {
          try {
            const iface = new hre.ethers.Interface(contractABI);
            const decoded = iface.parseError(txError.data);
            if (decoded) {
              errorMsg = `Transaction failed: ${decoded.name}(${decoded.args.join(", ")})`;
            }
          } catch (e) {
            if (txError.reason) {
              errorMsg = `Transaction failed: ${txError.reason}`;
            }
          }
        } else if (txError.reason) {
          errorMsg = `Transaction failed: ${txError.reason}`;
        }
        
        throw new Error(errorMsg);
      }
      
      const receipt = await startTx.wait();
      
      if (!receipt.status) {
        throw new Error(`Transaction reverted in block ${receipt.blockNumber}`);
      }

      await sleep(DELAY_BEFORE_RESOLVE);

      // Resolve game via API route (which uses relayer to settle on-chain)
      try {
        // multiplier is already in decimal format (e.g., 1.95 for 1.95x)
        const multiplierPercent = Math.round(multiplier * 100);
        console.log(`   🔧 Calling API to resolve game: ${gameId} | ${didWin ? "WIN" : "LOSE"} | ${multiplier}x (${multiplierPercent}%)`);
        
        const resolveResponse = await axios.post(RESOLVER_API_URL, {
          gameId,
          didWin,
          multiplier, // Send as decimal (e.g., 1.95) - API expects this format
          gameType,
          player: wallet.address,
        });

        if (resolveResponse.data.success) {
          wallet.gamesPlayed++;
          const progress = ((gameNumber / totalGames) * 100).toFixed(1);
          const resolveTxHash = resolveResponse.data.transactionHash || "pending";
          console.log(
            `✅ Game ${gameNumber}/${totalGames} (${progress}%) | ` +
              `Wallet ${wallet.address.slice(0, 8)}... | ` +
              `Type: ${gameType} | ${didWin ? "WIN" : "LOSE"} ${multiplier}x | ` +
              `Start: ${startTx.hash.slice(0, 10)}... | Resolve: ${resolveTxHash.slice(0, 10)}...`
          );
          await sleep(DELAY_BETWEEN_TRANSACTIONS);
          return true;
        } else {
          throw new Error(resolveResponse.data.message || "API resolution failed");
        }
      } catch (apiError) {
        console.error(
          `⚠️  API resolution failed for game ${gameNumber}:`,
          apiError.response?.data?.message || apiError.message
        );
        // Game was started but not resolved - still count it
        wallet.gamesPlayed++;
        return true;
      }
    } catch (error) {
      let errorMsg = error.message || String(error);
      
      if (error.reason) {
        errorMsg = error.reason;
      } else if (error.data) {
        errorMsg = `Revert data: ${error.data}`;
      }

      if (attempt < retries) {
        console.error(
          `⚠️  Game ${gameNumber} attempt ${attempt} failed, retrying...`
        );
        console.error(`   Error: ${errorMsg.slice(0, 100)}`);
        await sleep(5000);
      } else {
        console.error(
          `❌ Game ${gameNumber} failed after ${retries} attempts:`
        );
        console.error(`   Error: ${errorMsg}`);
        console.error(`   Wallet: ${wallet.address}`);
        if (!walletBalance) {
          try {
            const connectedWallet = new hre.ethers.Wallet(wallet.privateKey, hre.ethers.provider);
            walletBalance = await hre.ethers.provider.getBalance(connectedWallet.address);
          } catch (e) {
            // Ignore error
          }
        }
        const balanceStr = walletBalance ? hre.ethers.formatEther(walletBalance) : 'unknown';
        console.error(`   Balance: ${balanceStr} CELO`);
        
        if (errorMsg.includes("insufficient funds") || errorMsg.includes("Insufficient balance")) {
          console.error(`   ⚠️  Wallet has insufficient funds`);
        }
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
  console.log("🎲 UNIFIED GAME TRANSACTION GENERATOR");
  console.log("   Playing real games: Coinflip, Mines, Crash, Paaji");
  console.log("=".repeat(70));

  const [mainWallet] = await hre.ethers.getSigners();
  console.log(`\n💰 Main Wallet: ${mainWallet.address}`);
  
  const startBalance = await hre.ethers.provider.getBalance(mainWallet.address);
  console.log(`💰 Starting Balance: ${hre.ethers.formatEther(startBalance)} CELO`);

  console.log(`\n📋 Configuration:`);
  console.log(`   Contract: ${CONTRACT_ADDRESS}`);
  console.log(`   Resolver API: ${RESOLVER_API_URL}`);
  console.log(`   ⚠️  Note: API route must use relayer to settle games on-chain`);
  
  // Verify contract address
  try {
    const code = await hre.ethers.provider.getCode(CONTRACT_ADDRESS);
    if (code === "0x") {
      console.error(`\n❌ ERROR: No contract found at address ${CONTRACT_ADDRESS}`);
      return;
    } else {
      console.log(`   ✅ Contract verified at address`);
    }
  } catch (e) {
    console.warn(`   ⚠️  Could not verify contract: ${e.message}`);
  }
  
  console.log(`   Wallets: ${NUMBER_OF_WALLETS}`);
  console.log(`   Total games: ${TOTAL_GAMES} (randomly distributed)`);
  console.log(`   Expected transactions: ${TOTAL_GAMES * 2}`);
  console.log(`   Max win per game: ${MAX_WIN_AMOUNT} CELO (10x multiplier)`);
  const estimatedCost = NUMBER_OF_WALLETS * parseFloat(FUNDING_PER_WALLET) + 0.5;
  console.log(`   Estimated cost: ~${estimatedCost.toFixed(2)} CELO`);
  console.log(`   Breakdown: ${NUMBER_OF_WALLETS} wallets × ${FUNDING_PER_WALLET} CELO = ${(NUMBER_OF_WALLETS * parseFloat(FUNDING_PER_WALLET)).toFixed(2)} CELO + ~0.5 CELO gas`);
  console.log(`   Estimated time: ~${Math.ceil((TOTAL_GAMES * 2 * DELAY_BETWEEN_TRANSACTIONS) / 1000 / 60)} minutes`);
  console.log(`   Game types: ${GAME_TYPES.join(", ")}`);

  // Generate or load wallets
  let wallets;
  if (fs.existsSync(WALLETS_FILE)) {
    console.log(`\n📂 Loading existing wallets from ${WALLETS_FILE}...`);
    wallets = JSON.parse(fs.readFileSync(WALLETS_FILE, "utf8"));
    console.log(`✅ Loaded ${wallets.length} existing wallets`);
    
    if (wallets.length !== NUMBER_OF_WALLETS) {
      console.log(`\n⚠️  Warning: Found ${wallets.length} wallets, but expected ${NUMBER_OF_WALLETS}`);
      if (wallets.length < NUMBER_OF_WALLETS) {
        console.log(`   Generating ${NUMBER_OF_WALLETS - wallets.length} additional wallets...`);
        const additionalWallets = generateWallets(NUMBER_OF_WALLETS - wallets.length);
        wallets = wallets.concat(additionalWallets);
      } else {
        console.log(`   Using existing ${wallets.length} wallets\n`);
      }
    }
    
    console.log("\n📋 Existing Wallets:");
    for (let i = 0; i < wallets.length; i++) {
      const balance = await hre.ethers.provider.getBalance(wallets[i].address);
      console.log(`  ${i + 1}. ${wallets[i].address} | Balance: ${hre.ethers.formatEther(balance)} CELO | Games: ${wallets[i].gamesPlayed || 0}`);
    }
    console.log();
  } else {
    console.log(`\n📂 No existing wallet file found. Creating new wallets...`);
    wallets = generateWallets(NUMBER_OF_WALLETS);
  }

  // Fund wallets (only if needed)
  console.log(`\n⏳ Starting wallet funding check in 3 seconds...`);
  await sleep(3000);
  
  const minRequiredBalance = parseFloat(BET_AMOUNT) * 5 + 0.01;
  let totalNeeded = 0;
  let walletsNeedingFunding = 0;
  
  for (const wallet of wallets) {
    const balance = await hre.ethers.provider.getBalance(wallet.address);
    const balanceEth = parseFloat(hre.ethers.formatEther(balance));
    if (balanceEth < minRequiredBalance) {
      walletsNeedingFunding++;
      const needed = parseFloat(FUNDING_PER_WALLET) - balanceEth;
      totalNeeded += needed > 0 ? needed : 0;
    }
  }
  
  if (totalNeeded > 0) {
    const currentMainBalance = await hre.ethers.provider.getBalance(mainWallet.address);
    const gasBuffer = 0.1;
    const requiredTotal = totalNeeded + gasBuffer;
    
    if (parseFloat(hre.ethers.formatEther(currentMainBalance)) < requiredTotal) {
      console.log(`\n⚠️  Main wallet doesn't have enough to fund ${walletsNeedingFunding} wallet(s)!`);
      console.log(`   Current balance: ${hre.ethers.formatEther(currentMainBalance)} CELO`);
      console.log(`   Needed for funding: ${totalNeeded.toFixed(4)} CELO`);
      console.log(`\n💡 Continuing with existing funded wallets...`);
    } else {
      await fundWallets(wallets, FUNDING_PER_WALLET);
    }
  } else {
    console.log(`\n✅ All wallets have sufficient balance, no funding needed!`);
  }
  
  // Save wallets
  fs.writeFileSync(WALLETS_FILE, JSON.stringify(wallets, null, 2));

  // Execute games
  console.log(`\n⏳ Starting randomized game execution...\n`);
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
      console.log(`\n📊 Wallet Distribution:`);
      wallets.forEach((w, idx) => {
        console.log(
          `   Wallet ${idx + 1}: ${w.gamesPlayed} games (${w.address.slice(0, 10)}...)`
        );
      });
      console.log();
    }
    
    // Save progress periodically
    if ((i + 1) % 25 === 0) {
      fs.writeFileSync(WALLETS_FILE, JSON.stringify(wallets, null, 2));
    }
  }

  // Final summary
  const endTime = Date.now();
  const totalTime = Math.ceil((endTime - startTime) / 1000);
  const endBalance = await hre.ethers.provider.getBalance(mainWallet.address);
  const totalSpent = parseFloat(hre.ethers.formatEther(startBalance - endBalance));

  console.log("\n" + "=".repeat(70));
  console.log("🎉 UNIFIED SCRIPT COMPLETE!");
  console.log("=".repeat(70));
  console.log(`\n📊 Final Summary:`);
  console.log(`   Wallets used: ${wallets.length} different addresses`);
  console.log(`   Successful games: ${successCount}`);
  console.log(`   Failed games: ${failCount}`);
  console.log(`   Total transactions: ${successCount * 2}`);
  console.log(`   Time taken: ${Math.floor(totalTime / 60)}m ${totalTime % 60}s`);
  console.log(`   Total CELO spent: ${totalSpent.toFixed(4)}`);
  console.log(`   Main wallet balance: ${hre.ethers.formatEther(endBalance)} CELO`);
  console.log(`\n💡 Wallet file saved: ${WALLETS_FILE}\n`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Error:", error);
    process.exit(1);
  });

