// types/finance.ts

/**
 * Finance Domain Types
 * 
 * Note: All monetary values are stored as integers (cents/paise) to avoid 
 * floating-point precision errors.
 */

export type AccountType = 'checking' | 'savings' | 'credit' | 'cash' | 'investment' | 'retirement' | 'wallet';
export type TransactionType = 'income' | 'expense' | 'transfer';
export type CategoryType = 'income' | 'expense';
export type BudgetPeriod = 'monthly' | 'yearly';

export interface Account {
  id: string; // UUID
  name: string;
  type: AccountType;
  currency: string; // e.g., 'INR', 'USD', 'EUR'
  initialBalance: number; // In cents/paise
  currentBalance: number; // Tracked balance for performance
  createdAt: number; // Timestamp
}

export interface Transaction {
  id: string; // UUID
  accountId: string; // UUID
  amount: number; // In cents/paise
  type: TransactionType;
  category: string;
  note: string;
  date: number; // Timestamp
  toAccountId?: string; // FIX: Changed from targetAccountId to toAccountId
}

export interface Category {
  id: string;
  name: string;
  type: CategoryType;
  icon: string; // Lucide icon name
  color: string; // Hex or Tailwind color class
  parentId?: string | null; // Optional ID of the parent category
}

export interface Budget {
  id: string;
  categoryId: string;
  amountLimit: number; // In cents/paise
  period: BudgetPeriod;
}

/**
 * Utility helpers for currency precision and localization
 */

/**
 * Converts floating point input (e.g., 12.50) to integer cents (1250)
 */
export const toCents = (amount: number): number => {
  return Math.round(amount * 100);
};

/**
 * Converts integer cents (1250) back to floating point (12.50)
 */
export const fromCents = (cents: number): number => {
  return cents / 100;
};

/**
 * Smart-maps ISO currency codes to standard native locales
 */
const getFallbackLocale = (currency: string): string => {
  const code = currency.toUpperCase();
  const localeMap: Record<string, string> = {
    INR: 'en-IN',
    USD: 'en-US',
    EUR: 'de-DE',
    GBP: 'en-GB',
    JPY: 'ja-JP',
    CAD: 'en-CA',
    AUD: 'en-AU',
  };
  return localeMap[code] || 'en-US';
};

/**
 * Formats a cents/paise value dynamically based on currency code
 */
export const formatCurrency = (cents: number, currency = 'INR', locale?: string): string => {
  const targetLocale = locale || getFallbackLocale(currency);
  
  return new Intl.NumberFormat(targetLocale, {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(fromCents(cents));
};