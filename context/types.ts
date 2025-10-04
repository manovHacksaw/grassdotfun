// Contract types based on SecureGames.sol
export interface UserStats {
  totalBet: bigint;
  totalWon: bigint;
  totalLost: bigint;
  withdrawableBalance: bigint;
  gamesPlayed: bigint;
  gamesWon: bigint;
  joinBlock: bigint;
  lastPlayBlock: bigint;
}

export interface GameTypeStats {
  gameType: string;
  totalBets: bigint;
  totalWon: bigint;
  totalLost: bigint;
  gamesPlayed: bigint;
  gamesWon: bigint;
  bestMultiplierPercent: bigint;
  totalMultiplierPercent: bigint;
}

export enum GameStatus {
  Pending = 0,
  Won = 1,
  Lost = 2
}

export interface Game {
  player: `0x${string}`;
  amount: bigint;
  status: GameStatus;
  blockHeight: bigint;
  gameType: string;
  multiplierPercent: bigint;
}

export interface ContractStats {
  totalUsers: bigint;
  totalBets: bigint;
  totalWinnings: bigint;
  totalGames: bigint;
}

// Contract configuration
export interface ContractConfig {
  address: `0x${string}`;
  abi: any[];
  resolverAddress: `0x${string}`;
}

// Network configuration
export interface NetworkConfig {
  chainId: number;
  name: string;
  rpcUrl: string;
  blockExplorer: string;
}

// Contract events
export interface GameStartedEvent {
  gameId: string;
  player: `0x${string}`;
  amount: bigint;
  gameType: string;
  blockHeight: bigint;
}

export interface GameResolvedEvent {
  gameId: string;
  player: `0x${string}`;
  didWin: boolean;
  amount: bigint;
  winnings: bigint;
  multiplierPercent: bigint;
}

export interface WithdrawalEvent {
  player: `0x${string}`;
  amount: bigint;
}

// Hook return types
export interface UseUserStatsReturn {
  data: UserStats | undefined;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export interface UseGameDetailsReturn {
  data: Game | undefined;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export interface UseContractStatsReturn {
  data: ContractStats | undefined;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export interface UsePendingGamesReturn {
  data: string[] | undefined;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

// Transaction states
export interface TransactionState {
  isLoading: boolean;
  error: Error | null;
  success: boolean;
  hash?: `0x${string}`;
}

// Contract provider context
export interface ContractProviderContextType {
  // Contract info
  contractAddress: `0x${string}`;
  resolverAddress: `0x${string}`;
  isConnected: boolean;
  address: `0x${string}` | undefined;
  isCorrectNetwork: boolean;
  
  // User stats
  userStats: UseUserStatsReturn;
  
  // Contract stats
  contractStats: UseContractStatsReturn;
  
  // Pending games
  pendingGames: UsePendingGamesReturn;
  
  // Actions
  startGame: (gameId: string, gameType: string, amount: bigint) => Promise<TransactionState>;
  resolveGame: (gameId: string, didWin: boolean, multiplierPercent: bigint) => Promise<TransactionState>;
  withdraw: () => Promise<TransactionState>;
  updateResolver: (newResolver: `0x${string}`) => Promise<TransactionState>;
  emergencyWithdraw: () => Promise<TransactionState>;
  
  // View functions
  getGameDetails: (gameId: string) => Promise<Game | null>;
  getUserGameStats: (userAddress: `0x${string}`, gameType: string) => Promise<GameTypeStats | null>;
  getContractBalance: () => Promise<bigint>;
  getAllUsers: (start: bigint, limit: bigint) => Promise<`0x${string}`[]>;
  getTotalUsers: () => Promise<bigint>;
}



