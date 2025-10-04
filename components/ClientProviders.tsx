"use client";

import { useEffect } from "react";
import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { config } from '../context/rainbow-config';
import { WalletProvider } from "@/contexts/WalletContext";
import { UIProvider } from "@/contexts/UIContext";
import { ContractProvider } from "@/context/contract-provider";
import { initializeExchangeRates } from "@/lib/currencyUtils";
import NetworkSwitcher from "./NetworkSwitcher";
import { ToastProvider } from "@/components/ui/Toast";

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
          <NetworkSwitcher />
          <WalletProvider>
            <ContractProvider>
              <UIProvider>
                {children}
              </UIProvider>
            </ContractProvider>
          </WalletProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
