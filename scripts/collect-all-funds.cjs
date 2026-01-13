const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

// Read all wallet private keys from the file
const WALLETS_FILE = path.join(__dirname, "all-wallet-private-keys.txt");
const MIN_BALANCE_TO_COLLECT = "0.001"; // Don't collect if balance is less than this (gas cost)

async function collectFromWallet(wallet, ownerAddress) {
  try {
    const connectedWallet = new hre.ethers.Wallet(wallet.privateKey, hre.ethers.provider);
    const balance = await hre.ethers.provider.getBalance(connectedWallet.address);
    const balanceEth = parseFloat(hre.ethers.formatEther(balance));
    const minBalance = parseFloat(MIN_BALANCE_TO_COLLECT);

    if (balanceEth < minBalance) {
      return {
        address: wallet.address,
        success: false,
        reason: `Balance too low (${balanceEth.toFixed(6)} MNT < ${minBalance} MNT)`,
        balance: balanceEth,
        collected: 0,
      };
    }

    // Estimate gas cost for transfer
    const gasPrice = await hre.ethers.provider.getFeeData();
    const gasLimit = 21000n; // Standard transfer
    const gasCost = gasLimit * (gasPrice.gasPrice || 0n);
    const gasCostEth = parseFloat(hre.ethers.formatEther(gasCost));

    // Calculate amount to transfer (balance - gas cost)
    const amountToTransfer = balance - gasCost;
    
    if (amountToTransfer <= 0n) {
      return {
        address: wallet.address,
        success: false,
        reason: `Insufficient balance to cover gas (${balanceEth.toFixed(6)} MNT)`,
        balance: balanceEth,
        collected: 0,
      };
    }

    // Send transaction
    const tx = await connectedWallet.sendTransaction({
      to: ownerAddress,
      value: amountToTransfer,
      gasLimit: gasLimit,
    });

    const receipt = await tx.wait();

    return {
      address: wallet.address,
      success: true,
      balance: balanceEth,
      collected: parseFloat(hre.ethers.formatEther(amountToTransfer)),
      gasCost: gasCostEth,
      txHash: tx.hash,
    };
  } catch (error) {
    return {
      address: wallet.address,
      success: false,
      reason: error.message,
      balance: 0,
      collected: 0,
    };
  }
}

