import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { defineChain } from 'viem';

// Define U2U Solaris Mainnet chain
export const u2uSolaris = defineChain({
  id: 39,
  name: 'U2U Solaris Mainnet',
  nativeCurrency: {
    decimals: 18,
    name: 'U2U',
    symbol: 'U2U',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc-mainnet.u2u.xyz'],
    },
    public: {
      http: ['https://rpc-mainnet.u2u.xyz'],
    },
  },
  blockExplorers: {
    default: {
      name: 'U2UScan',
      url: 'https://u2uscan.xyz',
    },
  },
  testnet: false,
});

// Rainbow Kit configuration
export const config = getDefaultConfig({
  appName: 'Grass.fun',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'your-project-id',
  chains: [u2uSolaris],
  ssr: true, // If your dApp uses server side rendering (SSR)
});
