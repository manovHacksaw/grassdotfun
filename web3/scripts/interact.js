const { ethers } = require("hardhat");

async function main() {
  // Replace with your deployed contract address
  const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // Update this
  
  console.log("Interacting with SecureGames contract at:", CONTRACT_ADDRESS);

  // Get the contract instance
  const SecureGames = await ethers.getContractFactory("SecureGames");
  const secureGames = SecureGames.attach(CONTRACT_ADDRESS);

  const [owner, player1, player2, resolver] = await ethers.getSigners();

  console.log("Owner:", owner.address);
  console.log("Player1:", player1.address);
  console.log("Player2:", player2.address);
  console.log("Resolver:", resolver.address);

  try {
    // Test 1: Check contract balance
    const balance = await secureGames.getContractBalance();
    console.log("Contract balance:", ethers.formatEther(balance), "ETH");

    // Test 2: Start a game as player1
    console.log("\n--- Starting a game ---");
    const gameId = "test-game-1";
    const gameType = "coinflip";
    const betAmount = ethers.parseEther("0.1");

    const tx1 = await secureGames.connect(player1).startGame(gameId, gameType, {
      value: betAmount
    });
    await tx1.wait();
    console.log("Game started:", gameId);

    // Test 3: Check game details
    const gameDetails = await secureGames.getGameDetails(gameId);
    console.log("Game details:", {
      player: gameDetails.player,
      amount: ethers.formatEther(gameDetails.amount),
      status: gameDetails.status,
      gameType: gameDetails.gameType
    });

    // Test 4: Resolve game as resolver
    console.log("\n--- Resolving game ---");
    const didWin = true;
    const multiplier = 150; // 1.5x multiplier

    const tx2 = await secureGames.connect(resolver).resolveGame(gameId, didWin, multiplier);
    await tx2.wait();
    console.log("Game resolved:", didWin ? "WON" : "LOST", "with", multiplier + "% multiplier");

    // Test 5: Check updated game details
    const updatedGameDetails = await secureGames.getGameDetails(gameId);
    console.log("Updated game details:", {
      player: updatedGameDetails.player,
      amount: ethers.formatEther(updatedGameDetails.amount),
      status: updatedGameDetails.status,
      multiplier: updatedGameDetails.multiplierPercent
    });

    // Test 6: Check player stats
    const playerStats = await secureGames.getUserStats(player1.address);
    console.log("Player stats:", {
      totalBet: ethers.formatEther(playerStats.totalBet),
      totalWon: ethers.formatEther(playerStats.totalWon),
      withdrawableBalance: ethers.formatEther(playerStats.withdrawableBalance),
      gamesPlayed: playerStats.gamesPlayed.toString(),
      gamesWon: playerStats.gamesWon.toString()
    });

    // Test 7: Withdraw winnings
    if (playerStats.withdrawableBalance > 0) {
      console.log("\n--- Withdrawing winnings ---");
      const tx3 = await secureGames.connect(player1).withdraw();
      await tx3.wait();
      console.log("Withdrawal successful");
    }

    // Test 8: Check contract stats
    const contractStats = await secureGames.getContractStats();
    console.log("Contract stats:", {
      totalUsers: contractStats.totalUsers.toString(),
      totalBets: ethers.formatEther(contractStats.totalBets),
      totalWinnings: ethers.formatEther(contractStats.totalWinnings),
      totalGames: contractStats.totalGames.toString()
    });

  } catch (error) {
    console.error("Error during interaction:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
