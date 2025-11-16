import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { celo } from 'viem/chains';

// Rainbow Kit configuration for CELO Mainnet
export const config = getDefaultConfig({
  appName: 'Grass.fun',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'your-project-id',
  chains: [celo],
  ssr: true, // If your dApp uses server side rendering (SSR)
});
