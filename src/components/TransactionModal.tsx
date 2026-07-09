import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/schema';
import { addTransaction } from '@/services/financeService';
import { toCents } from '@/types/finance';
import { X, Calendar, Tag, CreditCard, Type } from 'lucide-react';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TransactionModal: React.FC<TransactionModalProps> = ({ isOpen, onClose }) => {
  const [type, setType] = useState<'expense' | 'income' | 'transfer'>('expense');
  const [amount, setAmount] = useState('');
  const [accountId, setAccountId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');

  // Live data for dropdowns
  const accounts = useLiveQuery(() => db.accounts.toArray());
  const categories = useLiveQuery(() => db.categories.toArray());

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'Enter' && e.target === document.activeElement && (document.activeElement as HTMLInputElement).tagName !== 'TEXTAREA') {
        // Simple enter to submit logic can be added here if desired, 
        // but usually handled by form onSubmit
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || !accountId || !categoryId) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      await addTransaction({
        accountId,
        amount: toCents(parseFloat(amount)),
        type,
        category: categoryId,
        note,
        date: new Date(date).getTime(),
      });
      
      // Reset and close
      setAmount('');
      setNote('');
      onClose();
    } catch (error) {
      console.error('Failed to add transaction:', error);
      alert('An error occurred while saving the transaction');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-700">
          <h3 className="text-xl font-bold">Add Transaction</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Type Toggle */}
          <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl">
            {(['expense', 'income', 'transfer'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`py-2 px-3 rounded-lg text-sm font-medium capitalize transition-all ${
                  type === t 
                    ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400' 
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-500 flex items-center gap-2">
              <Type className="w-4 h-4" /> Amount
            </label>
            <input
              type="number"
              inputMode="decimal"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-2xl font-bold"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Account Select */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-500 flex items-center gap-2">
                <CreditCard className="w-4 h-4" /> Account
              </label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="">Select Account</option>
                {accounts?.map(acc => (
                  <option key={acc.id} value={acc.id}>{acc.name}</option>
                ))}
              </select>
            </div>

            {/* Category Select */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-500 flex items-center gap-2">
                <Tag className="w-4 h-4" /> Category
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="">Select Category</option>
                {categories?.filter(c => (type === 'income' ? c.type === 'income' : c.type === 'expense')).map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.parentId ? `↳ ${cat.name}` : cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date Picker */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-500 flex items-center gap-2">
              <Calendar className="w-4 h-4" /> Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* Note */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-500">Note</label>
            <input
              type="text"
              placeholder="What was this for?"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <button
            type="submit"
            className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg hover:bg-blue-700 active:scale-[0.98] transition-all mt-2"
          >
            Save Transaction
          </button>
        </form>
      </div>
    </div>
  );
};

export default TransactionModal;
