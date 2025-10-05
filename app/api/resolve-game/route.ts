import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { gameId, didWin, multiplier, gameType, player } = body;

    if (!gameId || didWin === undefined || !multiplier) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields: gameId, didWin, multiplier' },
        { status: 400 }
      );
    }

    console.log(`🚀 Mock Resolver: Resolving game ${gameId}`);
    console.log(`📋 Outcome: ${didWin ? 'WIN' : 'LOSE'} with ${multiplier}x multiplier`);
    console.log(`📋 Game type: ${gameType}, Player: ${player}`);

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Generate mock transaction hash
    const mockTransactionHash = `mock-tx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    console.log('✅ Mock game resolved successfully:', mockTransactionHash);

    return NextResponse.json({
      success: true,
      message: `Game ${gameId} resolved successfully (mock)`,
      gameId,
      didWin,
      multiplier,
      gameType,
      player,
      contractId: 'game-v0.u2u',
      resolverAccountId: 'resolver.u2u',
      transactionHash: mockTransactionHash,
      timestamp: new Date().toISOString(),
      note: "Game resolved using mock resolver for U2U development"
    });

  } catch (error: any) {
    console.error('❌ Error resolving game:', error);
    return NextResponse.json(
      { success: false, message: `Error resolving game: ${error.message}` },
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