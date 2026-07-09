import Dexie from 'dexie';
import type { Table } from 'dexie';
import type { Account, Transaction, Category, Budget } from '@/types/finance';

export class MoneyManagerDB extends Dexie {
  accounts!: Table<Account, string>;
  transactions!: Table<Transaction, string>;
  categories!: Table<Category, string>;
  budgets!: Table<Budget, string>;

  constructor() {
    super('MoneyManagerDB');
    
    this.version(1).stores({
      accounts: 'id, name, type',
      transactions: 'id, accountId, type, category, date',
      categories: 'id, name, type, parentId',
      budgets: 'id, categoryId, period',
    });
  }

  async seedDefaultCategories() {
    const count = await this.categories.count();
    if (count === 0) {
      const defaultCategories: Category[] = [
        { id: crypto.randomUUID(), name: 'Salary', type: 'income', icon: 'Wallet', color: '#22c55e', parentId: null },
        { id: crypto.randomUUID(), name: 'Investments', type: 'income', icon: 'TrendingUp', color: '#3b82f6', parentId: null },
        { id: crypto.randomUUID(), name: 'Food', type: 'expense', icon: 'Utensils', color: '#ef4444', parentId: null },
        { id: crypto.randomUUID(), name: 'Rent', type: 'expense', icon: 'Home', color: '#3b82f6', parentId: null },
        { id: crypto.randomUUID(), name: 'Utilities', type: 'expense', icon: 'Zap', color: '#eab308', parentId: null },
        { id: crypto.randomUUID(), name: 'Transport', type: 'expense', icon: 'Car', color: '#a855f7', parentId: null },
        { id: crypto.randomUUID(), name: 'Entertainment', type: 'expense', icon: 'Film', color: '#ec4899', parentId: null },
        { id: crypto.randomUUID(), name: 'SIP', type: 'expense', icon: 'TrendingUp', color: '#10b981', parentId: null },
        { id: crypto.randomUUID(), name: 'Insurance', type: 'expense', icon: 'Shield', color: '#6366f1', parentId: null },
      ];

      await this.categories.bulkAdd(defaultCategories);
      console.log('✅ Default categories seeded');
    }
  }
}

export const db = new MoneyManagerDB();
