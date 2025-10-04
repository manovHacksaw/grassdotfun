# EVM Wallet Integration Guide

## 🔄 Migration from NEAR to EVM

Your wallet system has been successfully migrated from NEAR to EVM using RainbowKit and wagmi. Here's what you need to do to complete the integration:

## 📋 Required Changes

### 1. Update Your App Layout

You need to wrap your app with the EVM providers. Update your main layout file (`app/layout.tsx` or `pages/_app.tsx`):

```tsx
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

### 3. Update Your Components

Your existing components using `useWallet()` will continue to work, but now they'll use EVM instead of NEAR:

```tsx
// This will now return EVM address and ETH balance
const { accountId, isConnected, balance } = useWallet();
```

### 4. Use the Contract Provider

You can now use the contract provider for smart contract interactions:

```tsx
import { useContract } from '../context/contract-provider';

function MyComponent() {
  const { startGame, userStats, contractStats } = useContract();
  
  const handleStartGame = async () => {
    const result = await startGame('game-1', 'coinflip', BigInt(1e16)); // 0.01 ETH
    if (result.success) {
      console.log('Game started!', result.hash);
    }
  };
  
  return (
    <div>
      <p>Games Played: {userStats.data?.gamesPlayed.toString()}</p>
      <button onClick={handleStartGame}>Start Game</button>
    </div>
  );
}
```

## 🔧 What Changed

### WalletContext Changes
- ✅ Now uses `useAccount`, `useBalance` from wagmi
- ✅ Returns ETH balance instead of NEAR
- ✅ Includes chain information (chainId, chainName)
- ✅ Simplified balance fetching using wagmi hooks

### ConnectWalletButton Changes
- ✅ Now uses RainbowKit's `ConnectButton.Custom`
- ✅ Shows ETH balance instead of NEAR
- ✅ Includes chain switching functionality
- ✅ Better wallet connection UI

### New Features
- ✅ Multi-chain support (Sepolia, Mainnet, Localhost)
- ✅ Chain switching
- ✅ Better error handling
- ✅ Mobile wallet support
- ✅ Smart contract integration

## 🎯 Contract Integration

Your deployed contract is ready to use:
- **Contract Address**: `0x7769C0DCAA9316fc592f7258B3fACA2300D41caf`
- **Network**: Sepolia Testnet
- **Resolver**: `0x2D4575003f6017950C2f7a10aFb17bf2fBb648d2`

## 🚀 Testing

1. Start your development server: `npm run dev`
2. Open your app in the browser
3. Click "Connect Wallet" to see RainbowKit modal
4. Connect with MetaMask, WalletConnect, or other supported wallets
5. Make sure you're on Sepolia testnet
6. Test contract interactions

## 🔍 Troubleshooting

### Wallet Not Connecting
- Make sure you have the WalletConnect Project ID set
- Check that your wallet supports the network
- Try refreshing the page

### Wrong Network
- The app will show "Wrong network" if not on Sepolia
- Click the button to switch networks
- Or manually switch in your wallet

### Contract Calls Failing
- Ensure you're on Sepolia testnet
- Check that you have enough ETH for gas
- Verify the contract address is correct

## 📱 Mobile Support

RainbowKit provides excellent mobile support:
- WalletConnect for mobile wallets
- Deep linking for mobile browsers
- Responsive design

## 🎮 Game Types

The contract supports these game types:
- `coinflip` - Coin flip games
- `mines` - Minesweeper-style games
- `paaji` - Paaji games
- `rugs` - Rugs games

## 🔒 Security

- All transactions are signed by the user's wallet
- No private keys are stored in the app
- Contract interactions are secure and transparent
- Users maintain full control of their funds

Your app is now ready to use EVM wallets and interact with the SecureGames smart contract!



