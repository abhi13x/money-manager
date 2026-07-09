import { db } from '@/db/schema';
import type { Transaction } from '@/types/finance';

/**
 * Service layer for financial operations.
 * Handles atomic updates to balances and complex aggregations.
 */

export const addTransaction = async (transactionData: Omit<Transaction, 'id'>) => {
  return await db.transaction('rw', [db.transactions, db.accounts], async () => {
    const id = crypto.randomUUID();
    const transaction = { ...transactionData, id };
    
    await db.transactions.add(transaction);

    // Update account balances atomically
    if (transactionData.type === 'income') {
      const acc = await db.accounts.get(transactionData.accountId);
      if (acc) {
        await db.accounts.update(acc.id, { 
          currentBalance: (acc.currentBalance || acc.initialBalance) + transactionData.amount 
        });
      }
    } else if (transactionData.type === 'expense') {
      const acc = await db.accounts.get(transactionData.accountId);
      if (acc) {
        await db.accounts.update(acc.id, { 
          currentBalance: (acc.currentBalance || acc.initialBalance) - transactionData.amount 
        });
      }
    } else if (transactionData.type === 'transfer' && transactionData.targetAccountId) {
      // Source Account (Decrease)
      const sourceAcc = await db.accounts.get(transactionData.accountId);
      if (sourceAcc) {
        await db.accounts.update(sourceAcc.id, { 
          currentBalance: (sourceAcc.currentBalance || sourceAcc.initialBalance) - transactionData.amount 
        });
      }
      // Target Account (Increase)
      const targetAcc = await db.accounts.get(transactionData.targetAccountId);
      if (targetAcc) {
        await db.accounts.update(targetAcc.id, { 
          currentBalance: (targetAcc.currentBalance || targetAcc.initialBalance) + transactionData.amount 
        });
      }
    }
    
    return transaction;
  });
};

export const deleteTransaction = async (id: string) => {
  return await db.transaction('rw', [db.transactions, db.accounts], async () => {
    const transaction = await db.transactions.get(id);
    if (!transaction) throw new Error('Transaction not found');

    // Revert balance changes before deleting
    if (transaction.type === 'income') {
      const acc = await db.accounts.get(transaction.accountId);
      if (acc) await db.accounts.update(acc.id, { currentBalance: acc.currentBalance - transaction.amount });
    } else if (transaction.type === 'expense') {
      const acc = await db.accounts.get(transaction.accountId);
      if (acc) await db.accounts.update(acc.id, { currentBalance: acc.currentBalance + transaction.amount });
    } else if (transaction.type === 'transfer' && transaction.targetAccountId) {
      const sourceAcc = await db.accounts.get(transaction.accountId);
      if (sourceAcc) await db.accounts.update(sourceAcc.id, { currentBalance: sourceAcc.currentBalance + transaction.amount });
      
      const targetAcc = await db.accounts.get(transaction.targetAccountId);
      if (targetAcc) await db.accounts.update(targetAcc.id, { currentBalance: targetAcc.currentBalance - transaction.amount });
    }

    await db.transactions.delete(id);
  });
};

export const getAccountBalances = async () => {
  const accounts = await db.accounts.toArray();

  const balances = accounts.map(account => ({
    account,
    balance: account.currentBalance ?? account.initialBalance
  }));

  const assets = balances
    .filter(b => ['checking', 'savings', 'cash', 'investment', 'retirement'].includes(b.account.type))
    .reduce((sum, b) => sum + b.balance, 0);

  const liabilities = balances
    .filter(b => b.account.type === 'credit')
    .reduce((sum, b) => sum + b.balance, 0);

  const retirementAssets = balances
    .filter(b => b.account.type === 'retirement')
    .reduce((sum, b) => sum + b.balance, 0);

  return {
    assets,
    liabilities: Math.abs(liabilities),
    retirementAssets,
    netWorth: assets + liabilities, 
  };
};

export const getMonthlyCategoryBreakdown = async (year: number, month: number) => {
  const startOfMonth = new Date(year, month, 1).getTime();
  const endOfMonth = new Date(year, month + 1, 0).getTime();

  const transactions = await db.transactions
    .where('date')
    .between(startOfMonth, endOfMonth, true, true)
    .filter(t => t.type === 'expense')
    .toArray();

  const breakdown: Record<string, number> = {};

  transactions.forEach(t => {
    breakdown[t.category] = (breakdown[t.category] || 0) + t.amount;
  });

  return Object.entries(breakdown).map(([category, total]) => ({
    category,
    total,
  }));
};
