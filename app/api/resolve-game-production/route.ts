import { NextRequest, NextResponse } from 'next/server';
import { createResolverService } from '@/lib/realResolverService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { gameId, didWin, multiplier, gameType, player } = body;

    // Validate required fields
    if (!gameId || typeof didWin !== 'boolean' || !multiplier) {
      return NextResponse.json(
        { error: 'Missing required fields: gameId, didWin, multiplier' },
        { status: 400 }
      );
    }

    // Get private key from environment
    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) {
      console.error('❌ PRIVATE_KEY not found in environment variables');
      return NextResponse.json(
        { error: 'Resolver configuration error' },
        { status: 500 }
      );
    }

    console.log(`🚀 Resolving game: ${gameId} - ${didWin ? 'WIN' : 'LOSE'} at ${multiplier}x`);
    console.log(`🎮 Game Type: ${gameType || 'unknown'}`);
    console.log(`👤 Player: ${player || 'unknown'}`);

    // Create resolver service
    const resolverService = createResolverService(privateKey);

    // Resolve the game
    const transactionHash = await resolverService.resolveGame(gameId, didWin, multiplier);

    console.log(`✅ Game resolved successfully: ${transactionHash}`);

    return NextResponse.json({
      success: true,
      transactionHash,
      gameId,
      didWin,
      multiplier,
      message: 'Game resolved successfully'
    });

  } catch (error: unknown) {
    console.error('❌ Error resolving game:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to resolve game',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}