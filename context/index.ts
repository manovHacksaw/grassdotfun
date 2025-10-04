// Main exports for the contract provider
export { ContractProvider, useContract } from './contract-provider';

// Individual hooks
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

// Types
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
  GameStartedEvent,
  GameResolvedEvent,
  WithdrawalEvent,
  ContractConfig,
  NetworkConfig,
} from './types';

// Configuration
export { CONTRACT_CONFIG, SECURE_GAMES_ABI, NETWORKS } from './contract-config';
export { config as rainbowConfig, customConfig as customRainbowConfig } from './rainbow-config';

// Example components
export { ContractExample, DirectHooksExample } from './example-usage';



