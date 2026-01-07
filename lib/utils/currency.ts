/**
 * Currency conversion utilities
 * USD to INR conversion (1 USD = 84 INR)
 */

const USD_TO_INR_RATE = 84;

export function usdToInr(usd: number): number {
  return usd * USD_TO_INR_RATE;
}

export function inrToUsd(inr: number): number {
  return inr / USD_TO_INR_RATE;
}

export function formatUSD(amount: number): string {
  return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatINR(amount: number): string {
  return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export async function getLiveExchangeRate(): Promise<number> {
  try {
    // Try to fetch live rate from API (fallback to fixed rate)
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
    const data = await response.json();
    return data.rates.INR || USD_TO_INR_RATE;
  } catch (error) {
    console.error('Error fetching exchange rate:', error);
    return USD_TO_INR_RATE;
  }
}
