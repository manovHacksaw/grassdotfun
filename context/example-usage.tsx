'use client';

import React, { useState } from 'react';
import { useContract, useUserStats, useContractStats, usePendingGames } from './contract-provider';
import { formatEther } from 'viem';

// Example component showing how to use the contract provider
export function ContractExample() {
  const {
    contractAddress,
    resolverAddress,
    isConnected,
    address,
    userStats,
    contractStats,
    pendingGames,
    startGame,
    resolveGame,
    withdraw,
  } = useContract();

  const [gameId, setGameId] = useState('');
  const [gameType, setGameType] = useState('coinflip');
  const [betAmount, setBetAmount] = useState('0.01');

  const handleStartGame = async () => {
    if (!gameId || !betAmount) return;
    
    try {
      const result = await startGame(gameId, gameType, BigInt(parseFloat(betAmount) * 1e18));
      
      if (result.success) {
        console.log('Game started successfully!', result.hash);
      } else if (result.error) {
        console.error('Failed to start game:', result.error);
      }
    } catch (error) {
      console.error('Error starting game:', error);
    }
  };

  const handleResolveGame = async () => {
    if (!gameId) return;
    
    try {
      const result = await resolveGame(gameId, true, 150n); // 1.5x multiplier
      
      if (result.success) {
        console.log('Game resolved successfully!', result.hash);
      } else if (result.error) {
        console.error('Failed to resolve game:', result.error);
      }
    } catch (error) {
      console.error('Error resolving game:', error);
    }
  };

  const handleWithdraw = async () => {
    try {
      const result = await withdraw();
      
      if (result.success) {
        console.log('Withdrawal successful!', result.hash);
      } else if (result.error) {
        console.error('Failed to withdraw:', result.error);
      }
    } catch (error) {
      console.error('Error withdrawing:', error);
    }
  };

  if (!isConnected) {
    return (
      <div className="p-6 bg-gray-100 rounded-lg">
        <h2 className="text-xl font-bold mb-4">Connect Wallet</h2>
        <p>Please connect your wallet to interact with the contract.</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <h1 className="text-2xl font-bold mb-6">SecureGames Contract Interface</h1>
      
      {/* Contract Info */}
      <div className="mb-6 p-4 bg-gray-50 rounded">
        <h2 className="text-lg font-semibold mb-2">Contract Information</h2>
        <p><strong>Contract Address:</strong> {contractAddress}</p>
        <p><strong>Resolver Address:</strong> {resolverAddress}</p>
        <p><strong>Your Address:</strong> {address}</p>
      </div>

      {/* User Stats */}
      <div className="mb-6 p-4 bg-blue-50 rounded">
        <h2 className="text-lg font-semibold mb-2">Your Stats</h2>
        {userStats.isLoading ? (
          <p>Loading user stats...</p>
        ) : userStats.data ? (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p><strong>Total Bet:</strong> {formatEther(userStats.data.totalBet)} ETH</p>
              <p><strong>Total Won:</strong> {formatEther(userStats.data.totalWon)} ETH</p>
              <p><strong>Total Lost:</strong> {formatEther(userStats.data.totalLost)} ETH</p>
            </div>
            <div>
              <p><strong>Withdrawable:</strong> {formatEther(userStats.data.withdrawableBalance)} ETH</p>
              <p><strong>Games Played:</strong> {userStats.data.gamesPlayed.toString()}</p>
              <p><strong>Games Won:</strong> {userStats.data.gamesWon.toString()}</p>
            </div>
          </div>
        ) : (
          <p>No user stats available</p>
        )}
      </div>

      {/* Contract Stats */}
      <div className="mb-6 p-4 bg-green-50 rounded">
        <h2 className="text-lg font-semibold mb-2">Contract Stats</h2>
        {contractStats.isLoading ? (
          <p>Loading contract stats...</p>
        ) : contractStats.data ? (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p><strong>Total Users:</strong> {contractStats.data.totalUsers.toString()}</p>
              <p><strong>Total Bets:</strong> {formatEther(contractStats.data.totalBets)} ETH</p>
            </div>
            <div>
              <p><strong>Total Winnings:</strong> {formatEther(contractStats.data.totalWinnings)} ETH</p>
              <p><strong>Total Games:</strong> {contractStats.data.totalGames.toString()}</p>
            </div>
          </div>
        ) : (
          <p>No contract stats available</p>
        )}
      </div>

      {/* Pending Games */}
      <div className="mb-6 p-4 bg-yellow-50 rounded">
        <h2 className="text-lg font-semibold mb-2">Pending Games</h2>
        {pendingGames.isLoading ? (
          <p>Loading pending games...</p>
        ) : pendingGames.data && pendingGames.data.length > 0 ? (
          <ul>
            {pendingGames.data.map((gameId, index) => (
              <li key={index} className="text-sm">{gameId}</li>
            ))}
          </ul>
        ) : (
          <p>No pending games</p>
        )}
      </div>

      {/* Game Actions */}
      <div className="mb-6 p-4 bg-purple-50 rounded">
        <h2 className="text-lg font-semibold mb-4">Game Actions</h2>
        
        {/* Start Game */}
        <div className="mb-4">
          <h3 className="font-medium mb-2">Start Game</h3>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              placeholder="Game ID"
              value={gameId}
              onChange={(e) => setGameId(e.target.value)}
              className="px-3 py-2 border rounded"
            />
            <select
              value={gameType}
              onChange={(e) => setGameType(e.target.value)}
              className="px-3 py-2 border rounded"
            >
              <option value="coinflip">Coinflip</option>
              <option value="mines">Mines</option>
              <option value="paaji">Paaji</option>
              <option value="rugs">Rugs</option>
            </select>
            <input
              type="number"
              step="0.001"
              placeholder="Bet Amount (ETH)"
              value={betAmount}
              onChange={(e) => setBetAmount(e.target.value)}
              className="px-3 py-2 border rounded"
            />
          </div>
          <button
            onClick={handleStartGame}
            disabled={!gameId || !betAmount}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
          >
            Start Game
          </button>
        </div>

        {/* Resolve Game */}
        <div className="mb-4">
          <h3 className="font-medium mb-2">Resolve Game</h3>
          <button
            onClick={handleResolveGame}
            disabled={!gameId}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400"
          >
            Resolve Game (Win)
          </button>
        </div>

        {/* Withdraw */}
        <div>
          <h3 className="font-medium mb-2">Withdraw Winnings</h3>
          <button
            onClick={handleWithdraw}
            className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
          >
            Withdraw
          </button>
        </div>
      </div>
    </div>
  );
}

// Example of using individual hooks directly
export function DirectHooksExample() {
  const { address } = useAccount();
  const userStats = useUserStats(address);
  const contractStats = useContractStats();
  const pendingGames = usePendingGames();

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Direct Hooks Usage</h2>
      
      <div className="space-y-4">
        <div>
          <h3 className="font-semibold">User Stats</h3>
          {userStats.isLoading ? (
            <p>Loading...</p>
          ) : userStats.data ? (
            <p>Games Played: {userStats.data.gamesPlayed.toString()}</p>
          ) : (
            <p>No data</p>
          )}
        </div>

        <div>
          <h3 className="font-semibold">Contract Stats</h3>
          {contractStats.isLoading ? (
            <p>Loading...</p>
          ) : contractStats.data ? (
            <p>Total Users: {contractStats.data.totalUsers.toString()}</p>
          ) : (
            <p>No data</p>
          )}
        </div>

        <div>
          <h3 className="font-semibold">Pending Games</h3>
          {pendingGames.isLoading ? (
            <p>Loading...</p>
          ) : pendingGames.data ? (
            <p>Count: {pendingGames.data.length}</p>
          ) : (
            <p>No data</p>
          )}
        </div>
      </div>
    </div>
  );
}



