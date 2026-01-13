const hre = require("hardhat");
const fs = require("fs");
const path = require("path");
const axios = require("axios");

// 🎲 TERMINAL 4 - Optimized for 1.8 MNT budget (runs simultaneously with Terminal 2 & 3)
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || "0x61d11C622Bd98A71aD9361833379A2066Ad29CCa";
const RESOLVER_API_URL = process.env.RESOLVER_API_URL || "http://localhost:3000/api/resolve-game-production";
const NUMBER_OF_WALLETS = 10; // 10 unique wallets
const TOTAL_GAMES = 100; // 100 games = 200 transactions (start + resolve)
const FUNDING_PER_WALLET = "0.20"; // Each wallet gets 0.20 MNT (enough for ~12 games at 0.01 + gas)
const MAX_WIN_AMOUNT = "0.1"; // Maximum win per game (10x multiplier with 0.01 bet)
const BET_AMOUNT = "0.01"; // Minimum bet amount per game
const DELAY_BETWEEN_TRANSACTIONS = 1500;
const DELAY_BEFORE_RESOLVE = 2000; // Wait before resolving
const WALLETS_FILE = path.join(__dirname, "generated-wallets-terminal4.json");

// Game types available on the platform
const GAME_TYPES = ["coinflip", "mines", "crash", "paaji"];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Generate wallets
function generateWallets(count) {
  console.log(`\n🔑 [TERMINAL 4] Creating ${count} random wallets...\n`);
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
  console.log(`\n✅ Wallets saved to generated-wallets-terminal4.json`);
  return wallets;
}

// Fund wallets (only if needed)
async function fundWallets(wallets, amountPerWallet) {
  console.log(
    `\n💰 [TERMINAL 4] Checking and funding wallets...\n`
  );
  const [funder] = await hre.ethers.getSigners();
  const funderBalance = await hre.ethers.provider.getBalance(funder.address);
  console.log(`Funder: ${funder.address}`);
  console.log(`Balance: ${hre.ethers.formatEther(funderBalance)} MNT\n`);
  
  // Minimum required balance per wallet (bet amount + gas for multiple games)
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
      console.log(`  Wallet ${i + 1}: ${wallet.address.slice(0, 10)}... | Balance: ${balanceEth.toFixed(4)} MNT | ⚠️  Needs funding (${needed.toFixed(4)} MNT)`);
    } else {
      console.log(`  Wallet ${i + 1}: ${wallet.address.slice(0, 10)}... | Balance: ${balanceEth.toFixed(4)} MNT | ✅ Sufficient`);
    }
  }
  
  if (walletsToFund.length === 0) {
    console.log("\n✅ All wallets have sufficient balance, skipping funding!\n");
    return;
  }
  
  console.log(`\n📊 Funding Summary:`);
  console.log(`   Wallets needing funding: ${walletsToFund.length}/${wallets.length}`);
  console.log(`   Total MNT needed: ${totalNeeded.toFixed(4)}`);
  
  const gasBuffer = 0.1; // Gas buffer for funding transactions
  if (parseFloat(hre.ethers.formatEther(funderBalance)) < totalNeeded + gasBuffer) {
    throw new Error(`Need at least ${(totalNeeded + gasBuffer).toFixed(2)} MNT (have ${hre.ethers.formatEther(funderBalance)})`);
  }
  
  console.log(`\n💰 Funding ${walletsToFund.length} wallets...\n`);
  
  for (let i = 0; i < walletsToFund.length; i++) {
    const { wallet, index, needed } = walletsToFund[i];
    console.log(
      `Funding ${i + 1}/${walletsToFund.length}: Wallet ${index + 1} (${wallet.address.slice(0, 10)}...)`
    );
    console.log(`  Current: ${walletsToFund[i].currentBalance.toFixed(4)} MNT | Adding: ${needed.toFixed(4)} MNT`);
    
    const tx = await funder.sendTransaction({
      to: wallet.address,
      value: hre.ethers.parseEther(needed.toFixed(6)),
      gasLimit: 21000,
    });
    await tx.wait();
    const newBalance = await hre.ethers.provider.getBalance(wallet.address);
    console.log(`  ✅ Funded - Tx: ${tx.hash.slice(0, 20)}... | New balance: ${hre.ethers.formatEther(newBalance)} MNT`);
    await sleep(1000);
  }
  console.log("\n✅ Funding complete!\n");
  
  // Verify all wallets have balance
  console.log("🔍 Final wallet balances:\n");
  for (let i = 0; i < wallets.length; i++) {
    const balance = await hre.ethers.provider.getBalance(wallets[i].address);
    const balanceEth = parseFloat(hre.ethers.formatEther(balance));
    const status = balanceEth >= minRequiredBalance ? "✅" : "⚠️";
    console.log(`  ${status} Wallet ${i + 1}: ${balanceEth.toFixed(4)} MNT`);
  }
  console.log();
}

