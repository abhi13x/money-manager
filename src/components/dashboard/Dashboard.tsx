// src/components/Dashboard/Dashboard.tsx
import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';

import { db } from '@/db/schema';
import { formatCurrency } from '@/services/financeService';

import CategoryManager from '../CategoryManager';
import { DateSelector } from './DateMonthSelector';
import { Tabmenu } from './TabMenu';
import { HandleSaveTransaction } from '../TransactionPanel';
import { TransactionItem } from './TransactionItem';
import type { NavView } from './BottomNavDock';
import { BottomNavDock } from './BottomNavDock';
import { SummaryValueRow } from './MainContent';
import Box from '@mui/material/Box';
import Fab from '@mui/material/Fab';
import AddIcon from '@mui/icons-material/Add';

const Dashboard: React.FC = () => {
  const [currentView, setCurrentView] = useState<NavView | 'add-expense'>('home');
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
      <h1 className="sr-only">Dashboard</h1>
      
      {currentView === 'add-expense' ? (
        <HandleSaveTransaction
          onClose={() => setCurrentView('home')} 
          accounts={accounts || []}
        />
      ) : (
        <>
          {/* 1. TOP BAR */}
          <DateSelector />

          {/* 2. TAB MENU */}
          <Tabmenu />

          {/* 3. SCROLLABLE MAIN CONTENT AREA */}
          <main className="flex-1 overflow-y-auto relative bg-slate-50/20 dark:bg-slate-900/10">
            
            {/* 🏠 HOME/DASHBOARD VIEW */}
            {currentView === 'home' && (
              <>
                <SummaryValueRow
                  income={summaries?.monthlyIncome || 0}
                  expense={summaries?.monthlyExpense || 0}
                />

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
              </>
            )}

            {/* 📑 TRANSACTIONS HISTORY VIEW */}
            {currentView === 'transactions' && (
              <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-sm">
                Full Ledger History Component Goes Here
              </div>
            )}

            {/* 📊 ANALYTICS STATS VIEW */}
            {currentView === 'stats' && (
              <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-sm">
                Charts and Insights Component Goes Here
              </div>
            )}

            {/* 💳 ACCOUNTS MANAGEMENT VIEW */}
            {currentView === 'accounts' && (
              <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-sm">
                Wallet and Bank Accounts List Goes Here
              </div>
            )}

            {/* FLOATING ACTION BUTTON */}
            {/* Kept globally inside main so you can hit "+" from any main navigation tab */}
            <Box
              sx={{
                position: 'absolute',
                bottom: 24,
                right: 24,
                zIndex: 20,
              }}
            >
              <Fab
                color="error"
                onClick={() => setCurrentView('add-expense')}
                aria-label="add transaction"
                sx={{
                  width: 56,
                  height: 56,
                  boxShadow: 6,
                }}
              >
                <AddIcon sx={{ fontSize: 32 }} />
              </Fab>
            </Box>
          </main>

          {/* 4. SOLID BOTTOM NAVIGATION DOCK */}
          <BottomNavDock 
            currentView={currentView} 
            onViewChange={(newView) => setCurrentView(newView)} 
          />

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