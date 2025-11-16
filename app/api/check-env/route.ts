import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';

/**
 * Test endpoint to check if PRIVATE_KEY environment variable is accessible
 * and if it matches the resolver account in the contract
 */
export async function GET(request: NextRequest) {
  try {
    const privateKey = process.env.PRIVATE_KEY;
    const hasPrivateKey = !!privateKey;
    const privateKeyLength = privateKey?.length || 0;
    const has0xPrefix = privateKey?.startsWith('0x') || false;
    
    // Show first and last few characters for verification (without exposing full key)
    const maskedKey = privateKey 
      ? `${privateKey.substring(0, 6)}...${privateKey.substring(privateKey.length - 4)}`
      : 'NOT SET';

    // Expected resolver address from deployment info
    const EXPECTED_RESOLVER = '0x2D4575003f6017950C2f7a10aFb17bf2fBb648d2';
    const CONTRACT_ADDRESS = '0x61d11C622Bd98A71aD9361833379A2066Ad29CCa';
    const RPC_URL = 'https://forno.celo.org';

    let derivedAddress = null;
    let matchesResolver = false;
    let contractResolver = null;
    let errorMessage = null;

    // Try to derive address from private key
    if (privateKey) {
      try {
        let keyToUse = privateKey;
        if (!keyToUse.startsWith('0x')) {
          keyToUse = '0x' + keyToUse;
        }
        
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        const wallet = new ethers.Wallet(keyToUse, provider);
        derivedAddress = wallet.address;
        matchesResolver = derivedAddress.toLowerCase() === EXPECTED_RESOLVER.toLowerCase();
      } catch (err) {
        errorMessage = err instanceof Error ? err.message : 'Failed to derive address';
      }
    }

    // Try to get resolver from contract
    try {
      const provider = new ethers.JsonRpcProvider(RPC_URL);
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
      contractResolver = await contract.getResolverAccount();
    } catch (err) {
      console.error('Failed to fetch resolver from contract:', err);
    }

    return NextResponse.json({
      success: true,
      hasPrivateKey,
      privateKeyLength,
      has0xPrefix,
      maskedKey,
      isValidFormat: privateKey 
        ? (privateKey.length === 64 || privateKey.length === 66) && /^0x?[0-9a-fA-F]{64}$/.test(privateKey)
        : false,
      derivedAddress,
      expectedResolver: EXPECTED_RESOLVER,
      contractResolver,
      matchesResolver,
      errorMessage,
      message: hasPrivateKey 
        ? (matchesResolver 
          ? '✅ PRIVATE_KEY matches the resolver account!' 
          : `❌ PRIVATE_KEY does NOT match resolver. Derived: ${derivedAddress}, Expected: ${EXPECTED_RESOLVER}`)
        : 'PRIVATE_KEY is NOT set. Please create a .env.local file with PRIVATE_KEY=your_key',
      instructions: [
        '1. Create a .env.local file in the project root',
        '2. Add: PRIVATE_KEY=<private_key_of_resolver_account>',
        `3. The resolver account must be: ${EXPECTED_RESOLVER}`,
        '4. Restart your Next.js dev server (npm run dev)',
        '5. The 0x prefix will be added automatically if missing'
      ],
      troubleshooting: !matchesResolver && derivedAddress ? [
        `Your private key derives to address: ${derivedAddress}`,
        `But the contract expects resolver: ${EXPECTED_RESOLVER}`,
        'You need to use the private key that corresponds to the resolver account.',
        'If you deployed the contract, the resolver is the deployer address.',
        'Make sure you are using the correct private key for the resolver account.'
      ] : []
    });
  } catch (error: unknown) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to check environment variables'
    }, { status: 500 });
  }
}

