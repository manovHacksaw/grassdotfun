/**
 * Mock Balance Service for Development
 * Provides a fallback balance when all API endpoints fail
 * Updated for CELO dummy data
 */

export class MockBalanceService {
  private static readonly MOCK_BALANCE = "100.00"; // Mock balance for development
  
  /**
   * Get a mock balance for development/testing
   */
  static getMockBalance(accountId: string): string {
    console.log(`🎭 Using mock balance for ${accountId}: ${this.MOCK_BALANCE} CELO`);
    return this.MOCK_BALANCE;
  }
  
  /**
   * Check if we should use mock balance (for development)
   */
  static shouldUseMock(): boolean {
    // Use mock in development or when explicitly enabled
    return process.env.NODE_ENV === 'development' || 
           process.env.USE_MOCK_BALANCE === 'true';
  }
}