import { NextRequest, NextResponse } from 'next/server';
import { createResolverService } from '@/lib/realResolverService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { gameId, didWin, multiplier, gameType, player } = body;

    // Validate required fields
    if (!gameId || typeof didWin !== 'boolean' || !multiplier) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields: gameId, didWin, multiplier' },
        { status: 400 }
      );
    }

    // Get private key from environment
    let privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) {
      console.error('❌ PRIVATE_KEY not found in environment variables');
      return NextResponse.json(
        { 
          success: false,
          error: 'Resolver configuration error',
          message: 'PRIVATE_KEY environment variable is not set. Please set it in your .env.local file or environment configuration.'
        },
        { status: 500 }
      );
    }

    // Ensure private key has 0x prefix for ethers.js
    if (!privateKey.startsWith('0x')) {
      privateKey = '0x' + privateKey;
      console.log('ℹ️ Added 0x prefix to private key');
    }

    // Validate private key format (should be 66 characters with 0x prefix = 64 hex chars)
    if (privateKey.length !== 66 || !/^0x[0-9a-fA-F]{64}$/.test(privateKey)) {
      console.error('❌ Invalid private key format. Should be 64 hex characters (with or without 0x prefix)');
      return NextResponse.json(
        { 
          success: false,
          error: 'Resolver configuration error',
          message: 'Invalid private key format. Private key should be 64 hexadecimal characters.'
        },
        { status: 500 }
      );
    }

    console.log(`🚀 Resolving game: ${gameId} - ${didWin ? 'WIN' : 'LOSE'} at ${multiplier}x`);
    console.log(`🎮 Game Type: ${gameType || 'unknown'}`);
    console.log(`👤 Player: ${player || 'unknown'}`);

    // Create resolver service
    let resolverService;
    try {
      resolverService = createResolverService(privateKey);
      console.log('✅ Resolver service created successfully');
    } catch (error: unknown) {
      console.error('❌ Failed to create resolver service:', error);
      return NextResponse.json(
        { 
          success: false,
          error: 'Resolver configuration error',
          message: error instanceof Error ? error.message : 'Failed to initialize resolver service'
        },
        { status: 500 }
      );
    }

    // Resolve the game on-chain
    let transactionHash: string;
    try {
      transactionHash = await resolverService.resolveGame(gameId, didWin, multiplier);
      console.log(`✅ Game resolved successfully on-chain: ${transactionHash}`);
    } catch (error: unknown) {
      console.error('❌ Error during game resolution:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      return NextResponse.json(
        { 
          success: false,
          error: 'Failed to resolve game',
          message: errorMessage
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      transactionHash,
      gameId,
      didWin,
      multiplier,
      gameType,
      player,
      message: 'Game resolved successfully on-chain'
    });

  } catch (error: unknown) {
    console.error('❌ Error resolving game:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to resolve game',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}