async function main() {
  console.log("\n" + "=".repeat(70));
  console.log("💰 COLLECTING ALL FUNDS FROM WALLETS");
  console.log("=".repeat(70));

  // Get owner wallet (from PRIVATE_KEY env or first signer)
  const [owner] = await hre.ethers.getSigners();
  const ownerAddress = owner.address;
  console.log(`\n📤 Owner/Relayer Address: ${ownerAddress}`);

  const ownerBalanceBefore = await hre.ethers.provider.getBalance(ownerAddress);
  console.log(`💰 Owner Balance Before: ${hre.ethers.formatEther(ownerBalanceBefore)} MNT\n`);

  if (!fs.existsSync(WALLETS_FILE)) {
    console.error(`\n❌ File not found: ${WALLETS_FILE}`);
    process.exit(1);
  }

  const fileContent = fs.readFileSync(WALLETS_FILE, "utf8");
  const lines = fileContent.split("\n");

  const wallets = [];
  let currentSection = "";

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip comments and empty lines
    if (!trimmed || trimmed.startsWith("#") || trimmed.startsWith("=")) {
      if (trimmed.includes("TERMINAL") || trimmed.includes("UNIFIED")) {
        currentSection = trimmed;
      }
      continue;
    }

    // Parse wallet line (format: address: privateKey)
    if (trimmed.includes(":")) {
      const [address, privateKey] = trimmed.split(":").map((s) => s.trim());
      if (address && privateKey && address.startsWith("0x") && privateKey.startsWith("0x")) {
        wallets.push({
          address,
          privateKey,
          section: currentSection,
        });
      }
    }
  }

  console.log(`📋 Found ${wallets.length} wallets to check\n`);

  // First, check all balances
  console.log("🔍 Checking wallet balances...\n");
  const walletBalances = [];
  for (let i = 0; i < wallets.length; i++) {
    const wallet = wallets[i];
    const balance = await hre.ethers.provider.getBalance(wallet.address);
    const balanceEth = parseFloat(hre.ethers.formatEther(balance));
    walletBalances.push({
      ...wallet,
      balance: balanceEth,
    });
    process.stdout.write(`  ${i + 1}/${wallets.length}: ${wallet.address.slice(0, 10)}... | ${balanceEth.toFixed(6)} MNT\r`);
  }
  console.log("\n");

  // Filter wallets with sufficient balance
  const minBalance = parseFloat(MIN_BALANCE_TO_COLLECT);
  const walletsToCollect = walletBalances.filter((w) => w.balance >= minBalance);
  const walletsToSkip = walletBalances.filter((w) => w.balance < minBalance);

  console.log(`📊 Summary:`);
  console.log(`   Wallets with sufficient balance: ${walletsToCollect.length}`);
  console.log(`   Wallets to skip (low balance): ${walletsToSkip.length}`);
  
  const totalToCollect = walletsToCollect.reduce((sum, w) => sum + w.balance, 0);
  console.log(`   Total MNT to collect: ${totalToCollect.toFixed(4)} MNT\n`);

  if (walletsToCollect.length === 0) {
    console.log("✅ No wallets have sufficient balance to collect.\n");
    return;
  }

  // Ask for confirmation (in a real scenario, you might want to add a prompt)
  console.log("⏳ Starting collection in 3 seconds...\n");
  await new Promise((resolve) => setTimeout(resolve, 3000));

  const results = [];
  let totalCollected = 0;
  let successCount = 0;
  let failCount = 0;

  // Collect from each wallet
  for (let i = 0; i < walletsToCollect.length; i++) {
    const wallet = walletsToCollect[i];
    console.log(`Collecting ${i + 1}/${walletsToCollect.length}: ${wallet.address.slice(0, 10)}...`);

    const result = await collectFromWallet(wallet, ownerAddress);
    results.push(result);

    if (result.success) {
      successCount++;
      totalCollected += result.collected;
      console.log(`  ✅ Collected ${result.collected.toFixed(6)} MNT (Tx: ${result.txHash.slice(0, 20)}...)`);
    } else {
      failCount++;
      console.log(`  ❌ Failed: ${result.reason}`);
    }

    // Small delay between transactions
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  // Final summary
  const ownerBalanceAfter = await hre.ethers.provider.getBalance(ownerAddress);
  const ownerBalanceIncrease = parseFloat(hre.ethers.formatEther(ownerBalanceAfter - ownerBalanceBefore));

  console.log("\n" + "=".repeat(70));
  console.log("🎉 COLLECTION COMPLETE!");
  console.log("=".repeat(70));
  console.log(`\n📊 Summary:`);
  console.log(`   Wallets processed: ${walletsToCollect.length}`);
  console.log(`   Successful collections: ${successCount}`);
  console.log(`   Failed collections: ${failCount}`);
  console.log(`   Total MNT collected: ${totalCollected.toFixed(4)} MNT`);
  console.log(`\n💰 Owner Balance:`);
  console.log(`   Before: ${hre.ethers.formatEther(ownerBalanceBefore)} MNT`);
  console.log(`   After: ${hre.ethers.formatEther(ownerBalanceAfter)} MNT`);
  console.log(`   Increase: ${ownerBalanceIncrease.toFixed(4)} MNT`);

  // Group results by section
  const bySection = {};
  results.forEach((result) => {
    const wallet = walletsToCollect.find((w) => w.address === result.address);
    const section = wallet?.section || "Unknown";
    if (!bySection[section]) {
      bySection[section] = { success: 0, failed: 0, collected: 0 };
    }
    if (result.success) {
      bySection[section].success++;
      bySection[section].collected += result.collected;
    } else {
      bySection[section].failed++;
    }
  });

  console.log(`\n📋 By Section:`);
  for (const [section, stats] of Object.entries(bySection)) {
    console.log(`   ${section}:`);
    console.log(`     Success: ${stats.success} | Failed: ${stats.failed} | Collected: ${stats.collected.toFixed(4)} MNT`);
  }

  // Save detailed report
  const outputFile = path.join(__dirname, "fund-collection-report.json");
  fs.writeFileSync(
    outputFile,
    JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        ownerAddress,
        ownerBalanceBefore: hre.ethers.formatEther(ownerBalanceBefore),
        ownerBalanceAfter: hre.ethers.formatEther(ownerBalanceAfter),
        totalCollected: totalCollected.toFixed(4),
        summary: {
          totalWallets: walletsToCollect.length,
          successCount,
          failCount,
        },
        results: results,
        bySection: bySection,
      },
      null,
      2
    )
  );

  console.log(`\n💾 Detailed report saved to: ${outputFile}\n`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Error:", error);
    process.exit(1);
  });





