import { NextRequest, NextResponse } from 'next/server';
import { createWalletClient, http, parseEther } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { sepolia } from 'viem/chains';

// Import contract ABI and config
const CONTRACT_ADDRESS = '0x7769C0DCAA9316fc592f7258B3fACA2300D41caf';
const RESOLVER_PRIVATE_KEY = process.env.RESOLVER_PRIVATE_KEY as string | undefined;

// Contract ABI - just the resolveGame function
const RESOLVE_GAME_ABI = [
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "gameId",
        "type": "string"
      },
      {
        "internalType": "bool",
        "name": "didWin",
        "type": "bool"
      },
      {
        "internalType": "uint256",
        "name": "multiplierPercent",
        "type": "uint256"
      }
    ],
    "name": "resolveGame",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;

export async function POST(request: NextRequest) {
  try {
    const { gameId, didWin, multiplierPercent } = await request.json();

    // Validate input
    if (!gameId || typeof didWin !== 'boolean' || !multiplierPercent) {
      return NextResponse.json(
        { error: 'Missing required fields: gameId, didWin, multiplierPercent' },
        { status: 400 }
      );
    }

    console.log(`🎯 Resolving game: ${gameId}, Win: ${didWin}, Multiplier: ${multiplierPercent}%`);

    // Create resolver account
    const account = privateKeyToAccount(RESOLVER_PRIVATE_KEY as `0x${string}`);
    
    // Create wallet client
    const client = createWalletClient({
      account,
      chain: sepolia,
      transport: http('https://0xrpc.io/sep')
    });

    // Resolve the game
    const hash = await client.writeContract({
      address: CONTRACT_ADDRESS as `0x${string}`,
      abi: RESOLVE_GAME_ABI,
      functionName: 'resolveGame',
      args: [gameId, didWin, BigInt(multiplierPercent)]
    });

    console.log(`✅ Game resolved successfully! Transaction hash: ${hash}`);

    return NextResponse.json({
      success: true,
      hash,
      gameId,
      didWin,
      multiplierPercent
    });

  } catch (error: any) {
    console.error('❌ Error resolving game:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to resolve game',
        details: error.message,
        success: false
      },
      { status: 500 }
    );
  }
}
