const { ethers } = require("hardhat");

async function main() {
  // Load the deployed contract
  const contractAddress = "YOUR_DEPLOYED_CONTRACT_ADDRESS"; // Replace with actual address
  const SecureGames = await ethers.getContractFactory("SecureGames");
  const secureGames = SecureGames.attach(contractAddress);

  const [owner, resolver, player] = await ethers.getSigners();

  console.log("🎮 SecureGames Contract Interaction");
  console.log("📋 Contract Address:", contractAddress);
  console.log("👤 Owner:", owner.address);
  console.log("🔧 Resolver:", resolver.address);
  console.log("🎯 Player:", player.address);

  // Test 1: Start a game
  console.log("\n🎲 Starting a test game...");
  const gameId = `test-game-${Date.now()}`;
  const gameType = "coinflip";
  const betAmount = ethers.parseEther("0.01"); // 0.01 U2U

  try {
    const startTx = await secureGames.connect(player).startGame(gameId, gameType, { value: betAmount });
    await startTx.wait();
    console.log("✅ Game started successfully!");
    console.log("🎮 Game ID:", gameId);
    console.log("💰 Bet Amount:", ethers.formatEther(betAmount), "U2U");

    // Test 2: Get game details
    console.log("\n🔍 Getting game details...");
    const gameDetails = await secureGames.getGameDetails(gameId);
    console.log("📊 Game Details:");
    console.log("  - Player:", gameDetails.player);
    console.log("  - Amount:", ethers.formatEther(gameDetails.amount), "U2U");
    console.log("  - Status:", gameDetails.status);
    console.log("  - Game Type:", gameDetails.gameType);

    // Test 3: Resolve game (as resolver)
    console.log("\n🎯 Resolving game as winner...");
    const resolveTx = await secureGames.connect(resolver).resolveGame(gameId, true, 200); // 2x multiplier
    await resolveTx.wait();
    console.log("✅ Game resolved successfully!");

    // Test 4: Get updated game details
    console.log("\n🔍 Getting updated game details...");
    const updatedGameDetails = await secureGames.getGameDetails(gameId);
    console.log("📊 Updated Game Details:");
    console.log("  - Status:", updatedGameDetails.status);
    console.log("  - Multiplier:", updatedGameDetails.multiplierPercent, "%");

    // Test 5: Get user stats
    console.log("\n📈 Getting user stats...");
    const userStats = await secureGames.getUserStats(player.address);
    console.log("👤 User Stats:");
    console.log("  - Total Bet:", ethers.formatEther(userStats.totalBet), "U2U");
    console.log("  - Total Won:", ethers.formatEther(userStats.totalWon), "U2U");
    console.log("  - Games Played:", userStats.gamesPlayed.toString());
    console.log("  - Games Won:", userStats.gamesWon.toString());
    console.log("  - Withdrawable Balance:", ethers.formatEther(userStats.withdrawableBalance), "U2U");

    // Test 6: Withdraw winnings
    if (userStats.withdrawableBalance > 0) {
      console.log("\n💰 Withdrawing winnings...");
      const withdrawTx = await secureGames.connect(player).withdraw();
      await withdrawTx.wait();
      console.log("✅ Withdrawal successful!");
    }

    // Test 7: Get contract stats
    console.log("\n📊 Getting contract stats...");
    const contractStats = await secureGames.getContractStats();
    console.log("🏢 Contract Stats:");
    console.log("  - Total Users:", contractStats.totalUsers.toString());
    console.log("  - Total Bets:", ethers.formatEther(contractStats.totalBets), "U2U");
    console.log("  - Total Winnings:", ethers.formatEther(contractStats.totalWinnings), "U2U");
    console.log("  - Total Games:", contractStats.totalGames.toString());

  } catch (error) {
    console.error("❌ Error during interaction:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });
