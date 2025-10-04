/**
 * Service for automatic game resolution via API
 * This allows games to be resolved without requiring user signatures
 */

export interface GameResolutionRequest {
  gameId: string;
  didWin: boolean;
  multiplierPercent: number;
}

export interface GameResolutionResponse {
  success: boolean;
  hash?: string;
  gameId: string;
  didWin: boolean;
  multiplierPercent: number;
  error?: string;
  details?: string;
}

export class GameResolutionService {
  private static instance: GameResolutionService;
  private baseUrl: string;

  private constructor() {
    this.baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://your-domain.com' 
      : 'http://localhost:3000';
  }

  public static getInstance(): GameResolutionService {
    if (!GameResolutionService.instance) {
      GameResolutionService.instance = new GameResolutionService();
    }
    return GameResolutionService.instance;
  }

  /**
   * Resolve a game automatically using the resolver's private key
   * @param request Game resolution request
   * @returns Promise with resolution result
   */
  public async resolveGame(request: GameResolutionRequest): Promise<GameResolutionResponse> {
    try {
      console.log('🎯 Auto-resolving game:', request);

      const response = await fetch(`${this.baseUrl}/api/resolve-game`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('❌ API error:', result);
        return {
          success: false,
          gameId: request.gameId,
          didWin: request.didWin,
          multiplierPercent: request.multiplierPercent,
          error: result.error || 'Unknown API error',
          details: result.details
        };
      }

      console.log('✅ Game resolved successfully:', result);
      return result;

    } catch (error: any) {
      console.error('❌ Network error resolving game:', error);
      return {
        success: false,
        gameId: request.gameId,
        didWin: request.didWin,
        multiplierPercent: request.multiplierPercent,
        error: 'Network error',
        details: error.message
      };
    }
  }

  /**
   * Resolve multiple games in batch
   * @param requests Array of game resolution requests
   * @returns Promise with array of resolution results
   */
  public async resolveGames(requests: GameResolutionRequest[]): Promise<GameResolutionResponse[]> {
    const promises = requests.map(request => this.resolveGame(request));
    return Promise.all(promises);
  }
}

// Export singleton instance
export const gameResolutionService = GameResolutionService.getInstance();
