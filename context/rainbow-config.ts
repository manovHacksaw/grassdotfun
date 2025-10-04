import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { sepolia, mainnet } from 'wagmi/chains';
import { NETWORKS } from './contract-config';

// Configure chains for RainbowKit
export const config = getDefaultConfig({
  appName: 'SecureGames',
  projectId: 'YOUR_WALLET_CONNECT_PROJECT_ID', // Get this from https://cloud.walletconnect.com/
  chains: [sepolia, mainnet],
  ssr: true, // If your dApp uses server side rendering (SSR)
});

// Alternative configuration if you want to use custom RPC URLs
export const customConfig = getDefaultConfig({
  appName: 'SecureGames',
  projectId: 'YOUR_WALLET_CONNECT_PROJECT_ID',
  chains: [
    {
      ...sepolia,
      rpcUrls: {
        default: {
          http: [NETWORKS.sepolia.rpcUrl],
        },
        public: {
          http: [NETWORKS.sepolia.rpcUrl],
        },
      },
    },
    {
      ...mainnet,
      rpcUrls: {
        default: {
          http: [NETWORKS.mainnet.rpcUrl],
        },
        public: {
          http: [NETWORKS.mainnet.rpcUrl],
        },
      },
    },
  ],
  ssr: true,
});



