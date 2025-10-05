import { NextRequest, NextResponse } from 'next/server';
import { balanceCache } from '@/lib/balanceCache';
import { MockBalanceService } from '@/lib/mockBalanceService';

export async function POST(request: NextRequest) {
  try {
    const { accountId } = await request.json();
    
    if (!accountId) {
      return NextResponse.json(
        { error: 'Account ID is required' },
        { status: 400 }
      );
    }
    
    // Check cache first
    const cachedBalance = balanceCache.getCachedBalance(accountId);
    if (cachedBalance) {
      return NextResponse.json({ 
        balance: cachedBalance, 
        cached: true,
        endpoint: 'cache'
      });
    }
    
    console.log(`🔍 API Balance Route: Returning mock balance for ${accountId}`);
    
    // Return mock balance for U2U
    const mockBalance = MockBalanceService.getMockBalance(accountId);
    
    // Cache the result
    balanceCache.setCachedBalance(accountId, mockBalance);
    
    return NextResponse.json({
      balance: mockBalance,
      endpoint: 'mock',
      cached: false,
      source: 'mock',
      note: 'Using mock balance for U2U development'
    });
    
  } catch (error: unknown) {
    console.error('Failed to fetch balance:', error);
    return NextResponse.json(
      { error: 'Failed to fetch balance', details: error instanceof Error ? error.message : 'Unknown error' },
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