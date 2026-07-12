import React from 'react';

export const Tabmenu: React.FC = () => (
    <div className="flex-none flex justify-around border-b border-slate-100 dark:border-slate-800 text-sm font-medium text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 z-10">
        {['Daily', 'Calendar', 'Weekly', 'Monthly', 'Summary'].map((tab) => (
            <button
                key={tab}
                type="button"
                className={`py-3 px-2 border-b-2 transition-colors ${tab === 'Daily' ? 'border-orange-500 text-orange-500' : 'border-transparent hover:text-slate-800 dark:hover:text-slate-200'}`}
            >
                {tab}
            </button>
        ))}
    </div>
);