"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";

interface WalletContextType {
  selector: any | null;
  modal: any;
  accountId: string | null;
  isConnected: boolean;
  isLoading: boolean;
  balance: string;
  isBalanceLoading: boolean;
  connect: () => void;
  disconnect: () => Promise<void>;
  getBalance: () => Promise<string>;
  refreshBalance: () => Promise<void>;
  invalidateBalanceCache: () => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

interface WalletProviderProps {
  children: ReactNode;
}

export function WalletProvider({ children }: WalletProviderProps) {
  const [selector, setSelector] = useState<any | null>(null);
  const [modal, setModal] = useState<any>(null);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [balance, setBalance] = useState<string>("100.00");
  const [isBalanceLoading, setIsBalanceLoading] = useState(false);

  const getBalance = useCallback(async (): Promise<string> => {
    // Return dummy balance
    return "100.00";
  }, []);

  const refreshBalance = useCallback(async (): Promise<void> => {
    if (!accountId) {
      setBalance("100.00");
      setIsBalanceLoading(false);
      return;
    }
    
    try {
      setIsBalanceLoading(true);
      const newBalance = await getBalance();
      setBalance(newBalance);
    } catch (err) {
      console.error("Failed to refresh balance:", err);
      setBalance("100.00");
    } finally {
      setIsBalanceLoading(false);
    }
  }, [accountId, getBalance]);

  const invalidateBalanceCache = useCallback(() => {
    console.log("Balance cache invalidated (dummy)");
  }, []);

  useEffect(() => {
    // Simulate wallet initialization
    setIsLoading(false);
  }, []);

  // Auto-refresh balance when account changes
  useEffect(() => {
    if (accountId) {
      refreshBalance();
    } else {
      setBalance("100.00");
    }
  }, [accountId, refreshBalance]);

  const connect = () => {
    // Simulate wallet connection
    const dummyAccountId = "user.u2u";
    setAccountId(dummyAccountId);
    setSelector({}); // Dummy selector
    setModal({}); // Dummy modal
  };

  const disconnect = async () => {
    setAccountId(null);
    setSelector(null);
    setModal(null);
  };

  const value: WalletContextType = {
    selector,
    modal,
    accountId,
    isConnected: !!accountId,
    isLoading,
    balance,
    isBalanceLoading,
    connect,
    disconnect,
    getBalance,
    refreshBalance,
    invalidateBalanceCache,
  };

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used within WalletProvider");
  return ctx;
}