/**
 * Currency Utilities
 * 
 * Handles U2U currency formatting and conversions to USD/INR
 * Uses real-time exchange rates from CoinGecko and ExchangeRate-API
 */

// Cache for exchange rates to avoid excessive API calls
let exchangeRatesCache = {
  U2U_TO_USD: 3.05, // Default fallback rate
  USD_TO_INR: 88.81, // Default fallback rate
  lastUpdated: 0,
  cacheDuration: 60000, // 1 minute cache
};

/**
 * Fetch real-time exchange rates from APIs
 */
async function fetchExchangeRates(): Promise<{ U2U_TO_USD: number; USD_TO_INR: number }> {
  const now = Date.now();
  
  // Return cached rates if still valid
  if (now - exchangeRatesCache.lastUpdated < exchangeRatesCache.cacheDuration) {
    return {
      U2U_TO_USD: exchangeRatesCache.U2U_TO_USD,
      USD_TO_INR: exchangeRatesCache.USD_TO_INR,
    };
  }

  try {
    // Fetch U2U to USD rate from CoinGecko
    const u2uResponse = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=u2u-network&vs_currencies=usd');
    const u2uData = await u2uResponse.json();
    const u2uToUsd = u2uData['u2u-network']?.usd || exchangeRatesCache.U2U_TO_USD;

    // Fetch USD to INR rate from ExchangeRate-API
    const usdResponse = await fetch('https://open.er-api.com/v6/latest/USD');
    const usdData = await usdResponse.json();
    const usdToInr = usdData.rates?.INR || exchangeRatesCache.USD_TO_INR;

    // Update cache
    exchangeRatesCache = {
      U2U_TO_USD: u2uToUsd,
      USD_TO_INR: usdToInr,
      lastUpdated: now,
      cacheDuration: 60000, // 1 minute cache
    };

    console.log(`🔄 Updated exchange rates: 1 U2U = $${u2uToUsd}, 1 USD = ₹${usdToInr}`);
    
    return { U2U_TO_USD: u2uToUsd, USD_TO_INR: usdToInr };
  } catch (error) {
    console.warn('⚠️ Failed to fetch exchange rates, using cached values:', error);
    return {
      U2U_TO_USD: exchangeRatesCache.U2U_TO_USD,
      USD_TO_INR: exchangeRatesCache.USD_TO_INR,
    };
  }
}

export interface CurrencyDisplay {
  u2u: string;
  usd: string;
  inr: string;
}

/**
 * Format U2U amount with proper decimal places
 */
export function formatU2U(amount: string | number): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '0.00';
  return num.toFixed(2);
}

/**
 * Convert U2U to USD (synchronous - uses cached rates)
 */
export function u2uToUSD(u2uAmount: string | number): number {
  const u2u = typeof u2uAmount === 'string' ? parseFloat(u2uAmount) : u2uAmount;
  if (isNaN(u2u)) return 0;
  return u2u * exchangeRatesCache.U2U_TO_USD;
}

/**
 * Convert U2U to INR (synchronous - uses cached rates)
 */
export function u2uToINR(u2uAmount: string | number): number {
  const u2u = typeof u2uAmount === 'string' ? parseFloat(u2uAmount) : u2uAmount;
  if (isNaN(u2u)) return 0;
  return u2u * exchangeRatesCache.U2U_TO_USD * exchangeRatesCache.USD_TO_INR;
}

/**
 * Convert U2U to USD (async - fetches latest rates)
 */
export async function u2uToUSDLive(u2uAmount: string | number): Promise<number> {
  const u2u = typeof u2uAmount === 'string' ? parseFloat(u2uAmount) : u2uAmount;
  if (isNaN(u2u)) return 0;
  const rates = await fetchExchangeRates();
  return u2u * rates.U2U_TO_USD;
}

/**
 * Convert U2U to INR (async - fetches latest rates)
 */
export async function u2uToINRLive(u2uAmount: string | number): Promise<number> {
  const u2u = typeof u2uAmount === 'string' ? parseFloat(u2uAmount) : u2uAmount;
  if (isNaN(u2u)) return 0;
  const rates = await fetchExchangeRates();
  return u2u * rates.U2U_TO_USD * rates.USD_TO_INR;
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
 * Get all currency displays for a U2U amount
 */
export function getCurrencyDisplay(u2uAmount: string | number): CurrencyDisplay {
  const u2u = formatU2U(u2uAmount);
  const usd = formatUSD(u2uToUSD(u2uAmount));
  const inr = formatINR(u2uToINR(u2uAmount));
  
  return { u2u, usd, inr };
}

/**
 * Format U2U with conversion display
 */
export function formatU2UWithConversion(u2uAmount: string | number, showConversion: boolean = true): string {
  const u2u = formatU2U(u2uAmount);
  if (!showConversion) return `${u2u} U2U`;
  
  const usd = u2uToUSD(u2uAmount);
  const inr = u2uToINR(u2uAmount);
  
  return `${u2u} U2U (${formatUSD(usd)} / ${formatINR(inr)})`;
}

/**
 * Format currency for display in game UI
 */
export function formatGameCurrency(u2uAmount: string | number): string {
  const u2u = formatU2U(u2uAmount);
  const usd = u2uToUSD(u2uAmount);
  
  return `${u2u} U2U (${formatUSD(usd)})`;
}

/**
 * Format currency for display in stats
 */
export function formatStatsCurrency(u2uAmount: string | number): string {
  const u2u = formatU2U(u2uAmount);
  const usd = u2uToUSD(u2uAmount);
  const inr = u2uToINR(u2uAmount);
  
  return `${u2u} U2U`;
}

/**
 * Get conversion text for tooltips
 */
export function getConversionText(u2uAmount: string | number): string {
  const usd = u2uToUSD(u2uAmount);
  const inr = u2uToINR(u2uAmount);
  
  return `${formatUSD(usd)} / ${formatINR(inr)}`;
}

/**
 * Get conversion text for tooltips (async - fetches latest rates)
 */
export async function getConversionTextLive(u2uAmount: string | number): Promise<string> {
  const usd = await u2uToUSDLive(u2uAmount);
  const inr = await u2uToINRLive(u2uAmount);
  
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
export function getCurrentExchangeRates(): { U2U_TO_USD: number; USD_TO_INR: number; lastUpdated: number } {
  return {
    U2U_TO_USD: exchangeRatesCache.U2U_TO_USD,
    USD_TO_INR: exchangeRatesCache.USD_TO_INR,
    lastUpdated: exchangeRatesCache.lastUpdated,
  };
}