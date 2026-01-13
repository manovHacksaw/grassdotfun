const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

// Read all wallet private keys from the file
const WALLETS_FILE = path.join(__dirname, "all-wallet-private-keys.txt");

async function checkWalletBalance(address, privateKey) {
  try {
    const balance = await hre.ethers.provider.getBalance(address);
    return {
      address,
      privateKey,
      balance: hre.ethers.formatEther(balance),
      balanceWei: balance.toString(),
    };
  } catch (error) {
    return {
      address,
      privateKey,
      balance: "ERROR",
      error: error.message,
    };
  }
}

async function main() {
  console.log("\n" + "=".repeat(70));
  console.log("💰 CHECKING ALL WALLET BALANCES");
  console.log("=".repeat(70));

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

  console.log(`\n📋 Found ${wallets.length} wallets to check\n`);

  const results = [];
  let totalBalance = 0;

  for (let i = 0; i < wallets.length; i++) {
    const wallet = wallets[i];
    process.stdout.write(`Checking ${i + 1}/${wallets.length}: ${wallet.address.slice(0, 10)}... `);

    const result = await checkWalletBalance(wallet.address, wallet.privateKey);
    result.section = wallet.section;
    results.push(result);

    if (result.balance !== "ERROR") {
      const balanceNum = parseFloat(result.balance);
      totalBalance += balanceNum;
      console.log(`✅ ${result.balance} MNT`);
    } else {
      console.log(`❌ ${result.error}`);
    }

    // Small delay to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  // Group by section
  const bySection = {};
  results.forEach((result) => {
    const section = result.section || "Unknown";
    if (!bySection[section]) {
      bySection[section] = [];
    }
    bySection[section].push(result);
  });

  // Display summary
  console.log("\n" + "=".repeat(70));
  console.log("📊 BALANCE SUMMARY BY SECTION");
  console.log("=".repeat(70));

  for (const [section, sectionWallets] of Object.entries(bySection)) {
    console.log(`\n${section}:`);
    let sectionTotal = 0;
    let sectionCount = 0;

    sectionWallets.forEach((wallet) => {
      if (wallet.balance !== "ERROR") {
        const balance = parseFloat(wallet.balance);
        sectionTotal += balance;
        sectionCount++;
        const status = balance > 0 ? "✅" : "⚠️";
        console.log(
          `  ${status} ${wallet.address.slice(0, 10)}... | ${wallet.balance} MNT`
        );
      } else {
        console.log(`  ❌ ${wallet.address.slice(0, 10)}... | ERROR: ${wallet.error}`);
      }
    });

    console.log(`  ──────────────────────────────────────────────`);
    console.log(`  Section Total: ${sectionTotal.toFixed(4)} MNT (${sectionCount} wallets)`);
  }

  console.log("\n" + "=".repeat(70));
  console.log("💰 OVERALL SUMMARY");
  console.log("=".repeat(70));
  console.log(`   Total Wallets Checked: ${wallets.length}`);
  console.log(`   Total Balance: ${totalBalance.toFixed(4)} MNT`);
  console.log(`   Average Balance: ${(totalBalance / wallets.length).toFixed(4)} MNT`);

  // Wallets with balance
  const walletsWithBalance = results.filter((r) => r.balance !== "ERROR" && parseFloat(r.balance) > 0);
  const walletsWithoutBalance = results.filter((r) => r.balance !== "ERROR" && parseFloat(r.balance) === 0);
  const walletsWithError = results.filter((r) => r.balance === "ERROR");

  console.log(`\n   Wallets with balance: ${walletsWithBalance.length}`);
  console.log(`   Wallets without balance: ${walletsWithoutBalance.length}`);
  if (walletsWithError.length > 0) {
    console.log(`   Wallets with errors: ${walletsWithError.length}`);
  }

  // Save results to file
  const outputFile = path.join(__dirname, "wallet-balances-report.json");
  fs.writeFileSync(
    outputFile,
    JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        totalWallets: wallets.length,
        totalBalance: totalBalance.toFixed(4),
        results: results,
        summary: {
          withBalance: walletsWithBalance.length,
          withoutBalance: walletsWithoutBalance.length,
          withError: walletsWithError.length,
        },
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





