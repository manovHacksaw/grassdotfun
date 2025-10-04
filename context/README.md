# SecureGames Contract Provider

A comprehensive React context provider for interacting with the SecureGames smart contract using wagmi and RainbowKit.

## 🚀 Features

- **Complete Contract Integration**: All contract functions available as React hooks
- **TypeScript Support**: Full type safety with generated types
- **Real-time Data**: Automatic data fetching and caching
- **Transaction Management**: Built-in transaction state management
- **Error Handling**: Comprehensive error handling and loading states
- **RainbowKit Integration**: Ready-to-use wallet connection

## 📦 Installation

The required dependencies are already installed:
- `wagmi@latest`
- `@rainbow-me/rainbowkit@latest`
- `viem@latest`
- `@tanstack/react-query@latest`

## 🔧 Setup

### 1. Configure RainbowKit

First, get a WalletConnect Project ID from [https://cloud.walletconnect.com/](https://cloud.walletconnect.com/)

Update `context/rainbow-config.ts`:
```typescript
export const config = getDefaultConfig({
  appName: 'SecureGames',
  projectId: 'YOUR_WALLET_CONNECT_PROJECT_ID', // Replace this
  chains: [sepolia, mainnet],
  ssr: true,
});
```

### 2. Wrap Your App

In your main layout or `_app.tsx`:

```tsx
import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { config } from './context/rainbow-config';
import { ContractProvider } from './context/contract-provider';

const queryClient = new QueryClient();

export default function App({ Component, pageProps }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <ContractProvider>
            <Component {...pageProps} />
          </ContractProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
```

### 3. Add RainbowKit CSS

In your `globals.css`:
```css
@import '@rainbow-me/rainbowkit/styles.css';
```

## 🎯 Usage

### Using the Contract Context

```tsx
import { useContract } from './context/contract-provider';

function MyComponent() {
  const {
    contractAddress,
    isConnected,
    address,
    userStats,
    contractStats,
    startGame,
    withdraw,
  } = useContract();

  const handleStartGame = async () => {
    const result = await startGame('game-1', 'coinflip', BigInt(parseFloat('0.01') * 1e18));
    if (result.success) {
      console.log('Game started!', result.hash);
    }
  };

  return (
    <div>
      {isConnected ? (
        <div>
          <p>Connected: {address}</p>
          <p>Contract: {contractAddress}</p>
          <button onClick={handleStartGame}>Start Game</button>
        </div>
      ) : (
        <p>Please connect your wallet</p>
      )}
    </div>
  );
}
```

### Using Individual Hooks

```tsx
import { useUserStats, useContractStats, usePendingGames } from './context/contract-provider';

function StatsComponent() {
  const { address } = useAccount();
  const userStats = useUserStats(address);
  const contractStats = useContractStats();
  const pendingGames = usePendingGames();

  return (
    <div>
      <h2>User Stats</h2>
      {userStats.isLoading ? (
        <p>Loading...</p>
      ) : userStats.data ? (
        <div>
          <p>Games Played: {userStats.data.gamesPlayed.toString()}</p>
          <p>Total Won: {formatEther(userStats.data.totalWon)} ETH</p>
        </div>
      ) : (
        <p>No stats available</p>
      )}
    </div>
  );
}
```

## 📚 Available Hooks

### Data Hooks
- `useUserStats(address?)` - Get user statistics
- `useGameDetails(gameId)` - Get game details
- `useUserGameStats(address, gameType)` - Get user stats for specific game type
- `useContractStats()` - Get contract-wide statistics
- `usePendingGames()` - Get all pending game IDs
- `useContractBalance()` - Get contract ETH balance
- `useAllUsers(start, limit)` - Get paginated user list
- `useTotalUsers()` - Get total user count
- `useResolverAddress()` - Get resolver address

### Action Hooks
- `useContractActions()` - Get all contract action functions
- `useContract()` - Get the full contract context

### Contract Actions
- `startGame(gameId, gameType, amount)` - Start a new game
- `resolveGame(gameId, didWin, multiplierPercent)` - Resolve a game
- `withdraw()` - Withdraw winnings
- `updateResolver(newResolver)` - Update resolver address (owner only)
- `emergencyWithdraw()` - Emergency withdrawal (owner only)

## 🔧 Configuration

### Contract Address
Update the contract address in `context/contract-config.ts`:
```typescript
export const CONTRACT_CONFIG: ContractConfig = {
  address: "0x7769C0DCAA9316fc592f7258B3fACA2300D41caf", // Your deployed contract
  abi: SECURE_GAMES_ABI,
  resolverAddress: "0x2D4575003f6017950C2f7a10aFb17bf2fBb648d2"
};
```

### Network Configuration
Add or modify networks in `context/contract-config.ts`:
```typescript
export const NETWORKS: Record<string, NetworkConfig> = {
  sepolia: {
    chainId: 11155111,
    name: "Sepolia",
    rpcUrl: "https://0xrpc.io/sep",
    blockExplorer: "https://sepolia.etherscan.io"
  },
  // Add more networks as needed
};
```

## 🎮 Game Types

The contract supports various game types:
- `coinflip` - Coin flip games
- `mines` - Minesweeper-style games
- `paaji` - Paaji games
- `rugs` - Rugs games
- `unknown` - Default fallback

## 🔒 Security Features

- **Access Control**: Only resolver can resolve games
- **Owner Functions**: Only owner can update resolver and emergency withdraw
- **Reentrancy Protection**: Safe withdrawal patterns
- **Input Validation**: Comprehensive input validation

## 📊 Transaction States

All contract actions return a `TransactionState` object:
```typescript
interface TransactionState {
  isLoading: boolean;
  error: Error | null;
  success: boolean;
  hash?: `0x${string}`;
}
```

## 🐛 Error Handling

The provider includes comprehensive error handling:
- Network errors
- Contract errors
- User rejection
- Insufficient funds
- Invalid parameters

## 🔄 Data Refresh

All data hooks support manual refresh:
```tsx
const { data, refetch } = useUserStats();
// Call refetch() to refresh data
```

## 📱 Mobile Support

RainbowKit provides excellent mobile wallet support:
- WalletConnect integration
- Mobile browser wallets
- Deep linking support

## 🧪 Testing

Use the example components in `context/example-usage.tsx` to test the integration.

## 🚀 Production Deployment

1. Update contract addresses for mainnet
2. Configure proper RPC endpoints
3. Set up monitoring and error tracking
4. Test thoroughly on testnet first

## 📞 Support

For issues or questions:
1. Check the contract deployment info in `web3/DEPLOYMENT_INFO.md`
2. Review the contract ABI in `context/contract-config.ts`
3. Test with the example components



