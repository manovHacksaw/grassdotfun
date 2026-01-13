/**
 * Currency Utilities
 *
 * Handles MNT currency formatting and conversions to USD/INR
 * Uses real-time exchange rates from CoinGecko and ExchangeRate-API
 */

// Cache for exchange rates to avoid excessive API calls
let exchangeRatesCache = {
  MNT_TO_USD: 0.75, // Default fallback rate
  USD_TO_INR: 88.81, // Default fallback rate
  lastUpdated: 0,
  cacheDuration: 60000, // 1 minute cache
};

/**
 * Fetch real-time exchange rates from APIs
 */
async function fetchExchangeRates(): Promise<{ MNT_TO_USD: number; USD_TO_INR: number }> {
  const now = Date.now();

  // Return cached rates if still valid
  if (now - exchangeRatesCache.lastUpdated < exchangeRatesCache.cacheDuration) {
    return {
      MNT_TO_USD: exchangeRatesCache.MNT_TO_USD,
      USD_TO_INR: exchangeRatesCache.USD_TO_INR,
    };
  }

  try {
    // Fetch MNT to USD rate from CoinGecko
    const mntResponse = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=mantle&vs_currencies=usd');
    const mntData = await mntResponse.json();
    const mntToUsd = mntData['mantle']?.usd || exchangeRatesCache.MNT_TO_USD;

    // Fetch USD to INR rate from ExchangeRate-API
    const usdResponse = await fetch('https://open.er-api.com/v6/latest/USD');
    const usdData = await usdResponse.json();
    const usdToInr = usdData.rates?.INR || exchangeRatesCache.USD_TO_INR;

    // Update cache
    exchangeRatesCache = {
      MNT_TO_USD: mntToUsd,
      USD_TO_INR: usdToInr,
      lastUpdated: now,
      cacheDuration: 60000, // 1 minute cache
    };

    console.log(`🔄 Updated exchange rates: 1 MNT = $${mntToUsd}, 1 USD = ₹${usdToInr}`);

    return { MNT_TO_USD: mntToUsd, USD_TO_INR: usdToInr };
  } catch (error) {
    console.warn('⚠️ Failed to fetch exchange rates, using cached values:', error);
    return {
      MNT_TO_USD: exchangeRatesCache.MNT_TO_USD,
      USD_TO_INR: exchangeRatesCache.USD_TO_INR,
    };
  }
}

export interface CurrencyDisplay {
  mnt: string;
  usd: string;
  inr: string;
}

/**
 * Format MNT amount with proper decimal places
 */
export function formatMNT(amount: string | number): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '0.00';
  return num.toFixed(2);
}

/**
 * Convert MNT to USD (synchronous - uses cached rates)
 */
export function mntToUSD(mntAmount: string | number): number {
  const mnt = typeof mntAmount === 'string' ? parseFloat(mntAmount) : mntAmount;
  if (isNaN(mnt)) return 0;
  return mnt * exchangeRatesCache.MNT_TO_USD;
}

/**
 * Convert MNT to INR (synchronous - uses cached rates)
 */
export function mntToINR(mntAmount: string | number): number {
  const mnt = typeof mntAmount === 'string' ? parseFloat(mntAmount) : mntAmount;
  if (isNaN(mnt)) return 0;
  return mnt * exchangeRatesCache.MNT_TO_USD * exchangeRatesCache.USD_TO_INR;
}

/**
 * Convert MNT to USD (async - fetches latest rates)
 */
export async function mntToUSDLive(mntAmount: string | number): Promise<number> {
  const mnt = typeof mntAmount === 'string' ? parseFloat(mntAmount) : mntAmount;
  if (isNaN(mnt)) return 0;
  const rates = await fetchExchangeRates();
  return mnt * rates.MNT_TO_USD;
}

/**
 * Convert MNT to INR (async - fetches latest rates)
 */
export async function mntToINRLive(mntAmount: string | number): Promise<number> {
  const mnt = typeof mntAmount === 'string' ? parseFloat(mntAmount) : mntAmount;
  if (isNaN(mnt)) return 0;
  const rates = await fetchExchangeRates();
  return mnt * rates.MNT_TO_USD * rates.USD_TO_INR;
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
 * Get all currency displays for a MNT amount
 */
export function getCurrencyDisplay(mntAmount: string | number): CurrencyDisplay {
  const mnt = formatMNT(mntAmount);
  const usd = formatUSD(mntToUSD(mntAmount));
  const inr = formatINR(mntToINR(mntAmount));

  return { mnt, usd, inr };
}

/**
 * Format MNT with conversion display
 */
export function formatMNTWithConversion(mntAmount: string | number, showConversion: boolean = true): string {
  const mnt = formatMNT(mntAmount);
  if (!showConversion) return `${mnt} MNT`;

  const usd = mntToUSD(mntAmount);
  const inr = mntToINR(mntAmount);

  return `${mnt} MNT (${formatUSD(usd)} / ${formatINR(inr)})`;
}

/**
 * Format currency for display in game UI
 */
export function formatGameCurrency(mntAmount: string | number): string {
  const mnt = formatMNT(mntAmount);
  const usd = mntToUSD(mntAmount);

  return `${mnt} MNT (${formatUSD(usd)})`;
}

/**
 * Format currency for display in stats
 */
export function formatStatsCurrency(mntAmount: string | number): string {
  const mnt = formatMNT(mntAmount);
  const usd = mntToUSD(mntAmount);
  const inr = mntToINR(mntAmount);

  return `${mnt} MNT`;
}

/**
 * Get conversion text for tooltips
 */
export function getConversionText(mntAmount: string | number): string {
  const usd = mntToUSD(mntAmount);
  const inr = mntToINR(mntAmount);

  return `${formatUSD(usd)} / ${formatINR(inr)}`;
}

/**
 * Get conversion text for tooltips (async - fetches latest rates)
 */
export async function getConversionTextLive(mntAmount: string | number): Promise<string> {
  const usd = await mntToUSDLive(mntAmount);
  const inr = await mntToINRLive(mntAmount);

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
export function getCurrentExchangeRates(): { MNT_TO_USD: number; USD_TO_INR: number; lastUpdated: number } {
  return {
    MNT_TO_USD: exchangeRatesCache.MNT_TO_USD,
    USD_TO_INR: exchangeRatesCache.USD_TO_INR,
    lastUpdated: exchangeRatesCache.lastUpdated,
  };
}
