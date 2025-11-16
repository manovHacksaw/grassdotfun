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
    let privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) {
      console.error('❌ PRIVATE_KEY not found in environment variables');
      console.error('❌ Available env vars:', Object.keys(process.env).filter(k => k.includes('PRIVATE') || k.includes('KEY')));
      return NextResponse.json(
        { 
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
          error: 'Resolver configuration error',
          message: 'Invalid private key format. Private key should be 64 hexadecimal characters.'
        },
        { status: 500 }
      );
    }

    console.log(`🚀 Resolving game: ${gameId} - ${didWin ? 'WIN' : 'LOSE'} at ${multiplier}x`);
    console.log(`🎮 Game Type: ${gameType || 'unknown'}`);
    console.log(`👤 Player: ${player || 'unknown'}`);
    console.log(`🔑 Private key loaded: ${privateKey.substring(0, 6)}...${privateKey.substring(privateKey.length - 4)}`);

    // Create resolver service
    let resolverService;
    try {
      resolverService = createResolverService(privateKey);
      console.log('✅ Resolver service created successfully');
    } catch (error: unknown) {
      console.error('❌ Failed to create resolver service:', error);
      return NextResponse.json(
        { 
          error: 'Resolver configuration error',
          message: error instanceof Error ? error.message : 'Failed to initialize resolver service'
        },
        { status: 500 }
      );
    }

    // Get resolver account from contract for better error messages
    let contractResolverAddress: string | null = null;
    let signerAddress: string | null = null;
    try {
      const { ethers } = await import('ethers');
      const RPC_URL = 'https://forno.celo.org';
      const CONTRACT_ADDRESS = '0x61d11C622Bd98A71aD9361833379A2066Ad29CCa';
      const provider = new ethers.JsonRpcProvider(RPC_URL);
      
      // Get resolver from contract
      const contractABI = [
        {
          "inputs": [],
          "name": "getResolverAccount",
          "outputs": [{"internalType": "address", "name": "", "type": "address"}],
          "stateMutability": "view",
          "type": "function"
        }
      ];
      const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, provider);
      contractResolverAddress = await contract.getResolverAccount();
      
      // Get signer address from private key
      let keyToUse = privateKey;
      if (!keyToUse.startsWith('0x')) {
        keyToUse = '0x' + keyToUse;
      }
      const wallet = new ethers.Wallet(keyToUse, provider);
      signerAddress = wallet.address;
      
      console.log(`🔍 Contract resolver: ${contractResolverAddress}`);
      console.log(`🔍 Signer address: ${signerAddress}`);
    } catch (err) {
      console.error('Failed to get addresses for error message:', err);
    }

    // Resolve the game
    let transactionHash: string;
    try {
      transactionHash = await resolverService.resolveGame(gameId, didWin, multiplier);
      console.log(`✅ Game resolved successfully: ${transactionHash}`);
    } catch (error: unknown) {
      console.error('❌ Error during game resolution:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      // Provide more specific error messages
      if (errorMessage.includes('Only resolver') || errorMessage.includes('not the resolver')) {
        return NextResponse.json(
          { 
            error: 'Authorization error',
            message: 'The private key does not correspond to the resolver account.',
            details: {
              signerAddress: signerAddress || 'Unknown',
              contractResolver: contractResolverAddress || 'Unknown',
              matches: signerAddress && contractResolverAddress 
                ? signerAddress.toLowerCase() === contractResolverAddress.toLowerCase()
                : false
            },
            troubleshooting: [
              `Your private key derives to: ${signerAddress || 'Unknown'}`,
              `Contract expects resolver: ${contractResolverAddress || 'Unknown'}`,
              'Please use the private key that corresponds to the resolver account.',
              'Check /api/check-env to verify your private key matches the resolver.'
            ]
          },
          { status: 403 }
        );
      }
      
      return NextResponse.json(
        { 
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