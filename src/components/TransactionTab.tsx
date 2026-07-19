import React, { useState } from 'react';
import { Box, Button, ButtonGroup, TextField, Typography, 
  Card, IconButton, Dialog, DialogTitle, 
  DialogContent, DialogActions, Chip } 
  from '@mui/material';
import { Trash2 } from 'lucide-react';
import type { Transaction, Account, Category } from '@/db/schema';
import { db } from '@/db/schema';

interface TransactionsTabProps {
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
  format: (cents: number) => string;
}

export const TransactionsTab: React.FC<TransactionsTabProps> = ({
  transactions,
  accounts,
  categories,
  format,
}) => {
  const [viewMode, setViewMode] = useState<'daily' | 'monthly' | 'yearly'>('daily');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Filter transactions by selected date range
  const filteredTx = transactions.filter((tx) => {
    if (startDate && tx.date < new Date(startDate).getTime()) return false;
    // Include the entire end day
    if (endDate && tx.date > new Date(endDate).getTime() + 86400000) return false;
    return true;
  });

  const handleDelete = async () => {
    if (deleteId) {
      await db.transactions.delete(deleteId);
      setDeleteId(null);
    }
  };

  // Rendering Helper: Get category display name
  const getCategoryName = (tx: Transaction) => {
    if (tx.type === 'transfer') return 'Transfer';
    const cat = categories.find((c) => c.id === tx.categoryId);
    return cat ? cat.name : 'Uncategorized';
  };

  // Daily Grouping Engine
  const groupDaily = () => {
    const groups: { [key: string]: Transaction[] } = {};
    filteredTx.forEach((tx) => {
      const dateKey = new Date(tx.date).toLocaleDateString(undefined, {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(tx);
    });
    return groups;
  };

  // Period (Monthly / Yearly) Grouping Engine
  const groupPeriod = (mode: 'monthly' | 'yearly') => {
    const groups: { [key: string]: Transaction[] } = {};
    filteredTx.forEach((tx) => {
      const dateObj = new Date(tx.date);
      const key = mode === 'monthly' 
        ? dateObj.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
        : dateObj.getFullYear().toString();
      if (!groups[key]) groups[key] = [];
      groups[key].push(tx);
    });
    return groups;
  };

  const dailyGroups = groupDaily();
  const periodGroups = groupPeriod(viewMode === 'monthly' ? 'monthly' : 'yearly');

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Date Range Picker & View Toggles */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'space-between', alignItems: 'center' }}>
        <ButtonGroup variant="outlined" size="small" sx={{ borderRadius: '12px' }}>
          {(['daily', 'monthly', 'yearly'] as const).map((mode) => (
            <Button
              key={mode}
              onClick={() => setViewMode(mode)}
              variant={viewMode === mode ? 'contained' : 'outlined'}
              sx={{ textTransform: 'capitalize', fontWeight: 700 }}
            >
              {mode}
            </Button>
          ))}
        </ButtonGroup>

        {/* Date Filters */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <TextField
            type="date"
            label="From"
            size="small"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField
            type="date"
            label="To"
            size="small"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          {(startDate || endDate) && (
            <Button 
              color="error" 
              onClick={() => { setStartDate(''); setEndDate(''); }}
              sx={{ fontWeight: 700 }}
            >
              Clear
            </Button>
          )}
        </Box>
      </Box>

      {/* Ledger Output */}
      {filteredTx.length === 0 ? (
        <Card sx={{ p: 8, textAlign: 'center', border: '1px solid', borderColor: 'divider', boxShadow: 'none', borderRadius: '16px' }}>
          <Typography variant="body1" sx={{ color: 'text.secondary' }}>
            No transactions found for the selected period.
          </Typography>
        </Card>
      ) : viewMode === 'daily' ? (
        // Render Daily View grouped under headers
        Object.keys(dailyGroups).map((date) => (
          <Box key={date}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.secondary', mb: 1, mt: 2, px: 1 }}>
              {date}
            </Typography>
            <Card sx={{ border: '1px solid', borderColor: 'divider', boxShadow: 'none', borderRadius: '16px', overflow: 'hidden' }}>
              {dailyGroups[date].map((tx, idx) => (
                <Box key={tx.id} sx={{ borderBottom: idx !== dailyGroups[date].length - 1 ? '1px solid' : 'none', borderColor: 'divider' }}>
                  <TransactionRow tx={tx} accounts={accounts} getCategoryName={getCategoryName} format={format} onDelete={() => setDeleteId(tx.id)} />
                </Box>
              ))}
            </Card>
          </Box>
        ))
      ) : (
        // Render Monthly / Yearly View
        Object.keys(periodGroups).map((period) => (
          <Box key={period}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.secondary', mb: 1, mt: 2, px: 1 }}>
              {period}
            </Typography>
            <Card sx={{ border: '1px solid', borderColor: 'divider', boxShadow: 'none', borderRadius: '16px', overflow: 'hidden' }}>
              {periodGroups[period].map((tx, idx) => (
                <Box key={tx.id} sx={{ borderBottom: idx !== periodGroups[period].length - 1 ? '1px solid' : 'none', borderColor: 'divider' }}>
                  <TransactionRow tx={tx} accounts={accounts} getCategoryName={getCategoryName} format={format} onDelete={() => setDeleteId(tx.id)} />
                </Box>
              ))}
            </Card>
          </Box>
        ))
      )}

      {/* Confirmation Dialog */}
      <Dialog open={!!deleteId} onClose={() => setDeleteId(null)}>
        <DialogTitle sx={{ fontWeight: 800 }}>Confirm Deletion</DialogTitle>
        <DialogContent>
          <Typography variant="body2">Are you sure you want to delete this transaction? This action cannot be undone.</Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={() => setDeleteId(null)} color="inherit">Cancel</Button>
          <Button onClick={handleDelete} variant="contained" color="error">Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// Internal reusable Row component to display fields correctly
const TransactionRow: React.FC<{
  tx: Transaction;
  accounts: Account[];
  getCategoryName: (tx: Transaction) => string;
  format: (v: number) => string;
  onDelete: () => void;
}> = ({ tx, accounts, getCategoryName, format, onDelete }) => {
  const account = accounts.find((a) => a.id === tx.accountId);
  const toAccount = tx.toAccountId ? accounts.find((a) => a.id === tx.toAccountId) : null;

  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, hover: { bgcolor: 'action.hover' } }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
        <Typography variant="body1" sx={{ fontWeight: 700 }}>
          {getCategoryName(tx)}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
            {tx.type === 'transfer' && account && toAccount 
              ? `${account.name} ➔ ${toAccount.name}` 
              : account?.name}
          </Typography>
          {tx.isRecurring && (
            <Chip label={`Repeats: ${tx.repeatInterval}`} size="small" variant="outlined" sx={{ height: 18, fontSize: '0.6rem', fontWeight: 800 }} />
          )}
          {tx.note && (
            <Typography variant="caption" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
              — {tx.note}
            </Typography>
          )}
          {tx.description && (
            <Typography variant="caption" sx={{ color: 'text.disabled', width: '100%' }}>
              Desc: {tx.description}
            </Typography>
          )}
        </Box>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Typography variant="body1" sx={{ fontWeight: 800, color: tx.type === 'income' ? 'success.main' : tx.type === 'expense' ? 'error.main' : 'text.primary' }}>
          {tx.type === 'income' ? '+' : tx.type === 'expense' ? '-' : ''} {format(tx.amount)}
        </Typography>
        <IconButton size="small" color="error" onClick={onDelete}>
          <Trash2 size={16} />
        </IconButton>
      </Box>
    </Box>
  );
};