/**
 * Reference FX to PHP for Donors & Contributions reporting.
 * Keep numeric rates in sync with backend/CurrencyToPhp.cs.
 */
const PHP_PER_UNIT: Record<string, number> = {
  PHP: 1,
  USD: 58,
  EUR: 62,
  GBP: 75,
  JPY: 0.39,
  CAD: 42,
  AUD: 38,
  CHF: 65,
  CNY: 8,
  HKD: 7.4,
  SGD: 43,
  INR: 0.69,
  KRW: 0.042,
  MXN: 3.2,
  BRL: 10.5,
  ZAR: 3.1,
};

export function toPhpAmount(amount: number, currencyCode: string | null | undefined): number {
  if (!Number.isFinite(amount)) return 0;
  const code = (currencyCode?.trim().toUpperCase() || 'PHP') as keyof typeof PHP_PER_UNIT;
  const mult = PHP_PER_UNIT[code] ?? 1;
  return amount * mult;
}

const phpFormatter = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  maximumFractionDigits: 0,
});

export function formatPhp(amount: number): string {
  return phpFormatter.format(Math.round(amount));
}

/** True when we show values as native PHP (no foreign formatting in history). */
export function isPhpCurrency(currencyCode: string | null | undefined): boolean {
  const c = currencyCode?.trim().toUpperCase();
  return !c || c === 'PHP';
}

/**
 * Format a stored amount in its original currency (for donation history when not PHP).
 */
export function formatInOriginalCurrency(
  amount: number,
  currencyCode: string | null | undefined,
): string {
  const code = (currencyCode?.trim().toUpperCase() || 'PHP') as string;
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: code.length === 3 ? code : 'PHP',
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount.toLocaleString('en-US', { maximumFractionDigits: 2 })} ${code}`;
  }
}
