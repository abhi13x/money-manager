import Dexie, { type Table } from 'dexie';

// Define Account Types
export type AccountType = 
  | 'cash' 
  | 'savings' 
  | 'wallet' 
  | 'credit_card' 
  | 'debit_card' 
  | 'mutual_fund' 
  | 'stock' 
  | 'fd_rd' 
  | 'scheme'; // NPS, EPFO, PPF

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  initialBalance: number; // stored in cents
  currentBalance: number; // stored in cents
  currency: string;
  // Specific Investment/Scheme fields
  repeatInvestmentDate?: number; // Day of the month (1-31)
  interestRate?: number; // e.g. 7.1 for PPF
  // Credit Card fields
  statementDate?: number; // Day of the month (1-31)
  dueDate?: number; // Day of the month (1-31)
}

export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  parentId?: string; // If set, this is a sub-category
}

export interface Transaction {
  id: string;
  amount: number; // stored in cents
  type: 'income' | 'expense' | 'transfer';
  accountId: string;
  toAccountId?: string; // only for transfers
  categoryId?: string; // references category (or sub-category)
  date: number; // timestamp
  note?: string;
  description?: string;
  // Recurring Profile fields
  isRecurring?: boolean;
  repeatInterval?: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
}

class KanjoosDatabase extends Dexie {
  accounts!: Table<Account>;
  categories!: Table<Category>;
  transactions!: Table<Transaction>;

  constructor() {
    super('KanjoosDatabase');
    this.version(1).stores({
      accounts: 'id, name, type',
      categories: 'id, name, type, parentId',
      transactions: 'id, amount, type, accountId, toAccountId, categoryId, date, isRecurring'
    });
  }
}

export const db = new KanjoosDatabase();