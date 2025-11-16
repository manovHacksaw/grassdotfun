"use client";

import { useEffect } from "react";
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { config } from '@/lib/wagmi';
import { WagmiWalletProvider } from "@/contexts/WagmiWalletContext";
import { UIProvider } from "@/contexts/UIContext";
import { ContractProvider } from "@/contexts/ContractProvider";
import { initializeExchangeRates } from "@/lib/currencyUtils";

// Create a client
const queryClient = new QueryClient();

export default function ClientProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  // Initialize exchange rates on app startup
  useEffect(() => {
    initializeExchangeRates();
  }, []);

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <WagmiWalletProvider>
            <ContractProvider>
              <UIProvider>
                {children}
              </UIProvider>
            </ContractProvider>
          </WagmiWalletProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}