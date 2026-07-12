import React from 'react';
import { formatCurrency } from '@/services/financeService';

interface SummaryValueRowProps {
  income: number;  // Accepts raw paise/cents integer
  expense: number; // Accepts raw paise/cents integer
}

export const SummaryValueRow: React.FC<SummaryValueRowProps> = ({ income, expense }) => {
  const netTotal = income - expense;

  return (
    <div className="grid grid-cols-3 gap-2 p-4 text-center border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
      <div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Income</p>
        <p className="text-sm font-bold text-blue-600 dark:text-blue-400">
          {formatCurrency(income)}
        </p>
      </div>
      <div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Expenses</p>
        <p className="text-sm font-bold text-red-500 dark:text-red-400">
          {formatCurrency(expense)}
        </p>
      </div>
      <div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Total</p>
        <p className={`text-sm font-bold ${netTotal >= 0 ? 'text-slate-900 dark:text-slate-100' : 'text-red-500 dark:text-red-400'}`}>
          {formatCurrency(netTotal)}
        </p>
      </div>
    </div>
  );
};