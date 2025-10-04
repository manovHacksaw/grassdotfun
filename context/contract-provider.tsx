'use client';

import React, { createContext, useContext, useMemo, ReactNode } from 'react';
import { useAccount } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import { 
  useUserStats, 
  useContractStats, 
  usePendingGames, 
  useContractActions,
  useGameDetails,
  useUserGameStats,
  useContractBalance,
  useAllUsers,
  useTotalUsers,
  useResolverAddress
} from './hooks';
import { CONTRACT_CONFIG } from './contract-config';
import { ContractProviderContextType } from './types';

// Create the context
const ContractContext = createContext<ContractProviderContextType | undefined>(undefined);

// Provider component
interface ContractProviderProps {
  children: ReactNode;
}

export function ContractProvider({ children }: ContractProviderProps) {
  const { address, isConnected, chain } = useAccount();
  
  // Check if we're on the correct network (Sepolia)
  const isCorrectNetwork = chain?.id === sepolia.id;
  
  // Hooks for data
  const userStats = useUserStats(address);
  const contractStats = useContractStats();
  const pendingGames = usePendingGames();
  
  // Hooks for actions
  const {
    startGame: startGameAction,
    resolveGame: resolveGameAction,
    withdraw: withdrawAction,
    updateResolver: updateResolverAction,
    emergencyWithdraw: emergencyWithdrawAction,
  } = useContractActions();

  // Memoized context value
  const contextValue = useMemo<ContractProviderContextType>(() => ({
    // Contract info
    contractAddress: CONTRACT_CONFIG.address,
    resolverAddress: CONTRACT_CONFIG.resolverAddress,
    isConnected,
    address,
    isCorrectNetwork,
    
    // User stats
    userStats,
    
    // Contract stats
    contractStats,
    
    // Pending games
    pendingGames,
    
    // Actions (with network checks)
    startGame: async (gameId: string, gameType: string, betAmount: bigint) => {
      if (!isCorrectNetwork) {
        return { success: false, error: new Error('Please switch to Sepolia network to play games') };
      }
      return startGameAction(gameId, gameType, betAmount);
    },
    resolveGame: async (gameId: string, didWin: boolean, multiplier: bigint) => {
      if (!isCorrectNetwork) {
        return { success: false, error: new Error('Please switch to Sepolia network to resolve games') };
      }
      return resolveGameAction(gameId, didWin, multiplier);
    },
    withdraw: async (amount: bigint) => {
      if (!isCorrectNetwork) {
        return { success: false, error: new Error('Please switch to Sepolia network to withdraw') };
      }
      return withdrawAction(amount);
    },
    updateResolver: async (newResolver: string) => {
      if (!isCorrectNetwork) {
        return { success: false, error: new Error('Please switch to Sepolia network to update resolver') };
      }
      return updateResolverAction(newResolver);
    },
    emergencyWithdraw: async () => {
      if (!isCorrectNetwork) {
        return { success: false, error: new Error('Please switch to Sepolia network for emergency withdraw') };
      }
      return emergencyWithdrawAction();
    },
    
    // View functions (these are async functions that can be called directly)
    getGameDetails: async (gameId: string) => {
      // This would typically use a direct contract call
      // For now, we'll return null and suggest using the hook
      console.warn('Use useGameDetails hook for better performance');
      return null;
    },
    
    getUserGameStats: async (userAddress: `0x${string}`, gameType: string) => {
      // This would typically use a direct contract call
      // For now, we'll return null and suggest using the hook
      console.warn('Use useUserGameStats hook for better performance');
      return null;
    },
    
    getContractBalance: async () => {
      // This would typically use a direct contract call
      // For now, we'll return 0n and suggest using the hook
      console.warn('Use useContractBalance hook for better performance');
      return 0n;
    },
    
    getAllUsers: async (start: bigint, limit: bigint) => {
      // This would typically use a direct contract call
      // For now, we'll return empty array and suggest using the hook
      console.warn('Use useAllUsers hook for better performance');
      return [];
    },
    
    getTotalUsers: async () => {
      // This would typically use a direct contract call
      // For now, we'll return 0n and suggest using the hook
      console.warn('Use useTotalUsers hook for better performance');
      return 0n;
    },
  }), [
    isConnected,
    address,
    userStats,
    contractStats,
    pendingGames,
    startGameAction,
    resolveGameAction,
    withdrawAction,
    updateResolverAction,
    emergencyWithdrawAction,
  ]);

  return (
    <ContractContext.Provider value={contextValue}>
      {children}
    </ContractContext.Provider>
  );
}

// Custom hook to use the contract context
export function useContract(): ContractProviderContextType {
  const context = useContext(ContractContext);
  if (context === undefined) {
    throw new Error('useContract must be used within a ContractProvider');
  }
  return context;
}

// Export individual hooks for direct use (recommended approach)
export {
  useUserStats,
  useGameDetails,
  useUserGameStats,
  useContractStats,
  usePendingGames,
  useContractBalance,
  useAllUsers,
  useTotalUsers,
  useResolverAddress,
  useContractActions,
} from './hooks';

// Export types and config
export type { 
  UserStats, 
  GameTypeStats, 
  Game, 
  ContractStats,
  GameStatus,
  ContractProviderContextType,
  TransactionState,
  UseUserStatsReturn,
  UseGameDetailsReturn,
  UseContractStatsReturn,
  UsePendingGamesReturn,
} from './types';

export { CONTRACT_CONFIG, SECURE_GAMES_ABI, NETWORKS } from './contract-config';
