"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { useAccount, useBalance, useDisconnect } from 'wagmi';
import { formatEther } from 'viem';

interface WalletContextType {
  accountId: string | null;
  isConnected: boolean;
  isLoading: boolean;
  balance: string;
  isBalanceLoading: boolean;
  connect: () => void;
  disconnect: () => Promise<void>;
  getBalance: () => Promise<string>;
  refreshBalance: () => Promise<void>;
  chainId: number | undefined;
  chainName: string | undefined;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

interface WalletProviderProps {
  children: ReactNode;
}

export function WalletProvider({ children }: WalletProviderProps) {
  const { address, isConnected, chainId } = useAccount();
  const { data: balanceData, isLoading: isBalanceLoading, refetch: refetchBalance } = useBalance({
    address: address,
  });
  const { disconnect } = useDisconnect();
  
  const [balance, setBalance] = useState<string>("0.00");

  const getBalance = useCallback(async (): Promise<string> => {
    if (!address) {
      console.log("🔍 getBalance: No address connected");
      return "0.00";
    }

    try {
      if (balanceData) {
        const formattedBalance = formatEther(balanceData.value);
        console.log("🔍 Balance from wagmi:", formattedBalance);
        return formattedBalance;
      }
      
      // If no balance data, try to refetch
      const result = await refetchBalance();
      if (result.data) {
        const formattedBalance = formatEther(result.data.value);
        console.log("🔍 Balance from refetch:", formattedBalance);
        return formattedBalance;
      }
      
      return "0.00";
    } catch (err) {
      console.error("❌ Failed to fetch balance:", err);
      return "0.00";
    }
  }, [address, balanceData, refetchBalance]);

  const refreshBalance = useCallback(async (): Promise<void> => {
    if (!address) {
      console.log("🔍 refreshBalance: No address, setting balance to 0.00");
      setBalance("0.00");
      return;
    }
    
    try {
      console.log("🔍 refreshBalance: Fetching new balance...");
      const result = await refetchBalance();
      if (result.data) {
        const newBalance = formatEther(result.data.value);
        console.log("🔍 refreshBalance: Setting balance to:", newBalance);
        setBalance(newBalance);
      }
    } catch (err) {
      console.error("❌ Failed to refresh balance:", err);
      setBalance("0.00");
    }
  }, [address, refetchBalance]);

  // Get chain name
  const getChainName = (chainId: number | undefined): string => {
    switch (chainId) {
      case 1:
        return "Ethereum";
      case 11155111:
        return "Sepolia";
      case 31337:
        return "Localhost";
      default:
        return "Unknown";
    }
  };

  // Auto-refresh balance when address changes
  useEffect(() => {
    console.log("🔍 Balance effect triggered, address:", address);
    if (address && balanceData) {
      const formattedBalance = formatEther(balanceData.value);
      console.log("🔍 Setting balance to:", formattedBalance);
      setBalance(formattedBalance);
    } else {
      console.log("🔍 No address or balance data, setting balance to 0.00");
      setBalance("0.00");
    }
  }, [address, balanceData]);


  const disconnectWallet = async () => {
    try {
      await disconnect();
      setBalance("0.00");
    } catch (err) {
      console.error("Failed to disconnect:", err);
    }
  };

  const value: WalletContextType = {
    accountId: address || null,
    isConnected,
    isLoading: false,
    balance,
    isBalanceLoading,
    connect: () => {
      // RainbowKit handles the connection UI
      console.log("🔍 Connect called - RainbowKit will handle the connection");
    },
    disconnect: disconnectWallet,
    getBalance,
    refreshBalance,
    chainId,
    chainName: getChainName(chainId),
  };

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used within WalletProvider");
  return ctx;
}
