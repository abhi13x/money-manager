// src/components/Dashboard/TransactionPanel.tsx
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Check } from 'lucide-react';
import type { Transaction, Account } from '@/types/finance';
import { db } from '@/db/schema';

interface HeaderSegmentsProps {
  txType: 'expense' | 'income';
  setTxType: (type: 'expense' | 'income') => void;
  onClose: () => void;
}

// Custom Page Top Navigation Bar
const HeaderSegments: React.FC<HeaderSegmentsProps> = ({ txType, setTxType, onClose }) => (
  <div className="bg-slate-100 dark:bg-slate-900 p-3 flex flex-col gap-3 border-b border-slate-200 dark:border-slate-800">
    <div className="flex items-center gap-3">
      <button 
        type="button" 
        onClick={onClose}
        className="p-1 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>
      <h1 className="text-base font-bold text-slate-800 dark:text-slate-100">Add Transaction</h1>
    </div>
    
    <div className="bg-slate-200/60 dark:bg-slate-800 p-1 flex rounded-xl">
      <button
        type="button"
        onClick={() => setTxType('expense')}
        className={`flex-1 py-2 text-center text-xs font-bold rounded-lg transition-all ${txType === 'expense' ? 'bg-red-500 text-white shadow-md' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'}`}
      >
        Expense
      </button>
      <button
        type="button"
        onClick={() => setTxType('income')}
        className={`flex-1 py-2 text-center text-xs font-bold rounded-lg transition-all ${txType === 'income' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'}`}
      >
        Income
      </button>
    </div>
  </div>
);

export const HandleSaveTransaction = ({ 
  onClose, 
  accounts 
}: { 
  onClose: () => void; 
  accounts: Account[] 
}) => {
  const [txType, setTxType] = useState<'expense' | 'income'>('expense');
  const [txDate, setTxDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [txAccount, setTxAccount] = useState<string>('');
  const [txCategory, setTxCategory] = useState<string>('');
  const [txAmount, setTxAmount] = useState<string>('');
  const [txNote, setTxNote] = useState<string>('');

  useEffect(() => {
    if (accounts && accounts.length > 0 && !txAccount) {
      setTxAccount(accounts[0].id || '');
    }
  }, [accounts, txAccount]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!txAmount || !txCategory || !txAccount) return;

    const parsedAmount = Math.round(parseFloat(txAmount) * 100);
    if (isNaN(parsedAmount) || parsedAmount <= 0) return;

    try {
      await db.transactions.add({
        id: crypto.randomUUID(),
        type: txType,
        date: new Date(txDate).getTime(),
        accountId: txAccount,
        category: txCategory,
        amount: parsedAmount,
        note: txNote.trim(),
      } as Transaction);

      onClose(); 
    } catch (error) {
      console.error("Failed to commit transactional ledger entry records:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full h-full flex flex-col bg-slate-50 dark:bg-slate-900">
      <HeaderSegments txType={txType} setTxType={setTxType} onClose={onClose} />

      <div className="flex-1 overflow-y-auto divide-y divide-slate-200/60 dark:divide-slate-800 bg-white dark:bg-slate-950 px-4">
        {/* Date Field */}
        <div className="flex items-center py-4">
          <label className="w-24 text-xs font-bold tracking-wide text-slate-400 uppercase">Date</label>
          <input
            type="date"
            value={txDate}
            onChange={(e) => setTxDate(e.target.value)}
            required
            className="flex-1 text-sm font-semibold bg-transparent border-none text-slate-900 dark:text-slate-100 focus:outline-none text-right"
          />
        </div>

        {/* Account Field */}
        <div className="flex items-center py-4">
          <label className="w-24 text-xs font-bold tracking-wide text-slate-400 uppercase">Account</label>
          <select
            value={txAccount}
            onChange={(e) => setTxAccount(e.target.value)}
            required
            className="flex-1 text-sm font-semibold bg-transparent border-none text-slate-900 dark:text-slate-100 focus:outline-none text-right appearance-none cursor-pointer"
          >
            {accounts?.map(acc => (
              <option key={acc.id} value={acc.id} className="text-slate-900 bg-white dark:bg-slate-950 dark:text-slate-100">
                {acc.name}
              </option>
            ))}
          </select>
        </div>

        {/* Category Field */}
        <div className="flex items-center py-4">
          <label className="w-24 text-xs font-bold tracking-wide text-slate-400 uppercase">Category</label>
          <select
            value={txCategory}
            onChange={(e) => setTxCategory(e.target.value)}
            required
            className="flex-1 text-sm font-semibold bg-transparent border-none text-slate-900 dark:text-slate-100 focus:outline-none text-right appearance-none cursor-pointer"
          >
            <option value="" disabled className="text-slate-400">Choose Category</option>
            {txType === 'expense' ? (
              ['Food', 'Transport', 'Shopping', 'Entertainment', 'Housing', 'Utilities'].map(cat => (
                <option key={cat} value={cat} className="text-slate-900 bg-white dark:bg-slate-950 dark:text-slate-100">{cat}</option>
              ))
            ) : (
              ['Salary', 'Investments', 'Freelance', 'Gifts', 'Other'].map(cat => (
                <option key={cat} value={cat} className="text-slate-900 bg-white dark:bg-slate-950 dark:text-slate-100">{cat}</option>
              ))
            )}
          </select>
        </div>

        {/* Amount Field */}
        <div className="flex items-center py-4">
          <label className="w-24 text-xs font-bold tracking-wide text-slate-400 uppercase">Amount</label>
          <input
            type="number"
            step="0.01"
            placeholder="0.00"
            value={txAmount}
            onChange={(e) => setTxAmount(e.target.value)}
            required
            className={`flex-1 text-base font-extrabold bg-transparent border-none focus:outline-none text-right ${txType === 'expense' ? 'text-red-500 placeholder-red-300' : 'text-blue-600 placeholder-blue-300'}`}
          />
        </div>

        {/* Note Field */}
        <div className="flex items-center py-4">
          <label className="w-24 text-xs font-bold tracking-wide text-slate-400 uppercase">Note</label>
          <input
            type="text"
            placeholder="Enter dynamic notes..."
            value={txNote}
            onChange={(e) => setTxNote(e.target.value)}
            className="flex-1 text-sm font-medium bg-transparent border-none text-slate-800 dark:text-slate-200 focus:outline-none text-right placeholder-slate-300 dark:placeholder-slate-700"
          />
        </div>
      </div>

      {/* Save Button Bar */}
      <div className="p-4 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800/80">
        <button
          type="submit"
          className={`w-full py-3.5 font-bold text-sm text-white rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all active:scale-98 ${txType === 'expense' ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-600 hover:bg-blue-750'}`}
        >
          <Check className="w-4 h-4" />
          Save Entry
        </button>
      </div>
    </form>
  );
};