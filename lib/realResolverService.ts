/**
 * Real Resolver Service for Production
 * Uses the private key from .env to resolve games on the deployed contract
 */

import { createResolverContractService } from './realContractService';

export class RealResolverService {
  private contractService: any;

  constructor(privateKey: string) {
    this.contractService = createResolverContractService(privateKey);
  }

  /**
   * Resolve a game with the given parameters
   */
  async resolveGame(gameId: string, didWin: boolean, multiplier: number = 1.0): Promise<string> {
    try {
      console.log(`🎯 Resolving game: ${gameId} - ${didWin ? 'WIN' : 'LOSE'} at ${multiplier}x`);
      
      // Check if we're the resolver
      const isResolver = await this.contractService.isResolverAccount();
      if (!isResolver) {
        throw new Error('Current account is not the resolver');
      }
      
      const txHash = await this.contractService.resolveGame(gameId, didWin, multiplier);
      console.log(`✅ Game resolved successfully: ${txHash}`);
      
      return txHash;
    } catch (error: any) {
      console.error('❌ Error resolving game:', error);
      throw error;
    }
  }

  /**
   * Get resolver account address
   */
  async getResolverAccount(): Promise<string> {
    return await this.contractService.getResolverAccount();
  }

  /**
   * Check if current account is resolver
   */
  async isResolverAccount(): Promise<boolean> {
    return await this.contractService.isResolverAccount();
  }
}

// Create resolver service instance with private key from environment
export const createResolverService = (privateKey: string) => {
  return new RealResolverService(privateKey);
};
