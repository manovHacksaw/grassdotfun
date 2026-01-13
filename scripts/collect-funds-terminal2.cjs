const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("\n💰 Collecting Leftover Funds from Generated Wallets\n");

  const walletFiles = [
    "generated-wallets.json",
    "generated-wallets-terminal1.json",
    "generated-wallets-terminal2.json",
  ];

  const [receiver] = await hre.ethers.getSigners();
  console.log(`Collecting to: ${receiver.address}\n`);

  let totalCollected = 0n;
  let totalWallets = 0;
  let collected = 0;

  for (const fileName of walletFiles) {
    const filePath = path.join(__dirname, fileName);
    if (!fs.existsSync(filePath)) {
      console.log(`⏭️  Skipping ${fileName} (not found)\n`);
      continue;
    }

    const wallets = JSON.parse(fs.readFileSync(filePath, "utf8"));
    console.log(`📂 Processing ${fileName} (${wallets.length} wallets)...\n`);
    totalWallets += wallets.length;

    for (let i = 0; i < wallets.length; i++) {
      const wallet = wallets[i];
      const w = new hre.ethers.Wallet(wallet.privateKey, hre.ethers.provider);
      const balance = await hre.ethers.provider.getBalance(w.address);

      // Keep 0.01 MNT for gas
      if (balance > hre.ethers.parseEther("0.01")) {
        const collectAmount = balance - hre.ethers.parseEther("0.01");
        try {
          const tx = await w.sendTransaction({
            to: receiver.address,
            value: collectAmount,
            gasLimit: 21000,
          });
          await tx.wait();
          totalCollected += collectAmount;
          collected++;
          console.log(
            `✅ ${fileName.replace(".json", "")} - Wallet ${
              i + 1
            }: ${hre.ethers.formatEther(collectAmount)} MNT`
          );
        } catch (error) {
          console.log(
            `❌ ${fileName.replace(".json", "")} - Wallet ${
              i + 1
            }: Failed - ${error.message.slice(0, 50)}`
          );
        }
      } else {
        console.log(
          `⏭️  ${fileName.replace(".json", "")} - Wallet ${
            i + 1
          }: Balance too low (${hre.ethers.formatEther(balance)} MNT)`
        );
      }
    }
    console.log();
  }

  console.log("=".repeat(60));
  console.log(`✅ Collection Complete!`);
  console.log("=".repeat(60));
  console.log(`   Total wallets processed: ${totalWallets}`);
  console.log(`   Collected from: ${collected} wallets`);
  console.log(
    `   Total collected: ${hre.ethers.formatEther(totalCollected)} MNT`
  );
  const finalBalance = await hre.ethers.provider.getBalance(receiver.address);
  console.log(
    `   Your balance now: ${hre.ethers.formatEther(finalBalance)} MNT\n`
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

