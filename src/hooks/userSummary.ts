import { db } from '@/db/schema';
import { useLiveQuery } from 'dexie-react-hooks';

// Calculate summaries for the current month
export const summaries = useLiveQuery(async () => {
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