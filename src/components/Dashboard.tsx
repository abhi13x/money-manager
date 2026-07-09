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
    <div className="min-h-screen bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors duration-300 flex flex-col">
      {/* TOP NAVIGATION BAR */}
      <header className="flex justify-between items-center p-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-10">
        <button className="p-2 -ml-2 text-slate-600 dark:text-slate-400">
          <ArrowDownLeft className="w-6 h-6 rotate-90" />
        </button>
        <h1 className="text-lg font-semibold">Transaction</h1>
        <div className="flex gap-2">
          <button className="p-2 text-slate-600 dark:text-slate-400">
            <Wallet className="w-6 h-6" />
          </button>
          <button 
            onClick={() => setIsCatManagerOpen(true)}
            className="p-2 text-slate-600 dark:text-slate-400"
          >
            <Settings className="w-6 h-6" />
          </button>
        </div>
      </header>

      {/* DATE SELECTOR */}
      <div className="flex justify-between items-center p-4 text-slate-600 dark:text-slate-400 font-medium">
        <button className="p-1">&lt;</button>
        <span className="text-sm">Jul 2020</span>
        <button className="p-1">&gt;</button>
      </div>

      {/* TAB MENU */}
      <div className="flex justify-around border-b border-slate-100 dark:border-slate-800 text-sm font-medium text-slate-500 dark:text-slate-400">
        {['Daily', 'Calendar', 'Weekly', 'Monthly', 'Summary'].map((tab) => (
          <button 
            key={tab} 
            className={`py-3 px-2 border-b-2 transition-colors ${tab === 'Daily' ? 'border-orange-500 text-orange-500' : 'border-transparent hover:text-slate-800 dark:hover:text-slate-200'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      <main className="flex-1 overflow-y-auto pb-24">
        {/* SUMMARY ROW */}
        <div className="grid grid-cols-3 gap-2 p-4 text-center border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Income</p>
            <p className="text-sm font-bold text-blue-600 dark:text-blue-400">{formatCurrency(summaries?.monthlyIncome || 0)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Expenses</p>
            <p className="text-sm font-bold text-red-500 dark:text-red-400">{formatCurrency(summaries?.monthlyExpense || 0)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Total</p>
            <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{formatCurrency((summaries?.monthlyIncome || 0) - (summaries?.monthlyExpense || 0))}</p>
          </div>
        </div>

        {/* TRANSACTIONS LIST */}
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {transactions && transactions.length > 0 ? (
            transactions.map(tx => (
              <TransactionItem 
                key={tx.id} 
                tx={tx} 
                accounts={accounts || []} 
                format={formatCurrency} 
              />
            ))
          ) : (
            <div className="p-12 text-center text-slate-400">No transactions found.</div>
          )}
        </div>
      </main>

      {/* BOTTOM NAVIGATION BAR */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 px-6 py-3 flex justify-between items-center z-10">
        <div className="flex flex-col items-center text-orange-500">
          <Wallet className="w-6 h-6" />
          <span className="text-[10px] mt-1">09/03</span>
        </div>
        <div className="flex flex-col items-center text-slate-400">
          <ArrowUpRight className="w-6 h-6" />
          <span className="text-[10px] mt-1">Stats</span>
        </div>
        <div className="flex flex-col items-center text-slate-400">
          <Wallet className="w-6 h-6" />
          <span className="text-[10px] mt-1">Accounts</span>
        </div>
        <div className="flex flex-col items-center text-slate-400">
          <Settings className="w-6 h-6" />
          <span className="text-[10px] mt-1">Settings</span>
        </div>
      </nav>

      {/* FAB */}
      <button 
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-20 right-6 w-14 h-14 bg-red-500 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-red-600 transition-all active:scale-90 z-40"
      >
        <Plus className="w-8 h-8" />
      </button>

      <CategoryManager 
        isOpen={isCatManagerOpen} 
        onClose={() => setIsCatManagerOpen(false)} 
      />
// ...existing code...
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

// const SummaryCard = ({ title, amount, icon, color, format }: any) => (
//   <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm flex items-center gap-4">
//     <div className={`${color} p-3 rounded-xl text-white`}>
//       {icon}
//     </div>
//     <div>
//       <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-medium">{title}</p>
//       <p className="text-xl font-bold">{format(amount)}</p>
//     </div>
//   </div>
// );

const TransactionItem = ({ tx, accounts, format }: { tx: Transaction, accounts: Account[], format: (v: number) => string }) => {
  const account = accounts.find(a => a.id === tx.accountId);
  const isIncome = tx.type === 'income';

  return (
    <div className="p-4 flex flex-col gap-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="text-sm font-bold text-slate-400 dark:text-slate-500 w-8">
            {new Date(tx.date).getDate()}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{tx.category}</span>
            <span className="text-[10px] text-slate-400 uppercase">{new Date(tx.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', year: 'numeric' })}</span>
          </div>
        </div>
        <div className="text-right">
          <p className={`text-sm font-bold ${isIncome ? 'text-blue-600 dark:text-blue-400' : 'text-red-500 dark:text-red-400'}`}>
            {isIncome ? '+' : '-'}{format(tx.amount)}
          </p>
          <p className="text-[10px] text-slate-400">$ 0.00</p>
        </div>
      </div>
      <div className="pl-11">
        <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">{tx.note || tx.category}</p>
        <p className="text-xs text-slate-400">{account?.name || 'Unknown Account'}</p>
      </div>
    </div>
  );
};

export default Dashboard;
