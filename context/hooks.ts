import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi';
import { CONTRACT_CONFIG } from './contract-config';
import { 
  UserStats, 
  GameTypeStats, 
  Game, 
  ContractStats,
  UseUserStatsReturn,
  UseGameDetailsReturn,
  UseContractStatsReturn,
  UsePendingGamesReturn,
  TransactionState
} from './types';

// Custom hook for user stats
export function useUserStats(userAddress?: `0x${string}`): UseUserStatsReturn {
  const { address } = useAccount();
  const targetAddress = userAddress || address;

  const { data, isLoading, error, refetch } = useReadContract({
    address: CONTRACT_CONFIG.address,
    abi: CONTRACT_CONFIG.abi,
    functionName: 'getUserStats',
    args: targetAddress ? [targetAddress] : undefined,
    query: {
      enabled: !!targetAddress,
    },
  });

  return {
    data: data as UserStats | undefined,
    isLoading,
    error: error as Error | null,
    refetch,
  };
}

// Custom hook for game details
export function useGameDetails(gameId: string): UseGameDetailsReturn {
  const { data, isLoading, error, refetch } = useReadContract({
    address: CONTRACT_CONFIG.address,
    abi: CONTRACT_CONFIG.abi,
    functionName: 'getGameDetails',
    args: [gameId],
    query: {
      enabled: !!gameId,
    },
  });

  return {
    data: data as Game | undefined,
    isLoading,
    error: error as Error | null,
    refetch,
  };
}

// Custom hook for user game type stats
export function useUserGameStats(userAddress: `0x${string}`, gameType: string) {
  const { data, isLoading, error, refetch } = useReadContract({
    address: CONTRACT_CONFIG.address,
    abi: CONTRACT_CONFIG.abi,
    functionName: 'getUserGameStats',
    args: [userAddress, gameType],
    query: {
      enabled: !!userAddress && !!gameType,
    },
  });

  return {
    data: data as GameTypeStats | undefined,
    isLoading,
    error: error as Error | null,
    refetch,
  };
}

// Custom hook for contract stats
export function useContractStats(): UseContractStatsReturn {
  const { data, isLoading, error, refetch } = useReadContract({
    address: CONTRACT_CONFIG.address,
    abi: CONTRACT_CONFIG.abi,
    functionName: 'getContractStats',
  });

  return {
    data: data as ContractStats | undefined,
    isLoading,
    error: error as Error | null,
    refetch,
  };
}

// Custom hook for pending games
export function usePendingGames(): UsePendingGamesReturn {
  const { data, isLoading, error, refetch } = useReadContract({
    address: CONTRACT_CONFIG.address,
    abi: CONTRACT_CONFIG.abi,
    functionName: 'getPendingGames',
  });

  return {
    data: data as string[] | undefined,
    isLoading,
    error: error as Error | null,
    refetch,
  };
}

// Custom hook for contract balance
export function useContractBalance() {
  const { data, isLoading, error, refetch } = useReadContract({
    address: CONTRACT_CONFIG.address,
    abi: CONTRACT_CONFIG.abi,
    functionName: 'getContractBalance',
  });

  return {
    data: data as bigint | undefined,
    isLoading,
    error: error as Error | null,
    refetch,
  };
}

// Custom hook for total users
export function useTotalUsers() {
  const { data, isLoading, error, refetch } = useReadContract({
    address: CONTRACT_CONFIG.address,
    abi: CONTRACT_CONFIG.abi,
    functionName: 'getTotalUsers',
  });

  return {
    data: data as bigint | undefined,
    isLoading,
    error: error as Error | null,
    refetch,
  };
}

// Custom hook for all users (paginated)
export function useAllUsers(start: bigint, limit: bigint) {
  const { data, isLoading, error, refetch } = useReadContract({
    address: CONTRACT_CONFIG.address,
    abi: CONTRACT_CONFIG.abi,
    functionName: 'getAllUsers',
    args: [start, limit],
  });

  return {
    data: data as `0x${string}`[] | undefined,
    isLoading,
    error: error as Error | null,
    refetch,
  };
}

// Custom hook for resolver address
export function useResolverAddress() {
  const { data, isLoading, error, refetch } = useReadContract({
    address: CONTRACT_CONFIG.address,
    abi: CONTRACT_CONFIG.abi,
    functionName: 'getResolverAccount',
  });

  return {
    data: data as `0x${string}` | undefined,
    isLoading,
    error: error as Error | null,
    refetch,
  };
}

// Custom hook for contract actions
export function useContractActions() {
  const { writeContract, data: hash, error, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const startGame = async (gameId: string, gameType: string, amount: bigint): Promise<TransactionState> => {
    try {
      await writeContract({
        address: CONTRACT_CONFIG.address,
        abi: CONTRACT_CONFIG.abi,
        functionName: 'startGame',
        args: [gameId, gameType],
        value: amount,
      });
      
      return {
        isLoading: isPending || isConfirming,
        error: error as Error | null,
        success: isSuccess,
        hash,
      };
    } catch (err) {
      return {
        isLoading: false,
        error: err as Error,
        success: false,
      };
    }
  };

  const resolveGame = async (gameId: string, didWin: boolean, multiplierPercent: bigint): Promise<TransactionState> => {
    try {
      await writeContract({
        address: CONTRACT_CONFIG.address,
        abi: CONTRACT_CONFIG.abi,
        functionName: 'resolveGame',
        args: [gameId, didWin, multiplierPercent],
      });
      
      return {
        isLoading: isPending || isConfirming,
        error: error as Error | null,
        success: isSuccess,
        hash,
      };
    } catch (err) {
      return {
        isLoading: false,
        error: err as Error,
        success: false,
      };
    }
  };

  const withdraw = async (): Promise<TransactionState> => {
    try {
      await writeContract({
        address: CONTRACT_CONFIG.address,
        abi: CONTRACT_CONFIG.abi,
        functionName: 'withdraw',
      });
      
      return {
        isLoading: isPending || isConfirming,
        error: error as Error | null,
        success: isSuccess,
        hash,
      };
    } catch (err) {
      return {
        isLoading: false,
        error: err as Error,
        success: false,
      };
    }
  };

  const updateResolver = async (newResolver: `0x${string}`): Promise<TransactionState> => {
    try {
      await writeContract({
        address: CONTRACT_CONFIG.address,
        abi: CONTRACT_CONFIG.abi,
        functionName: 'updateResolver',
        args: [newResolver],
      });
      
      return {
        isLoading: isPending || isConfirming,
        error: error as Error | null,
        success: isSuccess,
        hash,
      };
    } catch (err) {
      return {
        isLoading: false,
        error: err as Error,
        success: false,
      };
    }
  };

  const emergencyWithdraw = async (): Promise<TransactionState> => {
    try {
      await writeContract({
        address: CONTRACT_CONFIG.address,
        abi: CONTRACT_CONFIG.abi,
        functionName: 'emergencyWithdraw',
      });
      
      return {
        isLoading: isPending || isConfirming,
        error: error as Error | null,
        success: isSuccess,
        hash,
      };
    } catch (err) {
      return {
        isLoading: false,
        error: err as Error,
        success: false,
      };
    }
  };

  return {
    startGame,
    resolveGame,
    withdraw,
    updateResolver,
    emergencyWithdraw,
    isLoading: isPending || isConfirming,
    error: error as Error | null,
    success: isSuccess,
    hash,
  };
}



