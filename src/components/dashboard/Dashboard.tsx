// src/components/Dashboard/Dashboard.tsx
import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Plus } from 'lucide-react';

import { db } from '@/db/schema';
import { formatCurrency } from '@/services/financeService';

import CategoryManager from '../CategoryManager';
import { DateSelector } from './DateSelector';
import { Tabmenu } from './TabMenu';
import { HandleSaveTransaction } from './TransactionPanel';
import { TransactionItem } from './TransactionItem';
import { BottomNavDock } from './BottomNavDock';
import { SummaryValueRow } from './MainContent';

const Dashboard: React.FC = () => {
  // Page Routing Layout States ('dashboard' or 'add-expense')
  const [currentView, setCurrentView] = useState<'dashboard' | 'add-expense'>('dashboard');
  const [isCatManagerOpen, setIsCatManagerOpen] = useState(false);

  // Live queries for data tracking
  const transactions = useLiveQuery(() => db.transactions.orderBy('date').reverse().limit(10).toArray());
  const accounts = useLiveQuery(() => db.accounts.toArray());

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

    return { monthlyIncome: income, monthlyExpense: expense };
  });

  return (
    <div className="h-screen max-w-md mx-auto bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 flex flex-col border-x border-slate-100 dark:border-slate-800 shadow-xl relative overflow-hidden select-none">
      
      {/* 🧭 IF VIEW IS 'add-expense', MOUNT IT AS THE WHOLE EXCLUSIVE SCREEN VIEW */}
      {currentView === 'add-expense' ? (
        <HandleSaveTransaction
          onClose={() => setCurrentView('dashboard')}
          accounts={accounts || []}
        />
      ) : (
        /* 📋 OTHERWISE, RENDER THE STANDARD DASHBOARD VIEW */
        <>
          {/* 1. TOP BAR */}
          <DateSelector />

          {/* 2. TAB MENU */}
          <Tabmenu />

          {/* 3. SCROLLABLE MAIN CONTENT AREA */}
          <main className="flex-1 overflow-y-auto relative bg-slate-50/20 dark:bg-slate-900/10">
            {/* SUMMARY VALUE ROW */}
            <SummaryValueRow 
              income={summaries?.monthlyIncome || 0} 
              expense={summaries?.monthlyExpense || 0} 
            />        

            {/* TRANSACTIONS LEDGER LIST */}
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
                <div className="p-12 text-center text-slate-400 text-sm">No transactions found.</div>
              )}
            </div>

            {/* FLOATING ACTION BUTTON */}
            <button
              onClick={() => setCurrentView('add-expense')} // 👈 Opens transaction view as an absolute page frame swap
              className="fixed w-14 h-14 bg-red-500 text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-red-600 transition-all active:scale-90 z-20"
              style={{ position: 'absolute', bottom: '24px', right: '24px' }}
            >
              <Plus className="w-8 h-8 flex-shrink-0" />
            </button>
          </main>

          {/* 4. SOLID BOTTOM NAVIGATION DOCK */}
          <BottomNavDock />

          {/* CATEGORY MANAGER MODAL */}
          <CategoryManager
            isOpen={isCatManagerOpen}
            onClose={() => setIsCatManagerOpen(false)}
          />
        </>
      )}
    </div>
  );
};

export default Dashboard;