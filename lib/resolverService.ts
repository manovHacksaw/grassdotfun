/**
 * Mock Resolver Service for Development
 * Provides dummy resolver functionality without blockchain dependencies
 */

export class ResolverService {
  private selector: any;
  private account: any;
  private contractId: string;

  constructor(selector: any, account: any, contractId: string = "game-v0.mantle") {
    this.selector = selector;
    this.account = account;
    this.contractId = contractId;
  }

  /**
   * Resolve a game as the resolver account (dummy implementation)
   */
  async resolveGame(gameId: string, didWin: boolean, multiplier: number = 1.0): Promise<string> {
    console.log('🎯 Mock ResolverService.resolveGame called');
    console.log('🎮 Game ID:', gameId);
    console.log('🏆 Did Win:', didWin);
    console.log('📊 Multiplier:', multiplier);

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    return `mock-resolver-tx-hash-${Date.now()}`;
  }

  /**
   * Get resolver account (dummy implementation)
   */
  async getResolverAccount(): Promise<string> {
    console.log('🔍 Mock ResolverService.getResolverAccount called');
    return 'resolver.mantle';
  }

  /**
   * Check if current account is resolver (dummy implementation)
   */
  async isResolverAccount(accountId: string): Promise<boolean> {
    console.log('🔍 Mock ResolverService.isResolverAccount called with:', accountId);
    return accountId === 'resolver.mantle';
  }
}