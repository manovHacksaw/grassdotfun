# Quick Setup Guide

## 🚀 Quick Integration Steps

### 1. Update Your Layout/App Component

Replace your current layout or `_app.tsx` with this structure:

```tsx
// app/layout.tsx or pages/_app.tsx
import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { config } from '../context/rainbow-config';
import { ContractProvider } from '../context/contract-provider';
import '@rainbow-me/rainbowkit/styles.css';

const queryClient = new QueryClient();

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <WagmiProvider config={config}>
          <QueryClientProvider client={queryClient}>
            <RainbowKitProvider>
              <ContractProvider>
                {children}
              </ContractProvider>
            </RainbowKitProvider>
          </QueryClientProvider>
        </WagmiProvider>
      </body>
    </html>
  );
}
```

### 2. Get WalletConnect Project ID

1. Go to [https://cloud.walletconnect.com/](https://cloud.walletconnect.com/)
2. Create a new project
3. Copy the Project ID
4. Update `context/rainbow-config.ts`:

```typescript
export const config = getDefaultConfig({
  appName: 'SecureGames',
  projectId: 'YOUR_PROJECT_ID_HERE', // Replace this
  chains: [sepolia, mainnet],
  ssr: true,
});
```

### 3. Use the Contract in Your Components

```tsx
// Any component
import { useContract } from '../context/contract-provider';
import { ConnectButton } from '@rainbow-me/rainbowkit';

function MyComponent() {
  const { isConnected, userStats, startGame } = useContract();

  return (
    <div>
      <ConnectButton />
      {isConnected && (
        <div>
          <p>Games Played: {userStats.data?.gamesPlayed.toString()}</p>
          <button onClick={() => startGame('game-1', 'coinflip', BigInt(1e16))}>
            Start Game
          </button>
        </div>
      )}
    </div>
  );
}
```

### 4. Test the Integration

1. Start your development server: `npm run dev`
2. Open your app in the browser
3. Connect a wallet (MetaMask, WalletConnect, etc.)
4. Try the contract functions

## 🔧 Configuration Options

### Update Contract Address (if needed)

In `context/contract-config.ts`:
```typescript
export const CONTRACT_CONFIG: ContractConfig = {
  address: "0x7769C0DCAA9316fc592f7258B3fACA2300D41caf", // Your contract
  abi: SECURE_GAMES_ABI,
  resolverAddress: "0x2D4575003f6017950C2f7a10aFb17bf2fBb648d2"
};
```

### Add Custom Networks

In `context/contract-config.ts`:
```typescript
export const NETWORKS: Record<string, NetworkConfig> = {
  sepolia: {
    chainId: 11155111,
    name: "Sepolia",
    rpcUrl: "https://0xrpc.io/sep",
    blockExplorer: "https://sepolia.etherscan.io"
  },
  // Add your custom network here
  yourNetwork: {
    chainId: 12345,
    name: "Your Network",
    rpcUrl: "https://your-rpc-url.com",
    blockExplorer: "https://your-explorer.com"
  }
};
```

## 🎮 Available Game Types

- `coinflip` - Coin flip games
- `mines` - Minesweeper-style games  
- `paaji` - Paaji games
- `rugs` - Rugs games
- `unknown` - Default fallback

## 🔍 Common Usage Patterns

### Check User Stats
```tsx
const { userStats } = useContract();
if (userStats.data) {
  console.log('Games played:', userStats.data.gamesPlayed.toString());
  console.log('Total won:', formatEther(userStats.data.totalWon));
}
```

### Start a Game
```tsx
const { startGame } = useContract();
const result = await startGame('unique-game-id', 'coinflip', BigInt(1e16)); // 0.01 ETH
```

### Withdraw Winnings
```tsx
const { withdraw } = useContract();
const result = await withdraw();
```

### Get Game Details
```tsx
import { useGameDetails } from '../context/contract-provider';
const { data: game } = useGameDetails('game-id');
```

## 🐛 Troubleshooting

### Wallet Not Connecting
- Make sure you have the WalletConnect Project ID set
- Check that your wallet supports the network
- Try refreshing the page

### Contract Calls Failing
- Ensure you're on the correct network (Sepolia)
- Check that you have enough ETH for gas
- Verify the contract address is correct

### Data Not Loading
- Check your RPC endpoint is working
- Ensure the contract is deployed and verified
- Try refreshing the data with `refetch()`

## 📱 Mobile Support

The setup includes full mobile wallet support:
- WalletConnect for mobile wallets
- Deep linking for mobile browsers
- Responsive design components

## 🚀 Production Checklist

- [ ] Update contract address for mainnet
- [ ] Set up proper RPC endpoints
- [ ] Configure error monitoring
- [ ] Test all contract functions
- [ ] Set up transaction monitoring
- [ ] Configure proper gas settings



