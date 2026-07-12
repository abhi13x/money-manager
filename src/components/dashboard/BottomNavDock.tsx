import React from 'react';
import { Wallet, ArrowUpRight, Settings, LayoutDashboard } from 'lucide-react';

export const BottomNavDock: React.FC = () => {
    return (
    <nav className="flex-none bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 px-4 pt-3 pb-[calc(12px+env(safe-area-inset-bottom))] flex justify-between items-center z-30 shadow-[0_-4px_12px_rgba(0,0,0,0.03)]">
        <button
          type="button"
          className="flex flex-col items-center justify-center flex-1 py-1 text-orange-500 transition-all active:scale-95 focus:outline-none"
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px] font-medium mt-1">Dashboard</span>
        </button>

        <button
          type="button"
          className="flex flex-col items-center justify-center flex-1 py-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-all active:scale-95 focus:outline-none"
        >
          <ArrowUpRight className="w-5 h-5" />
          <span className="text-[10px] font-medium mt-1">Stats</span>
        </button>

        <button
          type="button"
          className="flex flex-col items-center justify-center flex-1 py-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-all active:scale-95 focus:outline-none"
        >
          <Wallet className="w-5 h-5" />
          <span className="text-[10px] font-medium mt-1">Accounts</span>
        </button>

        <button
          type="button"
          className="flex flex-col items-center justify-center flex-1 py-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-all active:scale-95 focus:outline-none"
        >
          <Settings className="w-5 h-5" />
          <span className="text-[10px] font-medium mt-1">Settings</span>
        </button>
      </nav>
      );
}