// Get random game type
function getRandomGameType() {
  return GAME_TYPES[Math.floor(Math.random() * GAME_TYPES.length)];
}

// Calculate win/loss and multiplier based on game type
// Max win is capped at 0.1 MNT regardless of bet amount
function calculateGameOutcome(gameType, betAmount) {
  let didWin;
  let multiplier;
  
  // Calculate max multiplier based on bet amount to ensure max win is 0.1 MNT
  // maxMultiplier = (0.1 / betAmount) * 100 (convert to percentage)
  const maxWinMNT = parseFloat(MAX_WIN_AMOUNT);
  const betAmountNum = parseFloat(betAmount);
  const MAX_MULTIPLIER = Math.floor((maxWinMNT / betAmountNum) * 100); // Convert to percentage
  
  // Ensure minimum multiplier is at least 100% (1x - break even)
  const effectiveMaxMultiplier = Math.max(MAX_MULTIPLIER, 100);
  
  switch (gameType) {
    case "coinflip":
      // 50% win rate, 1.95x multiplier (capped by max)
      didWin = Math.random() > 0.5;
      multiplier = didWin ? Math.min(195, effectiveMaxMultiplier) : 100; // 195% = 1.95x
      break;
    case "mines":
      // 40-60% win rate, variable multiplier (1.5x to max)
      didWin = Math.random() > 0.45;
      if (didWin) {
        const range = effectiveMaxMultiplier - 150;
        multiplier = range > 0 
          ? Math.floor(Math.random() * range) + 150 // 150% to max
          : 150; // If max is too low, use minimum
        multiplier = Math.min(multiplier, effectiveMaxMultiplier);
      } else {
        multiplier = 100;
      }
      break;
    case "crash":
      // 30-50% win rate, variable multiplier (1.1x to max)
      didWin = Math.random() > 0.6;
      if (didWin) {
        const range = effectiveMaxMultiplier - 110;
        multiplier = range > 0
          ? Math.floor(Math.random() * range) + 110 // 110% to max
          : 110; // If max is too low, use minimum
        multiplier = Math.min(multiplier, effectiveMaxMultiplier);
      } else {
        multiplier = 100;
      }
      break;
    case "paaji":
      // 45-65% win rate, variable multiplier (1.2x to max)
      didWin = Math.random() > 0.5;
      if (didWin) {
        const range = effectiveMaxMultiplier - 120;
        multiplier = range > 0
          ? Math.floor(Math.random() * range) + 120 // 120% to max
          : 120; // If max is too low, use minimum
        multiplier = Math.min(multiplier, effectiveMaxMultiplier);
      } else {
        multiplier = 100;
      }
      break;
    default:
      didWin = Math.random() > 0.5;
      multiplier = didWin ? Math.min(150, effectiveMaxMultiplier) : 100;
  }
  
  // Final safety check: ensure multiplier never exceeds max and win never exceeds 0.1 MNT
  multiplier = Math.min(multiplier, effectiveMaxMultiplier);
  
  // Double-check: calculate actual win amount and cap if needed
  const actualWin = (betAmountNum * multiplier) / 100;
  if (actualWin > maxWinMNT) {
    // Recalculate multiplier to ensure win is exactly at max
    multiplier = Math.floor((maxWinMNT / betAmountNum) * 100);
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
      // Estimate gas cost more accurately - use a higher buffer for safety
      const estimatedGasCost = hre.ethers.parseEther("0.002"); // More conservative gas estimate
      const minRequired = betAmountWei + estimatedGasCost; // Bet + gas

      if (!walletBalance || walletBalance < minRequired) {
        const balanceStr = walletBalance ? hre.ethers.formatEther(walletBalance) : "unknown";
        throw new Error(
          `Insufficient balance: ${balanceStr} MNT (need ${hre.ethers.formatEther(minRequired)})`
        );
      }

      // Generate unique game ID with more entropy
      let gameId = `test-${Date.now()}-${wallet.address.slice(2, 10)}-${Math.random().toString(36).substring(2, 9)}`;
      const gameType = getRandomGameType();
      const { didWin, multiplier } = calculateGameOutcome(gameType, BET_AMOUNT);

      // Load full ABI from contract file
      let contractABI;
      const abiPath = path.join(__dirname, "../contract/abi.json");
      if (fs.existsSync(abiPath)) {
        contractABI = JSON.parse(fs.readFileSync(abiPath, "utf8"));
      } else {
        // Fallback to minimal ABI if file doesn't exist
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
        ];
      }

      const contract = new hre.ethers.Contract(
        CONTRACT_ADDRESS,
        contractABI,
        connectedWallet
      );

      // Check if gameId already exists (unlikely but check anyway)
      try {
        const gameDetails = await contract.getGameDetails(gameId);
        if (gameDetails.existsFlag) {
          console.log(`⚠️  Game ID collision detected, generating new ID...`);
          // Generate new ID
          gameId = `test-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
        }
      } catch (e) {
        // Game doesn't exist, that's fine
      }

      // Verify contract exists and is callable
      try {
        const code = await hre.ethers.provider.getCode(CONTRACT_ADDRESS);
        if (code === "0x") {
          throw new Error(`No contract found at address ${CONTRACT_ADDRESS} on network ${hre.network.name}`);
        }
        console.log(`   [Debug] Contract code length: ${code.length} bytes`);
        
        // Try to call a view function to verify contract is working
        try {
          const iface = new hre.ethers.Interface(contractABI);
          const contractView = new hre.ethers.Contract(CONTRACT_ADDRESS, contractABI, hre.ethers.provider);
          const resolver = await contractView.getResolverAccount();
          console.log(`   [Debug] Contract resolver: ${resolver}`);
        } catch (viewError) {
          console.warn(`   [Warning] Could not call view function: ${viewError.message}`);
        }
      } catch (codeError) {
        throw new Error(`Failed to verify contract: ${codeError.message}`);
      }

      // Let ethers.js handle gas estimation automatically (like the frontend does)
      // MetaMask works fine without explicit gas limits, so we'll do the same
      // Optionally log the gas estimate for debugging
      let gasEstimate;
      try {
        gasEstimate = await contract.startGame.estimateGas(gameId, gameType, {
          value: betAmountWei,
        });
        console.log(`   [Debug] Gas estimate: ${gasEstimate.toString()}`);
      } catch (gasError) {
        console.warn(`   [Warning] Could not estimate gas: ${gasError.message}`);
      }
      
      let startTx;
      try {
        startTx = await contract.startGame(gameId, gameType, {
          value: betAmountWei,
          // No explicit gasLimit - let ethers.js estimate automatically (like MetaMask)
        });
      } catch (txError) {
        // Try to extract revert reason from transaction error
        let errorMsg = txError.message || "Unknown error";
        
        // Try to decode error data
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
            } else if (txError.error && txError.error.message) {
              errorMsg = `Transaction failed: ${txError.error.message}`;
            }
          }
        } else if (txError.reason) {
          errorMsg = `Transaction failed: ${txError.reason}`;
        }
        
        console.error(`   [Error Details] ${JSON.stringify(txError, null, 2).substring(0, 500)}`);
        throw new Error(errorMsg);
      }
      
      console.log(`   [Debug] Transaction sent: ${startTx.hash}`);
      
      const receipt = await startTx.wait();
      
      if (!receipt.status) {
        // Try to get revert reason from receipt
        throw new Error(`Transaction reverted in block ${receipt.blockNumber}. Check transaction ${startTx.hash} on explorer.`);
      }
      
      console.log(`   [Debug] Transaction confirmed in block: ${receipt.blockNumber}`);

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
            `✅ [T4] Game ${gameNumber}/${totalGames} (${progress}%) | ` +
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
          `⚠️  [T4] API resolution failed for game ${gameNumber}:`,
          apiError.message
        );
        // Continue anyway - game was started
        wallet.gamesPlayed++;
        return true;
      }
    } catch (error) {
      // Extract more detailed error information
      let errorMsg = error.message || String(error);
      
      // Try to get revert reason if available
      if (error.reason) {
        errorMsg = error.reason;
      } else if (error.data) {
        errorMsg = `Revert data: ${error.data}`;
      } else if (error.transaction) {
        errorMsg = `Transaction reverted: ${error.transaction.hash}`;
      }

      if (attempt < retries) {
        console.error(
          `⚠️  [T4] Game ${gameNumber} attempt ${attempt} failed, retrying...`
        );
        console.error(`   Error: ${errorMsg.slice(0, 100)}`);
        await sleep(5000);
      } else {
        console.error(
          `❌ [T4] Game ${gameNumber} failed after ${retries} attempts:`
        );
        console.error(`   Error: ${errorMsg}`);
        console.error(`   Wallet: ${wallet.address}`);
        // Get current balance if not already fetched
        if (!walletBalance) {
          try {
            const connectedWallet = new hre.ethers.Wallet(wallet.privateKey, hre.ethers.provider);
            walletBalance = await hre.ethers.provider.getBalance(connectedWallet.address);
          } catch (e) {
            // Ignore error
          }
        }
        const balanceStr = walletBalance ? hre.ethers.formatEther(walletBalance) : 'unknown';
        console.error(`   Balance: ${balanceStr} MNT`);
        
        // If it's an insufficient funds error, skip this wallet for future games
        if (errorMsg.includes("insufficient funds") || errorMsg.includes("Insufficient balance")) {
          console.error(`   ⚠️  Wallet has insufficient funds - will skip in future games`);
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
  console.log("🎲 TERMINAL 4 - RANDOMIZED GAME TRANSACTION GENERATOR");
  console.log("   Playing real games: Coinflip, Mines, Crash, Paaji");
  console.log("=".repeat(70));

  const [mainWallet] = await hre.ethers.getSigners();
  console.log(`\n💰 Main Wallet: ${mainWallet.address}`);
  
  // First, check if wallets exist and are funded (before checking main wallet balance)
  let existingWalletsFunded = false;
  if (fs.existsSync(WALLETS_FILE)) {
    try {
      const existingWallets = JSON.parse(fs.readFileSync(WALLETS_FILE, "utf8"));
      if (existingWallets.length > 0) {
        // Check if wallets have sufficient balance
        const minRequiredBalance = parseFloat(BET_AMOUNT) * 5 + 0.01; // Enough for 5 games + gas
        let fundedCount = 0;
        console.log(`\n🔍 Checking existing wallets...`);
        for (const wallet of existingWallets) {
          const balance = await hre.ethers.provider.getBalance(wallet.address);
          const balanceEth = parseFloat(hre.ethers.formatEther(balance));
          if (balanceEth >= minRequiredBalance) {
            fundedCount++;
          }
        }
        if (fundedCount === existingWallets.length && fundedCount > 0) {
          existingWalletsFunded = true;
          console.log(`✅ All ${fundedCount} existing wallet(s) have sufficient balance`);
          console.log(`   Can proceed without checking main wallet balance\n`);
        } else if (fundedCount > 0) {
          console.log(`⚠️  ${fundedCount}/${existingWallets.length} wallets have sufficient balance`);
          console.log(`   Will check funding needs...\n`);
        }
      }
    } catch (e) {
      // If we can't read the file, proceed with normal check
      console.log(`\n⚠️  Could not read existing wallets, will check funding needs...`);
    }
  }

  // Get starting balance for final summary
  const startBalance = await hre.ethers.provider.getBalance(mainWallet.address);
  
  // Only check main wallet balance if we might need to fund
  if (!existingWalletsFunded) {
    console.log(`💰 Starting Balance: ${hre.ethers.formatEther(startBalance)} MNT`);
    
    // We'll check actual needs after loading wallets, but show a note
    console.log(`\n💡 Will check wallet balances and only fund what's needed`);
    console.log(`   Minimum required per wallet: ${(parseFloat(BET_AMOUNT) * 5 + 0.01).toFixed(4)} MNT`);
    console.log(`   Target balance per wallet: ${FUNDING_PER_WALLET} MNT`);
  }

  console.log(`\n📋 Configuration:`);
  console.log(`   Terminal: 4 (Fourth set - runs simultaneously with Terminal 2 & 3)`);
  console.log(`   Contract: ${CONTRACT_ADDRESS}`);
  console.log(`   Resolver API: ${RESOLVER_API_URL}`);
  
  // Verify contract address is valid
  try {
    const code = await hre.ethers.provider.getCode(CONTRACT_ADDRESS);
    if (code === "0x") {
      console.error(`\n❌ ERROR: No contract found at address ${CONTRACT_ADDRESS}`);
      console.error(`   Please verify the contract address is correct!\n`);
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
  console.log(`   Max win per game: ${MAX_WIN_AMOUNT} MNT (10x multiplier)`);
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
    console.log(`\n📂 Loading existing wallets from ${WALLETS_FILE}...`);
    wallets = JSON.parse(fs.readFileSync(WALLETS_FILE, "utf8"));
    console.log(`✅ Loaded ${wallets.length} existing wallets`);
    
    // Verify we have the expected number of wallets
    if (wallets.length !== NUMBER_OF_WALLETS) {
      console.log(`\n⚠️  Warning: Found ${wallets.length} wallets, but expected ${NUMBER_OF_WALLETS}`);
      console.log(`   Using existing ${wallets.length} wallets\n`);
    }
    
    // Show existing wallets
    console.log("\n📋 Existing Wallets:");
    for (let i = 0; i < wallets.length; i++) {
      const balance = await hre.ethers.provider.getBalance(wallets[i].address);
      console.log(`  ${i + 1}. ${wallets[i].address} | Balance: ${hre.ethers.formatEther(balance)} MNT | Games: ${wallets[i].gamesPlayed || 0}`);
    }
    console.log();
  } else {
    console.log(`\n📂 No existing wallet file found. Creating new wallets...`);
    wallets = generateWallets(NUMBER_OF_WALLETS);
  }

  // Fund wallets (only if needed)
  console.log(`\n⏳ Starting wallet funding check in 3 seconds...`);
  await sleep(3000);
  
  // Calculate how much we actually need
  const minRequiredBalance = parseFloat(BET_AMOUNT) * 5 + 0.01; // Minimum per wallet
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
  
  // Only check main wallet balance if we need to fund
  if (totalNeeded > 0) {
    const currentMainBalance = await hre.ethers.provider.getBalance(mainWallet.address);
    const gasBuffer = 0.1;
    const requiredTotal = totalNeeded + gasBuffer;
    
    if (parseFloat(hre.ethers.formatEther(currentMainBalance)) < requiredTotal) {
      console.log(`\n⚠️  Main wallet doesn't have enough to fund ${walletsNeedingFunding} wallet(s)!`);
      console.log(`   Current balance: ${hre.ethers.formatEther(currentMainBalance)} MNT`);
      console.log(`   Needed for funding: ${totalNeeded.toFixed(4)} MNT`);
      console.log(`\n💡 Continuing with existing funded wallets...`);
      console.log(`   Wallets with sufficient balance will be used for games\n`);
      // Continue - use whatever wallets have balance
    } else {
      await fundWallets(wallets, FUNDING_PER_WALLET);
    }
  } else {
    console.log(`\n✅ All wallets have sufficient balance, no funding needed!`);
    console.log(`   Proceeding with existing funded wallets...\n`);
  }
  
  // Save wallets after funding (in case balances changed)
  fs.writeFileSync(WALLETS_FILE, JSON.stringify(wallets, null, 2));

  // Execute games with random wallet selection
  console.log(`\n⏳ [TERMINAL 4] Starting randomized game execution...\n`);
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
      console.log(`\n📊 [T4] Wallet Distribution:`);
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
  console.log("🎉 [TERMINAL 4] COMPLETE!");
  console.log("=".repeat(70));
  console.log(`\n📊 Final Summary:`);
  console.log(`   Terminal: 4`);
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
    `   npx hardhat run scripts/collect-funds-terminal4.cjs --network mantleSepolia\n`
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Error:", error);
    process.exit(1);
  });

