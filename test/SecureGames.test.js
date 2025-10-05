const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SecureGames", function () {
  let secureGames;
  let owner;
  let resolver;
  let player1;
  let player2;

  beforeEach(async function () {
    [owner, resolver, player1, player2] = await ethers.getSigners();
    
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
  });

  describe("Game Management", function () {
    it("Should allow players to start games", async function () {
      const gameId = "test-game-1";
      const gameType = "coinflip";
      const betAmount = ethers.parseEther("0.1");

      await expect(
        secureGames.connect(player1).startGame(gameId, gameType, { value: betAmount })
      ).to.emit(secureGames, "GameStarted");

      const gameDetails = await secureGames.getGameDetails(gameId);
      expect(gameDetails.player).to.equal(player1.address);
      expect(gameDetails.amount).to.equal(betAmount);
      expect(gameDetails.gameType).to.equal(gameType);
    });

    it("Should allow resolver to resolve games", async function () {
      const gameId = "test-game-2";
      const gameType = "mines";
      const betAmount = ethers.parseEther("0.1");

      // Start game
      await secureGames.connect(player1).startGame(gameId, gameType, { value: betAmount });

      // Resolve game as winner
      await expect(
        secureGames.connect(resolver).resolveGame(gameId, true, 200) // 2x multiplier
      ).to.emit(secureGames, "GameResolved");

      const gameDetails = await secureGames.getGameDetails(gameId);
      expect(gameDetails.multiplierPercent).to.equal(200);
    });

    it("Should prevent non-resolver from resolving games", async function () {
      const gameId = "test-game-3";
      const betAmount = ethers.parseEther("0.1");

      await secureGames.connect(player1).startGame(gameId, "coinflip", { value: betAmount });

      await expect(
        secureGames.connect(player1).resolveGame(gameId, true, 150)
      ).to.be.revertedWith("Only resolver");
    });
  });

  describe("User Stats", function () {
    it("Should track user statistics correctly", async function () {
      const gameId = "test-game-4";
      const betAmount = ethers.parseEther("0.1");

      // Start and resolve a winning game
      await secureGames.connect(player1).startGame(gameId, "coinflip", { value: betAmount });
      await secureGames.connect(resolver).resolveGame(gameId, true, 200);

      const userStats = await secureGames.getUserStats(player1.address);
      expect(userStats.totalBet).to.equal(betAmount);
      expect(userStats.totalWon).to.equal(ethers.parseEther("0.2")); // 2x multiplier
      expect(userStats.gamesPlayed).to.equal(1);
      expect(userStats.gamesWon).to.equal(1);
      expect(userStats.withdrawableBalance).to.equal(ethers.parseEther("0.2"));
    });
  });

  describe("Withdrawals", function () {
    it("Should allow users to withdraw winnings", async function () {
      const gameId = "test-game-5";
      const betAmount = ethers.parseEther("0.1");

      // Start and resolve a winning game
      await secureGames.connect(player1).startGame(gameId, "coinflip", { value: betAmount });
      await secureGames.connect(resolver).resolveGame(gameId, true, 200);

      const initialBalance = await ethers.provider.getBalance(player1.address);
      
      // Withdraw winnings
      const tx = await secureGames.connect(player1).withdraw();
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * receipt.gasPrice;
      
      const finalBalance = await ethers.provider.getBalance(player1.address);
      const expectedBalance = initialBalance + ethers.parseEther("0.2") - gasUsed;

      expect(finalBalance).to.be.closeTo(expectedBalance, ethers.parseEther("0.001"));
    });

    it("Should prevent withdrawal when no balance", async function () {
      await expect(
        secureGames.connect(player1).withdraw()
      ).to.be.revertedWith("Nothing to withdraw");
    });
  });

  describe("Access Control", function () {
    it("Should allow owner to change resolver", async function () {
      await expect(
        secureGames.connect(owner).setResolver(player2.address)
      ).to.emit(secureGames, "ResolverChanged");

      expect(await secureGames.getResolverAccount()).to.equal(player2.address);
    });

    it("Should prevent non-owner from changing resolver", async function () {
      await expect(
        secureGames.connect(player1).setResolver(player2.address)
      ).to.be.revertedWith("Only owner");
    });
  });
});
