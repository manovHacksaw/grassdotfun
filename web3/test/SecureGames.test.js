const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SecureGames", function () {
  let secureGames;
  let owner;
  let player1;
  let player2;
  let resolver;
  let addrs;

  beforeEach(async function () {
    [owner, player1, player2, resolver, ...addrs] = await ethers.getSigners();

    const SecureGames = await ethers.getContractFactory("SecureGames");
    secureGames = await SecureGames.deploy(resolver.address);
    await secureGames.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await secureGames.owner()).to.equal(owner.address);
    });

    it("Should set the right resolver", async function () {
      expect(await secureGames.getResolverAccount()).to.equal(resolver.address);
    });

    it("Should reject zero address resolver", async function () {
      const SecureGames = await ethers.getContractFactory("SecureGames");
      await expect(SecureGames.deploy(ethers.ZeroAddress))
        .to.be.revertedWith("Resolver address required");
    });
  });

  describe("Game Management", function () {
    const gameId = "test-game-1";
    const gameType = "coinflip";
    const betAmount = ethers.parseEther("0.1");

    it("Should allow starting a game", async function () {
      await expect(secureGames.connect(player1).startGame(gameId, gameType, {
        value: betAmount
      }))
        .to.emit(secureGames, "GameStarted")
        .withArgs(gameId, player1.address, betAmount, gameType, await ethers.provider.getBlockNumber() + 1);

      const game = await secureGames.getGameDetails(gameId);
      expect(game.player).to.equal(player1.address);
      expect(game.amount).to.equal(betAmount);
      expect(game.gameType).to.equal(gameType);
      expect(game.status).to.equal(0); // Pending
    });

    it("Should reject starting game with zero value", async function () {
      await expect(secureGames.connect(player1).startGame(gameId, gameType))
        .to.be.revertedWith("Attach ETH to play");
    });

    it("Should reject starting game with empty gameId", async function () {
      await expect(secureGames.connect(player1).startGame("", gameType, {
        value: betAmount
      }))
        .to.be.revertedWith("gameId required");
    });

    it("Should reject duplicate gameId", async function () {
      await secureGames.connect(player1).startGame(gameId, gameType, {
        value: betAmount
      });

      await expect(secureGames.connect(player2).startGame(gameId, gameType, {
        value: betAmount
      }))
        .to.be.revertedWith("gameId already exists");
    });

    it("Should use 'unknown' as default gameType", async function () {
      await secureGames.connect(player1).startGame(gameId, "", {
        value: betAmount
      });

      const game = await secureGames.getGameDetails(gameId);
      expect(game.gameType).to.equal("unknown");
    });
  });

  describe("Game Resolution", function () {
    const gameId = "test-game-1";
    const gameType = "coinflip";
    const betAmount = ethers.parseEther("0.1");

    beforeEach(async function () {
      await secureGames.connect(player1).startGame(gameId, gameType, {
        value: betAmount
      });
    });

    it("Should allow resolver to resolve game as win", async function () {
      const multiplier = 150; // 1.5x
      const expectedWinnings = (betAmount * BigInt(multiplier)) / BigInt(100);

      await expect(secureGames.connect(resolver).resolveGame(gameId, true, multiplier))
        .to.emit(secureGames, "GameResolved")
        .withArgs(gameId, player1.address, true, betAmount, expectedWinnings, multiplier);

      const game = await secureGames.getGameDetails(gameId);
      expect(game.status).to.equal(1); // Won
      expect(game.multiplierPercent).to.equal(multiplier);

      const userStats = await secureGames.getUserStats(player1.address);
      expect(userStats.totalWon).to.equal(expectedWinnings);
      expect(userStats.withdrawableBalance).to.equal(expectedWinnings);
      expect(userStats.gamesWon).to.equal(1);
    });

    it("Should allow resolver to resolve game as loss", async function () {
      await expect(secureGames.connect(resolver).resolveGame(gameId, false, 0))
        .to.emit(secureGames, "GameResolved")
        .withArgs(gameId, player1.address, false, betAmount, 0, 100);

      const game = await secureGames.getGameDetails(gameId);
      expect(game.status).to.equal(2); // Lost

      const userStats = await secureGames.getUserStats(player1.address);
      expect(userStats.totalLost).to.equal(betAmount);
      expect(userStats.withdrawableBalance).to.equal(0);
      expect(userStats.gamesWon).to.equal(0);
    });

    it("Should reject resolution by non-resolver", async function () {
      await expect(secureGames.connect(player1).resolveGame(gameId, true, 150))
        .to.be.revertedWith("Only resolver can call this");
    });

    it("Should reject resolution of non-existent game", async function () {
      await expect(secureGames.connect(resolver).resolveGame("non-existent", true, 150))
        .to.be.revertedWith("Game not found");
    });

    it("Should reject resolution of already resolved game", async function () {
      await secureGames.connect(resolver).resolveGame(gameId, true, 150);

      await expect(secureGames.connect(resolver).resolveGame(gameId, false, 0))
        .to.be.revertedWith("Game already resolved");
    });

    it("Should use default multiplier of 100 when 0 is provided", async function () {
      await secureGames.connect(resolver).resolveGame(gameId, true, 0);

      const game = await secureGames.getGameDetails(gameId);
      expect(game.multiplierPercent).to.equal(100);
    });
  });

  describe("Withdrawals", function () {
    const gameId = "test-game-1";
    const gameType = "coinflip";
    const betAmount = ethers.parseEther("0.1");
    const multiplier = 150;

    beforeEach(async function () {
      // Fund the contract with extra ETH to cover winnings
      await owner.sendTransaction({
        to: await secureGames.getAddress(),
        value: ethers.parseEther("1.0")
      });
      
      await secureGames.connect(player1).startGame(gameId, gameType, {
        value: betAmount
      });
      await secureGames.connect(resolver).resolveGame(gameId, true, multiplier);
    });

    it("Should allow player to withdraw winnings", async function () {
      const expectedWinnings = (betAmount * BigInt(multiplier)) / BigInt(100);
      const initialBalance = await ethers.provider.getBalance(player1.address);

      const tx = await secureGames.connect(player1).withdraw();
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * receipt.gasPrice;

      const finalBalance = await ethers.provider.getBalance(player1.address);
      const balanceChange = finalBalance - initialBalance;

      expect(balanceChange).to.equal(expectedWinnings - gasUsed);

      const userStats = await secureGames.getUserStats(player1.address);
      expect(userStats.withdrawableBalance).to.equal(0);
    });

    it("Should reject withdrawal with no balance", async function () {
      await secureGames.connect(player1).withdraw();

      await expect(secureGames.connect(player1).withdraw())
        .to.be.revertedWith("Nothing to withdraw");
    });
  });

  describe("Statistics", function () {
    it("Should track user statistics correctly", async function () {
      const gameId1 = "game-1";
      const gameId2 = "game-2";
      const betAmount = ethers.parseEther("0.1");

      // Start and win first game
      await secureGames.connect(player1).startGame(gameId1, "coinflip", {
        value: betAmount
      });
      await secureGames.connect(resolver).resolveGame(gameId1, true, 200);

      // Start and lose second game
      await secureGames.connect(player1).startGame(gameId2, "mines", {
        value: betAmount
      });
      await secureGames.connect(resolver).resolveGame(gameId2, false, 0);

      const userStats = await secureGames.getUserStats(player1.address);
      expect(userStats.totalBet).to.equal(betAmount * BigInt(2));
      expect(userStats.totalWon).to.equal(betAmount * BigInt(2)); // 2x multiplier
      expect(userStats.totalLost).to.equal(betAmount);
      expect(userStats.gamesPlayed).to.equal(2);
      expect(userStats.gamesWon).to.equal(1);
    });

    it("Should track game type statistics", async function () {
      const gameId = "game-1";
      const betAmount = ethers.parseEther("0.1");
      const gameType = "coinflip";

      await secureGames.connect(player1).startGame(gameId, gameType, {
        value: betAmount
      });
      await secureGames.connect(resolver).resolveGame(gameId, true, 150);

      const gameStats = await secureGames.getUserGameStats(player1.address, gameType);
      expect(gameStats.gameType).to.equal(gameType);
      expect(gameStats.totalBets).to.equal(betAmount);
      expect(gameStats.totalWon).to.equal((betAmount * BigInt(150)) / BigInt(100));
      expect(gameStats.gamesPlayed).to.equal(1);
      expect(gameStats.gamesWon).to.equal(1);
      expect(gameStats.bestMultiplierPercent).to.equal(150);
    });

    it("Should return contract statistics", async function () {
      const gameId = "game-1";
      const betAmount = ethers.parseEther("0.1");

      await secureGames.connect(player1).startGame(gameId, "coinflip", {
        value: betAmount
      });
      await secureGames.connect(resolver).resolveGame(gameId, true, 150);

      const contractStats = await secureGames.getContractStats();
      expect(contractStats.totalUsers).to.equal(1);
      expect(contractStats.totalBets).to.equal(betAmount);
      expect(contractStats.totalGames).to.equal(1);
    });
  });

  describe("Access Control", function () {
    it("Should allow owner to update resolver", async function () {
      const newResolver = addrs[0];
      await secureGames.connect(owner).updateResolver(newResolver.address);
      expect(await secureGames.getResolverAccount()).to.equal(newResolver.address);
    });

    it("Should reject resolver update by non-owner", async function () {
      const newResolver = addrs[0];
      await expect(secureGames.connect(player1).updateResolver(newResolver.address))
        .to.be.revertedWith("Only owner can call this");
    });

    it("Should reject zero address resolver update", async function () {
      await expect(secureGames.connect(owner).updateResolver(ethers.ZeroAddress))
        .to.be.revertedWith("Invalid resolver address");
    });

    it("Should allow owner to emergency withdraw when no pending games", async function () {
      const initialBalance = await ethers.provider.getBalance(owner.address);
      
      // Fund contract
      await secureGames.connect(player1).startGame("game-1", "coinflip", {
        value: ethers.parseEther("0.1")
      });
      await secureGames.connect(resolver).resolveGame("game-1", false, 0);

      const tx = await secureGames.connect(owner).emergencyWithdraw();
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * receipt.gasPrice;

      const finalBalance = await ethers.provider.getBalance(owner.address);
      const balanceChange = finalBalance - initialBalance;

      expect(balanceChange).to.equal(ethers.parseEther("0.1") - gasUsed);
    });

    it("Should reject emergency withdraw with pending games", async function () {
      await secureGames.connect(player1).startGame("game-1", "coinflip", {
        value: ethers.parseEther("0.1")
      });

      await expect(secureGames.connect(owner).emergencyWithdraw())
        .to.be.revertedWith("Cannot withdraw with pending games");
    });
  });
});
