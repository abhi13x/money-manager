import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/schema';
import type { Transaction, Account } from '@/types/finance';
import { Plus, Wallet, ArrowUpRight, ArrowDownLeft, Settings } from 'lucide-react';
import { fromCents } from '@/types/finance';
import CategoryManager from './CategoryManager';

const Dashboard: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCatManagerOpen, setIsCatManagerOpen] = useState(false);

  // Live queries for dynamic updates
  const transactions = useLiveQuery(() => db.transactions.orderBy('date').reverse().limit(10).toArray());
  const accounts = useLiveQuery(() => db.accounts.toArray());
  
  // Calculate summaries for the current month
  const summaries = useLiveQuery(async () => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    
    const monthlyTx = await db.transactions
      .where('date')
      .above(startOfMonth)
      .toArray();

    const income = monthlyTx
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const expense = monthlyTx
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    // Calculate Net Worth (Simple sum of all account initial balances + all transactions)
    const allAccounts = await db.accounts.toArray();
    const allTx = await db.transactions.toArray();
    const initialTotal = allAccounts.reduce((sum, a) => sum + a.initialBalance, 0);
    const txTotal = allTx.reduce((sum, t) => {
      if (t.type === 'income') return sum + t.amount;
      if (t.type === 'expense') return sum - t.amount;
      return sum;
    }, 0);

    return {
      netWorth: initialTotal + txTotal,
      monthlyIncome: income,
      monthlyExpense: expense,
    };
  });

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(fromCents(cents));
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 p-4 pb-24 transition-colors duration-300">
      <header className="max-w-4xl mx-auto mb-8 pt-4 flex justify-between items-center">
        <div className="flex flex-col">
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">My Finances</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Local-first privacy tracking</p>
        </div>
        <button 
          onClick={() => setIsCatManagerOpen(true)}
          className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all active:scale-90"
          aria-label="Settings"
        >
          <Settings className="w-5 h-5" />
        </button>
      </header>

      <main className="max-w-4xl mx-auto space-y-8">
        {/* Summary Cards - Optimized for Mobile (1 col) and Desktop (3 col) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <SummaryCard 
            title="Net Worth" 
            amount={summaries?.netWorth || 0} 
            icon={<Wallet className="w-5 h-5" />} 
            color="bg-indigo-600" 
            format={formatCurrency} 
          />
          <SummaryCard 
            title="Monthly Income" 
            amount={summaries?.monthlyIncome || 0} 
            icon={<ArrowUpRight className="w-5 h-5" />} 
            color="bg-emerald-600" 
            format={formatCurrency} 
          />
          <SummaryCard 
            title="Monthly Expense" 
            amount={summaries?.monthlyExpense || 0} 
            icon={<ArrowDownLeft className="w-5 h-5" />} 
            color="bg-rose-600" 
            format={formatCurrency} 
          />
        </div>

        {/* Recent Transactions */}
        <section className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <h2 className="text-lg font-bold flex items-center gap-2">
              Recent Transactions
              <span className="text-xs font-normal bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-full text-slate-500">
                Last 10
              </span>
            </h2>
            <button className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline decoration-2 underline-offset-4">
              View All
            </button>
          </div>
          
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
            {transactions && transactions.length > 0 ? (
              <div className="divide-y divide-slate-100 dark:divide-slate-700">
                {transactions.map(tx => (
                  <TransactionItem 
                    key={tx.id} 
                    tx={tx} 
                    accounts={accounts || []} 
                    format={formatCurrency} 
                  />
                ))}
              </div>
            ) : (
              <div className="p-12 text-center space-y-3">
                <div className="mx-auto w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center text-slate-400">
                  <Wallet className="w-6 h-6" />
                </div>
                <p className="text-slate-500 dark:text-slate-400 font-medium">
                  No transactions yet.
                </p>
                <p className="text-xs text-slate-400">
                  Tap the + button to add your first entry!
                </p>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* FAB - Enhanced for Mobile Thumb reach */}
      <button 
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-6 right-6 w-16 h-16 bg-blue-600 text-white rounded-full shadow-xl shadow-blue-500/30 flex items-center justify-center hover:bg-blue-700 transition-all active:scale-90 z-40"
      >
        <Plus className="w-7 h-7" />
      </button>
// ...existing code...

      <CategoryManager 
        isOpen={isCatManagerOpen} 
        onClose={() => setIsCatManagerOpen(false)} 
      />

      {/* Simple Placeholder Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-2xl p-6 shadow-xl">
            <h3 className="text-xl font-bold mb-4">Add Transaction</h3>
            <div className="space-y-4">
              <p className="text-slate-500">Transaction form will be implemented here.</p>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="w-full py-2 bg-slate-200 dark:bg-slate-700 rounded-lg font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const SummaryCard = ({ title, amount, icon, color, format }: any) => (
  <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm flex items-center gap-4">
    <div className={`${color} p-3 rounded-xl text-white`}>
      {icon}
    </div>
    <div>
      <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-medium">{title}</p>
      <p className="text-xl font-bold">{format(amount)}</p>
    </div>
  </div>
);

const TransactionItem = ({ tx, accounts, format }: { tx: Transaction, accounts: Account[], format: (v: number) => string }) => {
  const account = accounts.find(a => a.id === tx.accountId);
  const isIncome = tx.type === 'income';

  return (
    <div className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300">
          {/* Placeholder for dynamic icon based on category */}
          <Wallet className="w-5 h-5" />
        </div>
        <div>
          <p className="font-medium">{tx.category}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {account?.name || 'Unknown Account'} • {new Date(tx.date).toLocaleDateString()}
          </p>
        </div>
      </div>
      <div className={`font-semibold ${isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
        {isIncome ? '+' : '-'}{format(tx.amount)}
      </div>
    </div>
  );
};

export default Dashboard;
