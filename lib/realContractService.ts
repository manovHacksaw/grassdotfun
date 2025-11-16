/**
 * Real Contract Service for Production
 * Integrates with the deployed SecureGames contract on CELO Mainnet
 */

import { ethers } from 'ethers';
import { parseEther, formatEther } from 'viem';

// Contract configuration
const CONTRACT_ADDRESS = '0x61d11C622Bd98A71aD9361833379A2066Ad29CCa';
const RPC_URL = 'https://forno.celo.org';
const CHAIN_ID = 42220;

// Contract ABI - only the functions we need
const CONTRACT_ABI = [
  {
    "inputs": [
      {"internalType": "string", "name": "gameId", "type": "string"},
      {"internalType": "string", "name": "gameType", "type": "string"}
    ],
    "name": "startGame",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "string", "name": "gameId", "type": "string"},
      {"internalType": "bool", "name": "didWin", "type": "bool"},
      {"internalType": "uint256", "name": "multiplierPercent", "type": "uint256"}
    ],
    "name": "resolveGame",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "string", "name": "gameId", "type": "string"}],
    "name": "getGameDetails",
    "outputs": [
      {"internalType": "string", "name": "id", "type": "string"},
      {"internalType": "address", "name": "player", "type": "address"},
      {"internalType": "uint256", "name": "amount", "type": "uint256"},
      {"internalType": "uint8", "name": "status", "type": "uint8"},
      {"internalType": "uint256", "name": "blockNumber", "type": "uint256"},
      {"internalType": "string", "name": "gameType", "type": "string"},
      {"internalType": "uint256", "name": "multiplierPercent", "type": "uint256"},
      {"internalType": "bool", "name": "existsFlag", "type": "bool"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "account", "type": "address"}],
    "name": "getUserStats",
    "outputs": [
      {"internalType": "uint256", "name": "totalBet", "type": "uint256"},
      {"internalType": "uint256", "name": "totalWon", "type": "uint256"},
      {"internalType": "uint256", "name": "totalLost", "type": "uint256"},
      {"internalType": "uint256", "name": "withdrawableBalance", "type": "uint256"},
      {"internalType": "uint256", "name": "gamesPlayed", "type": "uint256"},
      {"internalType": "uint256", "name": "gamesWon", "type": "uint256"},
      {"internalType": "uint256", "name": "joinBlock", "type": "uint256"},
      {"internalType": "uint256", "name": "joinTimestamp", "type": "uint256"},
      {"internalType": "uint256", "name": "lastPlayBlock", "type": "uint256"},
      {"internalType": "uint256", "name": "lastPlayTimestamp", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getContractStats",
    "outputs": [
      {"internalType": "uint256", "name": "totalUsers", "type": "uint256"},
      {"internalType": "uint256", "name": "totalBets", "type": "uint256"},
      {"internalType": "uint256", "name": "totalWinnings", "type": "uint256"},
      {"internalType": "uint256", "name": "totalGames", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "withdraw",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getResolverAccount",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  }
];

export class RealContractService {
  private provider: ethers.JsonRpcProvider;
  private contract: ethers.Contract;
  private signer: ethers.Wallet | null = null;

  constructor(privateKey?: string) {
    // Initialize provider
    this.provider = new ethers.JsonRpcProvider(RPC_URL);
    
    // Initialize contract
    this.contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, this.provider);
    
    // Initialize signer if private key is provided (for resolver operations)
    if (privateKey) {
      this.signer = new ethers.Wallet(privateKey, this.provider);
      this.contract = this.contract.connect(this.signer);
    }
  }

  /**
   * Start a new game with a bet amount
   */
  async startGame(gameId: string, betAmount: string, gameType: string = "unknown"): Promise<string> {
    try {
      console.log('🎮 RealContractService.startGame called');
      console.log('🎮 Game ID:', gameId);
      console.log('💰 Bet Amount:', betAmount);
      console.log('🎯 Game Type:', gameType);
      
      const value = parseEther(betAmount);
      
      const tx = await this.contract.startGame(gameId, gameType, { value });
      console.log('📝 Transaction sent:', tx.hash);
      
      const receipt = await tx.wait();
      console.log('✅ Transaction confirmed:', receipt.hash);
      
      return receipt.hash;
    } catch (error: any) {
      console.error('❌ Error starting game:', error);
      throw new Error(error.message || 'Failed to start game');
    }
  }

  /**
   * Resolve a game (only callable by resolver)
   */
  async resolveGame(gameId: string, didWin: boolean, multiplier: number = 1.0): Promise<string> {
    try {
      console.log('🎯 RealContractService.resolveGame called');
      console.log('🎮 Game ID:', gameId);
      console.log('🏆 Did Win:', didWin);
      console.log('📊 Multiplier:', multiplier);
      
      if (!this.signer) {
        throw new Error('Private key required for game resolution');
      }
      
      const multiplierPercent = Math.round(multiplier * 100);
      
      const tx = await this.contract.resolveGame(gameId, didWin, multiplierPercent);
      console.log('📝 Resolution transaction sent:', tx.hash);
      
      const receipt = await tx.wait();
      console.log('✅ Game resolved:', receipt.hash);
      
      return receipt.hash;
    } catch (error: any) {
      console.error('❌ Error resolving game:', error);
      throw new Error(error.message || 'Failed to resolve game');
    }
  }

  /**
   * Get game details
   */
  async getGameDetails(gameId: string): Promise<any> {
    try {
      console.log('🔍 RealContractService.getGameDetails called with gameId:', gameId);
      
      const result = await this.contract.getGameDetails(gameId);
      
      return {
        gameId: result[0],
        player: result[1],
        amount: formatEther(result[2]),
        status: result[3], // 0: Pending, 1: Won, 2: Lost
        blockNumber: result[4].toString(),
        gameType: result[5],
        multiplierPercent: result[6].toString(),
        existsFlag: result[7]
      };
    } catch (error: any) {
      console.error('❌ Error getting game details:', error);
      throw new Error(error.message || 'Failed to get game details');
    }
  }

  /**
   * Get user statistics
   */
  async getUserStats(accountAddress: string): Promise<any> {
    try {
      console.log('🔍 RealContractService.getUserStats called with account:', accountAddress);
      
      const result = await this.contract.getUserStats(accountAddress);
      
      return {
        totalBet: formatEther(result[0]),
        totalWon: formatEther(result[1]),
        totalLost: formatEther(result[2]),
        withdrawableBalance: formatEther(result[3]),
        gamesPlayed: result[4].toString(),
        gamesWon: result[5].toString(),
        joinBlock: result[6].toString(),
        joinTimestamp: result[7].toString(),
        lastPlayBlock: result[8].toString(),
        lastPlayTimestamp: result[9].toString()
      };
    } catch (error: any) {
      console.error('❌ Error getting user stats:', error);
      throw new Error(error.message || 'Failed to get user stats');
    }
  }

  /**
   * Get contract statistics
   */
  async getContractStats(): Promise<any> {
    try {
      console.log('🔍 RealContractService.getContractStats called');
      
      const result = await this.contract.getContractStats();
      
      return {
        totalUsers: result[0].toString(),
        totalBets: formatEther(result[1]),
        totalWinnings: formatEther(result[2]),
        totalGames: result[3].toString()
      };
    } catch (error: any) {
      console.error('❌ Error getting contract stats:', error);
      throw new Error(error.message || 'Failed to get contract stats');
    }
  }

  /**
   * Withdraw winnings
   */
  async withdraw(): Promise<string> {
    try {
      console.log('💰 RealContractService.withdraw called');
      
      const tx = await this.contract.withdraw();
      console.log('📝 Withdrawal transaction sent:', tx.hash);
      
      const receipt = await tx.wait();
      console.log('✅ Withdrawal confirmed:', receipt.hash);
      
      return receipt.hash;
    } catch (error: any) {
      console.error('❌ Error withdrawing:', error);
      throw new Error(error.message || 'Failed to withdraw');
    }
  }

  /**
   * Get resolver account address
   */
  async getResolverAccount(): Promise<string> {
    try {
      console.log('🔍 RealContractService.getResolverAccount called');
      
      const resolver = await this.contract.getResolverAccount();
      return resolver;
    } catch (error: any) {
      console.error('❌ Error getting resolver account:', error);
      throw new Error(error.message || 'Failed to get resolver account');
    }
  }

  /**
   * Check if current signer is the resolver
   */
  async isResolverAccount(): Promise<boolean> {
    try {
      if (!this.signer) return false;
      
      const resolver = await this.getResolverAccount();
      const signerAddress = await this.signer.getAddress();
      
      return resolver.toLowerCase() === signerAddress.toLowerCase();
    } catch (error: any) {
      console.error('❌ Error checking resolver status:', error);
      return false;
    }
  }
}

// Create instances for different use cases
export const createPlayerContractService = () => {
  return new RealContractService();
};

export const createResolverContractService = (privateKey: string) => {
  return new RealContractService(privateKey);
};
