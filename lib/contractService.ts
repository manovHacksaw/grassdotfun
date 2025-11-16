/**
 * Contract Service for Production
 * This is now a compatibility layer - games should use wagmi hooks directly
 */

export class ContractService {
  private account: any;

  constructor(selector: any, account: any, contractId: string = "game-v0.celo") {
    this.account = account;
  }

  /**
   * Start a new game with a bet amount
   * Note: This method is deprecated. Use wagmi hooks directly in components.
   */
  async startGame(gameId: string, betAmount: string, gameType?: string): Promise<string> {
    console.log('🎮 ContractService.startGame called (deprecated)');
    console.log('🎮 Game ID:', gameId);
    console.log('💰 Bet Amount:', betAmount);
    console.log('🎯 Game Type:', gameType);
    
    throw new Error('ContractService.startGame is deprecated. Use wagmi hooks directly in components.');
  }

  /**
   * Resolve a game (delegates to gameOutcomeService)
   */
  async resolveGame(gameId: string, didWin: boolean, multiplier: number = 1.0): Promise<string> {
    console.log('🎯 ContractService.resolveGame called');
    console.log('🎮 Game ID:', gameId);
    console.log('🏆 Did Win:', didWin);
    console.log('📊 Multiplier:', multiplier);
    
    // This will be handled by the gameOutcomeService which calls the API
    return `resolve-${Date.now()}`;
  }

  /**
   * Get game details
   * Note: This method is deprecated. Use wagmi hooks directly in components.
   */
  async getGameDetails(gameId: string): Promise<any> {
    console.log('🔍 ContractService.getGameDetails called (deprecated)');
    throw new Error('ContractService.getGameDetails is deprecated. Use wagmi hooks directly in components.');
  }

  /**
   * Get user statistics
   * Note: This method is deprecated. Use wagmi hooks directly in components.
   */
  async getUserStats(accountId: string): Promise<any> {
    console.log('🔍 ContractService.getUserStats called (deprecated)');
    throw new Error('ContractService.getUserStats is deprecated. Use wagmi hooks directly in components.');
  }

  /**
   * Get comprehensive user statistics
   * Note: This method is deprecated. Use wagmi hooks directly in components.
   */
  async getUserComprehensiveStats(accountId: string): Promise<any> {
    console.log('🔍 ContractService.getUserComprehensiveStats called (deprecated)');
    throw new Error('ContractService.getUserComprehensiveStats is deprecated. Use wagmi hooks directly in components.');
  }

  /**
   * Get user game type statistics
   * Note: This method is deprecated. Use wagmi hooks directly in components.
   */
  async getUserGameStats(accountId: string): Promise<any[]> {
    console.log('🔍 ContractService.getUserGameStats called (deprecated)');
    throw new Error('ContractService.getUserGameStats is deprecated. Use wagmi hooks directly in components.');
  }

  /**
   * Get contract statistics
   * Note: This method is deprecated. Use wagmi hooks directly in components.
   */
  async getContractStats(): Promise<any> {
    console.log('🔍 ContractService.getContractStats called (deprecated)');
    throw new Error('ContractService.getContractStats is deprecated. Use wagmi hooks directly in components.');
  }

  /**
   * Withdraw winnings
   * Note: This method is deprecated. Use wagmi hooks directly in components.
   */
  async withdraw(): Promise<string> {
    console.log('💰 ContractService.withdraw called (deprecated)');
    throw new Error('ContractService.withdraw is deprecated. Use wagmi hooks directly in components.');
  }

  /**
   * Get contract total losses
   * Note: This method is deprecated. Use wagmi hooks directly in components.
   */
  async getContractTotalLosses(): Promise<string> {
    console.log('🔍 ContractService.getContractTotalLosses called (deprecated)');
    throw new Error('ContractService.getContractTotalLosses is deprecated. Use wagmi hooks directly in components.');
  }

  /**
   * Get total number of users
   * Note: This method is deprecated. Use wagmi hooks directly in components.
   */
  async getTotalUsers(): Promise<number> {
    console.log('🔍 ContractService.getTotalUsers called (deprecated)');
    throw new Error('ContractService.getTotalUsers is deprecated. Use wagmi hooks directly in components.');
  }

  /**
   * Check if user has pending bet
   * Note: This method is deprecated. Use wagmi hooks directly in components.
   */
  async hasPendingBet(accountId: string): Promise<boolean> {
    console.log('🔍 ContractService.hasPendingBet called (deprecated)');
    throw new Error('ContractService.hasPendingBet is deprecated. Use wagmi hooks directly in components.');
  }

  /**
   * Get resolver account ID
   * Note: This method is deprecated. Use wagmi hooks directly in components.
   */
  async getOracleAccount(): Promise<string> {
    console.log('🔍 ContractService.getOracleAccount called (deprecated)');
    throw new Error('ContractService.getOracleAccount is deprecated. Use wagmi hooks directly in components.');
  }

  /**
   * Set oracle account (not implemented in contract)
   * Note: This method is deprecated. Use wagmi hooks directly in components.
   */
  async setOracleAccount(oracleAccountId: string): Promise<string> {
    console.log('🔍 ContractService.setOracleAccount called (deprecated)');
    throw new Error('ContractService.setOracleAccount is deprecated. Use wagmi hooks directly in components.');
  }
}