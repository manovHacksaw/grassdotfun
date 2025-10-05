"use client";

import React, { createContext, useContext, ReactNode } from "react";
import { useAccount, useBalance, useDisconnect, useConnect } from "wagmi";
import { formatEther } from "viem";

interface WagmiWalletContextType {
  address: `0x${string}` | undefined;
  isConnected: boolean;
  isConnecting: boolean;
  balance: string;
  isBalanceLoading: boolean;
  connect: () => void;
  disconnect: () => void;
  refreshBalance: () => void;
}

const WagmiWalletContext = createContext<WagmiWalletContextType | undefined>(undefined);

interface WagmiWalletProviderProps {
  children: ReactNode;
}

export function WagmiWalletProvider({ children }: WagmiWalletProviderProps) {
  const { address, isConnected, isConnecting } = useAccount();
  const { data: balanceData, isLoading: isBalanceLoading, refetch: refetchBalance } = useBalance({
    address: address,
  });
  const { disconnect } = useDisconnect();
  const { connect, connectors } = useConnect();

  const balance = balanceData ? formatEther(balanceData.value) : "0.00";

  const handleConnect = () => {
    if (connectors[0]) {
      connect({ connector: connectors[0] });
    }
  };

  const handleDisconnect = () => {
    disconnect();
  };

  const refreshBalance = () => {
    refetchBalance();
  };

  const value: WagmiWalletContextType = {
    address,
    isConnected,
    isConnecting,
    balance,
    isBalanceLoading,
    connect: handleConnect,
    disconnect: handleDisconnect,
    refreshBalance,
  };

  return (
    <WagmiWalletContext.Provider value={value}>
      {children}
    </WagmiWalletContext.Provider>
  );
}

export function useWagmiWallet() {
  const context = useContext(WagmiWalletContext);
  if (context === undefined) {
    throw new Error('useWagmiWallet must be used within a WagmiWalletProvider');
  }
  return context;
}
