/**
 * Wagmi Contract Service
 * Integrates with the deployed SecureGames contract using wagmi hooks
 */

import { useWriteContract, useReadContract, useAccount } from 'wagmi';
import { parseEther, formatEther } from 'viem';

// Contract configuration
const CONTRACT_ADDRESS = '0x4141fE3C1bD052dCcAb0fc54A816672447cDf14F' as const;

// Contract ABI - only the functions we need
const CONTRACT_ABI = [
  {
    "inputs": [
      {"internalType": "string", "name": "gameId", "type": "string"},
      {"internalType": "string", "name": "gameType", "type": "string"}
    ],
    "name": "startGame",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "string", "name": "gameId", "type": "string"}],
    "name": "getGameDetails",
    "outputs": [
      {"internalType": "string", "name": "id", "type": "string"},
      {"internalType": "address", "name": "player", "type": "address"},
      {"internalType": "uint256", "name": "amount", "type": "uint256"},
      {"internalType": "uint8", "name": "status", "type": "uint8"},
      {"internalType": "uint256", "name": "blockNumber", "type": "uint256"},
      {"internalType": "string", "name": "gameType", "type": "string"},
      {"internalType": "uint256", "name": "multiplierPercent", "type": "uint256"},
      {"internalType": "bool", "name": "existsFlag", "type": "bool"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "account", "type": "address"}],
    "name": "getUserStats",
    "outputs": [
      {"internalType": "uint256", "name": "totalBet", "type": "uint256"},
      {"internalType": "uint256", "name": "totalWon", "type": "uint256"},
      {"internalType": "uint256", "name": "totalLost", "type": "uint256"},
      {"internalType": "uint256", "name": "withdrawableBalance", "type": "uint256"},
      {"internalType": "uint256", "name": "gamesPlayed", "type": "uint256"},
      {"internalType": "uint256", "name": "gamesWon", "type": "uint256"},
      {"internalType": "uint256", "name": "joinBlock", "type": "uint256"},
      {"internalType": "uint256", "name": "joinTimestamp", "type": "uint256"},
      {"internalType": "uint256", "name": "lastPlayBlock", "type": "uint256"},
      {"internalType": "uint256", "name": "lastPlayTimestamp", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getContractStats",
    "outputs": [
      {"internalType": "uint256", "name": "totalUsers", "type": "uint256"},
      {"internalType": "uint256", "name": "totalBets", "type": "uint256"},
      {"internalType": "uint256", "name": "totalWinnings", "type": "uint256"},
      {"internalType": "uint256", "name": "totalGames", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "withdraw",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;

export function useWagmiContractService() {
  const { address } = useAccount();
  const { writeContract, isPending, error } = useWriteContract();

  /**
   * Start a new game with a bet amount
   */
  const startGame = async (gameId: string, betAmount: string, gameType: string = "unknown") => {
    try {
      console.log('🎮 WagmiContractService.startGame called');
      console.log('🎮 Game ID:', gameId);
      console.log('💰 Bet Amount:', betAmount);
      console.log('🎯 Game Type:', gameType);
      
      const value = parseEther(betAmount);
      
      await writeContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'startGame',
        args: [gameId, gameType],
        value: value,
      });
      
      return 'transaction-sent';
    } catch (error: any) {
      console.error('❌ Error starting game:', error);
      throw new Error(error.message || 'Failed to start game');
    }
  };

  /**
   * Withdraw winnings
   */
  const withdraw = async () => {
    try {
      console.log('💰 WagmiContractService.withdraw called');
      
      await writeContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'withdraw',
      });
      
      return 'withdrawal-sent';
    } catch (error: any) {
      console.error('❌ Error withdrawing:', error);
      throw new Error(error.message || 'Failed to withdraw');
    }
  };

  return {
    startGame,
    withdraw,
    isPending,
    error,
    address
  };
}

export function useGameDetails(gameId: string) {
  const { data, isLoading, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getGameDetails',
    args: [gameId],
    query: {
      enabled: !!gameId,
    },
  });

  if (data) {
    return {
      gameId: data[0],
      player: data[1],
      amount: formatEther(data[2]),
      status: data[3], // 0: Pending, 1: Won, 2: Lost
      blockNumber: data[4].toString(),
      gameType: data[5],
      multiplierPercent: data[6].toString(),
      existsFlag: data[7],
      isLoading,
      error
    };
  }

  return {
    isLoading,
    error
  };
}

export function useUserStats(accountAddress: string) {
  const { data, isLoading, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getUserStats',
    args: [accountAddress as `0x${string}`],
    query: {
      enabled: !!accountAddress,
    },
  });

  if (data) {
    const totalBet = parseFloat(formatEther(data[0]));
    const totalWon = parseFloat(formatEther(data[1]));
    const totalLost = parseFloat(formatEther(data[2]));
    const gamesPlayed = parseInt(data[4].toString());
    const gamesWon = parseInt(data[5].toString());
    const winRate = gamesPlayed > 0 ? (gamesWon / gamesPlayed) * 100 : 0;

    return {
      totalBet: formatEther(data[0]),
      totalWon: formatEther(data[1]),
      totalLost: formatEther(data[2]),
      withdrawableBalance: formatEther(data[3]),
      gamesPlayed: data[4].toString(),
      gamesWon: data[5].toString(),
      joinBlock: data[6].toString(),
      joinTimestamp: data[7].toString(),
      lastPlayBlock: data[8].toString(),
      lastPlayTimestamp: data[9].toString(),
      winRate: winRate,
      isLoading,
      error
    };
  }

  return {
    isLoading,
    error
  };
}

export function useContractStats() {
  const { data, isLoading, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getContractStats',
  });

  if (data) {
    return {
      totalUsers: data[0].toString(),
      totalBets: formatEther(data[1]),
      totalWinnings: formatEther(data[2]),
      totalGames: data[3].toString(),
      isLoading,
      error
    };
  }

  return {
    isLoading,
    error
  };
}
