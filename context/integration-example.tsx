'use client';

import React from 'react';
import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider, ConnectButton } from '@rainbow-me/rainbowkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { config } from './rainbow-config';
import { ContractProvider, useContract } from './contract-provider';
import { formatEther } from 'viem';

// Create a query client
const queryClient = new QueryClient();

// Example component that uses the contract
function GameInterface() {
  const {
    isConnected,
    address,
    userStats,
    contractStats,
    startGame,
    withdraw,
  } = useContract();

  const handleStartGame = async () => {
    const gameId = `game-${Date.now()}`;
    const amount = BigInt(parseFloat('0.01') * 1e18); // 0.01 ETH
    
    const result = await startGame(gameId, 'coinflip', amount);
    
    if (result.success) {
      alert(`Game started! Transaction: ${result.hash}`);
    } else if (result.error) {
      alert(`Error: ${result.error.message}`);
    }
  };

  const handleWithdraw = async () => {
    const result = await withdraw();
    
    if (result.success) {
      alert(`Withdrawal successful! Transaction: ${result.hash}`);
    } else if (result.error) {
      alert(`Error: ${result.error.message}`);
    }
  };

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-3xl font-bold mb-8">SecureGames</h1>
        <ConnectButton />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">SecureGames</h1>
        <ConnectButton />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* User Stats */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Your Stats</h2>
          {userStats.isLoading ? (
            <p>Loading...</p>
          ) : userStats.data ? (
            <div className="space-y-2">
              <p><strong>Games Played:</strong> {userStats.data.gamesPlayed.toString()}</p>
              <p><strong>Games Won:</strong> {userStats.data.gamesWon.toString()}</p>
              <p><strong>Total Bet:</strong> {formatEther(userStats.data.totalBet)} ETH</p>
              <p><strong>Total Won:</strong> {formatEther(userStats.data.totalWon)} ETH</p>
              <p><strong>Withdrawable:</strong> {formatEther(userStats.data.withdrawableBalance)} ETH</p>
            </div>
          ) : (
            <p>No stats available</p>
          )}
        </div>

        {/* Contract Stats */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Contract Stats</h2>
          {contractStats.isLoading ? (
            <p>Loading...</p>
          ) : contractStats.data ? (
            <div className="space-y-2">
              <p><strong>Total Users:</strong> {contractStats.data.totalUsers.toString()}</p>
              <p><strong>Total Games:</strong> {contractStats.data.totalGames.toString()}</p>
              <p><strong>Total Bets:</strong> {formatEther(contractStats.data.totalBets)} ETH</p>
              <p><strong>Total Winnings:</strong> {formatEther(contractStats.data.totalWinnings)} ETH</p>
            </div>
          ) : (
            <p>No stats available</p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="mt-8 bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Actions</h2>
        <div className="flex gap-4">
          <button
            onClick={handleStartGame}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Start Coinflip Game (0.01 ETH)
          </button>
          
          <button
            onClick={handleWithdraw}
            className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            Withdraw Winnings
          </button>
        </div>
      </div>

      {/* Address Info */}
      <div className="mt-6 text-sm text-gray-600">
        <p><strong>Your Address:</strong> {address}</p>
        <p><strong>Contract Address:</strong> 0x7769C0DCAA9316fc592f7258B3fACA2300D41caf</p>
      </div>
    </div>
  );
}

// Main app component with all providers
export default function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <ContractProvider>
            <GameInterface />
          </ContractProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}



