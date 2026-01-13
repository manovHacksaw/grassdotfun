const hre = require("hardhat");

async function main() {
  console.log("\n📊 Counting On-Chain Transactions (bypassing explorer)...\n");

  const contractAddress =
    process.env.CONTRACT_ADDRESS ||
    "0x61d11C622Bd98A71aD9361833379A2066Ad29CCa";

  const [signer] = await hre.ethers.getSigners();

  try {
    // Contract ABI for events
    const contractABI = [
      {
        anonymous: false,
        inputs: [
          {
            indexed: true,
            internalType: "bytes32",
            name: "gameHash",
            type: "bytes32",
          },
          { indexed: false, internalType: "string", name: "gameId", type: "string" },
          {
            indexed: true,
            internalType: "address",
            name: "player",
            type: "address",
          },
          {
            indexed: false,
            internalType: "uint256",
            name: "amount",
            type: "uint256",
          },
          { indexed: false, internalType: "string", name: "gameType", type: "string" },
          {
            indexed: false,
            internalType: "uint256",
            name: "blockNumber",
            type: "uint256",
          },
        ],
        name: "GameStarted",
        type: "event",
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: true,
            internalType: "bytes32",
            name: "gameHash",
            type: "bytes32",
          },
          { indexed: false, internalType: "string", name: "gameId", type: "string" },
          {
            indexed: true,
            internalType: "address",
            name: "player",
            type: "address",
          },
          {
            indexed: false,
            internalType: "bool",
            name: "didWin",
            type: "bool",
          },
          {
            indexed: false,
            internalType: "uint256",
            name: "multiplierPercent",
            type: "uint256",
          },
          {
            indexed: false,
            internalType: "uint256",
            name: "winnings",
            type: "uint256",
          },
          {
            indexed: false,
            internalType: "uint256",
            name: "blockNumber",
            type: "uint256",
          },
        ],
        name: "GameResolved",
        type: "event",
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: true,
            internalType: "address",
            name: "player",
            type: "address",
          },
          {
            indexed: false,
            internalType: "uint256",
            name: "amount",
            type: "uint256",
          },
        ],
        name: "Withdrawn",
        type: "event",
      },
    ];

    const contract = new hre.ethers.Contract(
      contractAddress,
      contractABI,
      signer
    );

    // Get current block
    const currentBlock = await hre.ethers.provider.getBlockNumber();
    console.log(`Current Block: ${currentBlock}`);

    // Try to fetch events in chunks to avoid timeouts
    const deployBlock = 27165600; // Approximate deploy block (update this)
    const chunkSize = 50000; // Smaller chunks

    let allGameStarts = [];
    let allGameResolves = [];
    let allWithdrawals = [];

    console.log("\n🔍 Fetching events from blockchain...");

    // Fetch recent events (last 100k blocks should cover everything)
    const fromBlock = Math.max(deployBlock, currentBlock - 100000);
    console.log(`Scanning blocks ${fromBlock} to ${currentBlock}...`);

    try {
      // Try getting GameStarted events
      const gameStarts = await contract.queryFilter(
        contract.filters.GameStarted(),
        fromBlock,
        currentBlock
      );
      allGameStarts = gameStarts;
      console.log(`✅ Found ${gameStarts.length} GameStarted events`);

      // Try getting GameResolved events
      const gameResolves = await contract.queryFilter(
        contract.filters.GameResolved(),
        fromBlock,
        currentBlock
      );
      allGameResolves = gameResolves;
      console.log(`✅ Found ${gameResolves.length} GameResolved events`);

      // Try getting Withdrawn events
      const withdrawals = await contract.queryFilter(
        contract.filters.Withdrawn(),
        fromBlock,
        currentBlock
      );
      allWithdrawals = withdrawals;
      console.log(`✅ Found ${withdrawals.length} Withdrawn events`);
    } catch (error) {
      console.log(
        "⚠️  Event fetching failed (RPC limitation):",
        error.message.slice(0, 100)
      );
      console.log("   Trying alternative method...\n");

      // Alternative: Check transaction count via nonce
      const contractNonce = await hre.ethers.provider.getTransactionCount(
        contractAddress
      );
      console.log(`Contract transaction count (nonce): ${contractNonce}`);
    }

    // Count unique addresses
    const uniqueAddresses = new Set();
    allGameStarts.forEach((event) => uniqueAddresses.add(event.args.player));
    allGameResolves.forEach((event) => uniqueAddresses.add(event.args.player));
    allWithdrawals.forEach((event) => uniqueAddresses.add(event.args.player));

    // Count by game type
    const gameTypeCounts = {};
    allGameStarts.forEach((event) => {
      const gameType = event.args.gameType;
      gameTypeCounts[gameType] = (gameTypeCounts[gameType] || 0) + 1;
    });

    const totalTransactions =
      allGameStarts.length + allGameResolves.length + allWithdrawals.length;

    console.log("\n" + "=".repeat(60));
    console.log("📊 ON-CHAIN RESULTS (Direct from Blockchain)");
    console.log("=".repeat(60));
    console.log(`Total Game Starts: ${allGameStarts.length}`);
    console.log(`Total Game Resolves: ${allGameResolves.length}`);
    console.log(`Total Withdrawals: ${allWithdrawals.length}`);
    console.log(`Total Transactions: ${totalTransactions}`);
    console.log(`Unique Addresses: ${uniqueAddresses.size}`);

    if (Object.keys(gameTypeCounts).length > 0) {
      console.log("\n📋 Games by Type:");
      Object.entries(gameTypeCounts).forEach(([type, count]) => {
        console.log(`   ${type}: ${count} games`);
      });
    }

    if (totalTransactions > 0) {
      console.log("\n📋 Recent addresses:");
      const recentAddresses = Array.from(uniqueAddresses).slice(0, 15);
      recentAddresses.forEach((addr, i) => {
        console.log(`   ${i + 1}. ${addr}`);
      });
      if (uniqueAddresses.size > 15) {
        console.log(`   ... and ${uniqueAddresses.size - 15} more`);
      }
    }

    // Get contract balance
    const contractBalance = await hre.ethers.provider.getBalance(
      contractAddress
    );
    console.log(
      `\n💰 Contract Balance: ${hre.ethers.formatEther(contractBalance)} MNT`
    );

    // Get contract stats if available
    try {
      const statsABI = [
        {
          inputs: [],
          name: "getContractStats",
          outputs: [
            { internalType: "uint256", name: "totalUsers", type: "uint256" },
            { internalType: "uint256", name: "totalBets", type: "uint256" },
            { internalType: "uint256", name: "totalWinnings", type: "uint256" },
            { internalType: "uint256", name: "totalGames", type: "uint256" },
          ],
          stateMutability: "view",
          type: "function",
        },
      ];
      const statsContract = new hre.ethers.Contract(
        contractAddress,
        statsABI,
        signer
      );
      const stats = await statsContract.getContractStats();
      console.log("\n📊 Contract Statistics:");
      console.log(`   Total Users: ${stats[0].toString()}`);
      console.log(
        `   Total Bets: ${hre.ethers.formatEther(stats[1])} MNT`
      );
      console.log(
        `   Total Winnings: ${hre.ethers.formatEther(stats[2])} MNT`
      );
      console.log(`   Total Games: ${stats[3].toString()}`);
    } catch (error) {
      console.log("\n⚠️  Could not fetch contract stats");
    }

    console.log(
      "\n💡 Note: If numbers seem low, the RPC may have query limits."
    );
    console.log("   Explorer can take 15-30 mins to fully index!\n");
  } catch (error) {
    console.error("\n❌ Error:", error.message);
    console.log("\n💡 RPC query limits hit. Your transactions are on-chain,");
    console.log("   but we can't query all events. Check Mantle Explorer in 30 mins.\n");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

