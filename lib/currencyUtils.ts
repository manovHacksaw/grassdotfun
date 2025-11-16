/**
 * Currency Utilities
 * 
 * Handles CELO currency formatting and conversions to USD/INR
 * Uses real-time exchange rates from CoinGecko and ExchangeRate-API
 */

// Cache for exchange rates to avoid excessive API calls
let exchangeRatesCache = {
  CELO_TO_USD: 0.75, // Default fallback rate
  USD_TO_INR: 88.81, // Default fallback rate
  lastUpdated: 0,
  cacheDuration: 60000, // 1 minute cache
};

/**
 * Fetch real-time exchange rates from APIs
 */
async function fetchExchangeRates(): Promise<{ CELO_TO_USD: number; USD_TO_INR: number }> {
  const now = Date.now();
  
  // Return cached rates if still valid
  if (now - exchangeRatesCache.lastUpdated < exchangeRatesCache.cacheDuration) {
    return {
      CELO_TO_USD: exchangeRatesCache.CELO_TO_USD,
      USD_TO_INR: exchangeRatesCache.USD_TO_INR,
    };
  }

  try {
    // Fetch CELO to USD rate from CoinGecko
    const celoResponse = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=celo&vs_currencies=usd');
    const celoData = await celoResponse.json();
    const celoToUsd = celoData['celo']?.usd || exchangeRatesCache.CELO_TO_USD;

    // Fetch USD to INR rate from ExchangeRate-API
    const usdResponse = await fetch('https://open.er-api.com/v6/latest/USD');
    const usdData = await usdResponse.json();
    const usdToInr = usdData.rates?.INR || exchangeRatesCache.USD_TO_INR;

    // Update cache
    exchangeRatesCache = {
      CELO_TO_USD: celoToUsd,
      USD_TO_INR: usdToInr,
      lastUpdated: now,
      cacheDuration: 60000, // 1 minute cache
    };

    console.log(`🔄 Updated exchange rates: 1 CELO = $${celoToUsd}, 1 USD = ₹${usdToInr}`);
    
    return { CELO_TO_USD: celoToUsd, USD_TO_INR: usdToInr };
  } catch (error) {
    console.warn('⚠️ Failed to fetch exchange rates, using cached values:', error);
    return {
      CELO_TO_USD: exchangeRatesCache.CELO_TO_USD,
      USD_TO_INR: exchangeRatesCache.USD_TO_INR,
    };
  }
}

export interface CurrencyDisplay {
  celo: string;
  usd: string;
  inr: string;
}

/**
 * Format CELO amount with proper decimal places
 */
export function formatCELO(amount: string | number): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '0.00';
  return num.toFixed(2);
}

/**
 * Convert CELO to USD (synchronous - uses cached rates)
 */
export function celoToUSD(celoAmount: string | number): number {
  const celo = typeof celoAmount === 'string' ? parseFloat(celoAmount) : celoAmount;
  if (isNaN(celo)) return 0;
  return celo * exchangeRatesCache.CELO_TO_USD;
}

/**
 * Convert CELO to INR (synchronous - uses cached rates)
 */
export function celoToINR(celoAmount: string | number): number {
  const celo = typeof celoAmount === 'string' ? parseFloat(celoAmount) : celoAmount;
  if (isNaN(celo)) return 0;
  return celo * exchangeRatesCache.CELO_TO_USD * exchangeRatesCache.USD_TO_INR;
}

/**
 * Convert CELO to USD (async - fetches latest rates)
 */
export async function celoToUSDLive(celoAmount: string | number): Promise<number> {
  const celo = typeof celoAmount === 'string' ? parseFloat(celoAmount) : celoAmount;
  if (isNaN(celo)) return 0;
  const rates = await fetchExchangeRates();
  return celo * rates.CELO_TO_USD;
}

/**
 * Convert CELO to INR (async - fetches latest rates)
 */
export async function celoToINRLive(celoAmount: string | number): Promise<number> {
  const celo = typeof celoAmount === 'string' ? parseFloat(celoAmount) : celoAmount;
  if (isNaN(celo)) return 0;
  const rates = await fetchExchangeRates();
  return celo * rates.CELO_TO_USD * rates.USD_TO_INR;
}

/**
 * Format USD amount
 */
export function formatUSD(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

/**
 * Format INR amount
 */
export function formatINR(amount: number): string {
  return `₹${amount.toFixed(2)}`;
}

/**
 * Get all currency displays for a CELO amount
 */
export function getCurrencyDisplay(celoAmount: string | number): CurrencyDisplay {
  const celo = formatCELO(celoAmount);
  const usd = formatUSD(celoToUSD(celoAmount));
  const inr = formatINR(celoToINR(celoAmount));
  
  return { celo, usd, inr };
}

/**
 * Format CELO with conversion display
 */
export function formatCELOWithConversion(celoAmount: string | number, showConversion: boolean = true): string {
  const celo = formatCELO(celoAmount);
  if (!showConversion) return `${celo} CELO`;
  
  const usd = celoToUSD(celoAmount);
  const inr = celoToINR(celoAmount);
  
  return `${celo} CELO (${formatUSD(usd)} / ${formatINR(inr)})`;
}

/**
 * Format currency for display in game UI
 */
export function formatGameCurrency(celoAmount: string | number): string {
  const celo = formatCELO(celoAmount);
  const usd = celoToUSD(celoAmount);
  
  return `${celo} CELO (${formatUSD(usd)})`;
}

/**
 * Format currency for display in stats
 */
export function formatStatsCurrency(celoAmount: string | number): string {
  const celo = formatCELO(celoAmount);
  const usd = celoToUSD(celoAmount);
  const inr = celoToINR(celoAmount);
  
  return `${celo} CELO`;
}

/**
 * Get conversion text for tooltips
 */
export function getConversionText(celoAmount: string | number): string {
  const usd = celoToUSD(celoAmount);
  const inr = celoToINR(celoAmount);
  
  return `${formatUSD(usd)} / ${formatINR(inr)}`;
}

/**
 * Get conversion text for tooltips (async - fetches latest rates)
 */
export async function getConversionTextLive(celoAmount: string | number): Promise<string> {
  const usd = await celoToUSDLive(celoAmount);
  const inr = await celoToINRLive(celoAmount);
  
  return `${formatUSD(usd)} / ${formatINR(inr)}`;
}

/**
 * Initialize exchange rates (call this on app startup)
 */
export async function initializeExchangeRates(): Promise<void> {
  try {
    await fetchExchangeRates();
    console.log('✅ Exchange rates initialized successfully');
  } catch (error) {
    console.warn('⚠️ Failed to initialize exchange rates:', error);
  }
}

/**
 * Get current exchange rates (for debugging/monitoring)
 */
export function getCurrentExchangeRates(): { CELO_TO_USD: number; USD_TO_INR: number; lastUpdated: number } {
  return {
    CELO_TO_USD: exchangeRatesCache.CELO_TO_USD,
    USD_TO_INR: exchangeRatesCache.USD_TO_INR,
    lastUpdated: exchangeRatesCache.lastUpdated,
  };
}

// Legacy function names for backward compatibility (deprecated - use formatCELO instead)
export const formatU2U = formatCELO;
export const u2uToUSD = celoToUSD;
export const u2uToINR = celoToINR;
export const u2uToUSDLive = celoToUSDLive;
export const u2uToINRLive = celoToINRLive;
export const formatU2UWithConversion = formatCELOWithConversion;