"use client";

import React, { createContext, useContext } from "react";
import { useWagmiWallet } from "./WagmiWalletContext";

type ContractContextType = {
  getUserStats: (accountId: string) => Promise<any>;
  withdraw: () => Promise<string>;
  getAllUsers: () => Promise<any[]>;
};

const ContractContext = createContext<ContractContextType | undefined>(undefined);

export const ContractProvider = ({ children }: { children: React.ReactNode }) => {
  const { address } = useWagmiWallet();

  const getAllUsers = async(): Promise<any[]> => {
    // Return dummy user data
    return [
      {
        accountId: "user1.u2u",
        totalBet: "50.0",
        totalWon: "75.0",
        gamesPlayed: 10,
        gamesWon: 6
      },
      {
        accountId: "user2.u2u", 
        totalBet: "25.0",
        totalWon: "30.0",
        gamesPlayed: 5,
        gamesWon: 3
      },
      {
        accountId: "user3.u2u",
        totalBet: "100.0", 
        totalWon: "120.0",
        gamesPlayed: 20,
        gamesWon: 12
      }
    ];
  };

  const getUserStats = async (accountId: string) => {
    // Return dummy user stats
    return {
      totalBet: "150.0",
      totalWon: "180.0", 
      totalLost: "20.0",
      withdrawableBalance: "10.0",
      gamesPlayed: 25,
      gamesWon: 15,
      winRate: 60.0,
      favoriteGame: "Coinflip",
      joinDate: "1700000000000",
      lastPlayDate: "1700000000000",
      gameTypeStats: [
        {
          gameType: "Coinflip",
          totalBets: 75.0,
          totalWon: 90.0,
          totalLost: 10.0,
          gamesPlayed: 15,
          gamesWon: 9,
          winRate: 60.0,
          avgMultiplier: 1.2,
          bestMultiplier: 2.0
        },
        {
          gameType: "Mines",
          totalBets: 50.0,
          totalWon: 60.0,
          totalLost: 5.0,
          gamesPlayed: 8,
          gamesWon: 5,
          winRate: 62.5,
          avgMultiplier: 1.5,
          bestMultiplier: 3.0
        }
      ]
    };
  };

  const withdraw = async (): Promise<string> => {
    // Simulate withdrawal
    console.log("Withdrawal simulated");
    return "dummy-transaction-hash-123";
  };

  return (
    <ContractContext.Provider value={{ getUserStats, withdraw, getAllUsers }}>
      {children}
    </ContractContext.Provider>
  );
};

export const useContract = () => {
  const ctx = useContext(ContractContext);
  if (!ctx) throw new Error("useContract must be used inside ContractProvider");
  return ctx;
};