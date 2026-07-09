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
  currency: string;
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
  targetAccountId?: string; // Optional UUID for transfers
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
 * Utility helpers for currency precision
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
 * Formats a cents value to a localized currency string
 */
export const formatCurrency = (cents: number, locale = 'en-US', currency = 'USD'): string => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
  }).format(fromCents(cents));
};
