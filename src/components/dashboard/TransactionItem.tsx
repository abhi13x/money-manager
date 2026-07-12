import type { Transaction, Account } from '@/types/finance';

export const TransactionItem = (
    { tx, accounts, format }: {
        tx: Transaction, accounts: Account[], format: (v: number) => string
    }
) => {
    // Direct UUID String evaluation match
    const account = accounts.find(a => a.id === tx.accountId);
    const isIncome = tx.type === 'income';

    return (
        <div className="p-4 flex flex-col gap-1.5 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="text-sm font-black text-slate-300 dark:text-slate-600 w-6 text-center">
                        {new Date(tx.date).getDate().toString().padStart(2, '0')}
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{tx.category}</span>
                        <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                            {new Date(tx.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short' })}
                        </span>
                    </div>
                </div>
                <div className="text-right">
                    <p className={`text-sm font-bold tracking-tight ${isIncome ? 'text-blue-600 dark:text-blue-400' : 'text-red-500 dark:text-red-400'}`}>
                        {isIncome ? '+' : '-'}{format(tx.amount)}
                    </p>
                </div>
            </div>
            <div className="pl-9 flex justify-between items-center gap-4">
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[220px]">
                    {tx.note || tx.category}
                </p>
                <span className="text-[10px] px-2 py-0.5 font-medium rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200/40 dark:border-slate-700/40">
                    {account?.name || 'Unknown Ledger'}
                </span>
            </div>
        </div>
    );
};