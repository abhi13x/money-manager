// src/components/Dashboard/TransactionPanel.tsx
import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckIcon from '@mui/icons-material/Check';

import type { Transaction, Account } from '@/types/finance';
import { db } from '@/db/schema';

interface HeaderSegmentsProps {
  txType: 'expense' | 'income' | 'transfer';
  setTxType: (type: 'expense' | 'income' | 'transfer') => void;
  onClose: () => void;
}

// Crisp, Material Top Navigation Header with 3-Way Segment Tabs
const HeaderSegments: React.FC<HeaderSegmentsProps> = ({ txType, setTxType, onClose }) => {
  const getIndicatorColor = () => {
    if (txType === 'expense') return 'error.main';
    if (txType === 'income') return 'primary.main';
    return 'info.main'; // Neutral blue/indigo for transfers
  };

  return (
    <Box sx={{ bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', p: 1.5, gap: 1 }}>
        <IconButton onClick={onClose} size="small" edge="start">
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          Add Transaction
        </Typography>
      </Box>
      
      <Tabs
        value={txType}
        onChange={(_, newValue: 'expense' | 'income' | 'transfer') => setTxType(newValue)}
        variant="fullWidth"
        textColor="inherit"
        slotProps={{
          indicator: {
            sx: { bgcolor: getIndicatorColor(), height: 3 }
          }
        }}
      >
        <Tab 
          label="Expense" 
          value="expense" 
          sx={{ 
            fontWeight: 700, 
            fontSize: '0.85rem',
            color: txType === 'expense' ? 'error.main' : 'text.secondary'
          }} 
        />
        <Tab 
          label="Income" 
          value="income" 
          sx={{ 
            fontWeight: 700, 
            fontSize: '0.85rem',
            color: txType === 'income' ? 'primary.main' : 'text.secondary'
          }} 
        />
        <Tab 
          label="Transfer" 
          value="transfer" 
          sx={{ 
            fontWeight: 700, 
            fontSize: '0.85rem',
            color: txType === 'transfer' ? 'info.main' : 'text.secondary'
          }} 
        />
      </Tabs>
    </Box>
  );
};

export const HandleSaveTransaction = ({ 
  onClose, 
  accounts 
}: { 
  onClose: () => void; 
  accounts: Account[] 
}) => {
  const [txType, setTxType] = useState<'expense' | 'income' | 'transfer'>('expense');
  const [txDate, setTxDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [txAccount, setTxAccount] = useState<string>('');
  const [txToAccount, setTxToAccount] = useState<string>(''); // Added destination state node
  const [txCategory, setTxCategory] = useState<string>('');
  const [txAmount, setTxAmount] = useState<string>('');
  const [txNote, setTxNote] = useState<string>('');

  // Automatically assign default accounts on load
  useEffect(() => {
    if (accounts && accounts.length > 0) {
      if (!txAccount) setTxAccount(accounts[0].id || '');
      if (!txToAccount && accounts.length > 1) setTxToAccount(accounts[1].id || '');
    }
  }, [accounts, txAccount, txToAccount]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!txAmount || !txAccount) return;
    if (txType !== 'transfer' && !txCategory) return;
    if (txType === 'transfer' && !txToAccount) return;
    
    // Safety check: Prevent transferring money to the exact same account
    if (txType === 'transfer' && txAccount === txToAccount) {
      alert("From and To accounts cannot be identical.");
      return;
    }

    const parsedAmount = Math.round(parseFloat(txAmount) * 100);
    if (isNaN(parsedAmount) || parsedAmount <= 0) return;

    try {
      await db.transactions.add({
        id: crypto.randomUUID(),
        type: txType,
        date: new Date(txDate).getTime(),
        accountId: txAccount,
        // Include destination account reference if it's a transfer layout
        toAccountId: txType === 'transfer' ? txToAccount : undefined,
        category: txType === 'transfer' ? 'Transfer' : txCategory,
        amount: parsedAmount,
        note: txNote.trim(),
      } as Transaction);

      onClose(); 
    } catch (error) {
      console.error("Failed to commit transactional ledger entry records:", error);
    }
  };

  const categories = txType === 'expense' 
    ? ['Food', 'Transport', 'Shopping', 'Entertainment', 'Housing', 'Utilities']
    : ['Salary', 'Investments', 'Freelance', 'Gifts', 'Other'];

  const getThemeColor = () => {
    if (txType === 'expense') return 'error';
    if (txType === 'income') return 'primary';
    return 'info';
  };

  return (
    <Box 
      component="form" 
      onSubmit={handleSubmit} 
      sx={{ 
        width: '100%', 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column', 
        bgcolor: 'background.default' 
      }}
    >
      <HeaderSegments txType={txType} setTxType={setTxType} onClose={onClose} />

      {/* INPUT DATA BLOCK AREA */}
      <Box 
        sx={{ 
          flex: 1, 
          overflowY: 'auto', 
          p: 3, 
          display: 'flex', 
          flexDirection: 'column', 
          gap: 2.5,
          bgcolor: 'background.paper' 
        }}
      >
        {/* Date Field input */}
        <TextField
          label="Date"
          type="date"
          value={txDate}
          onChange={(e) => setTxDate(e.target.value)}
          required
          fullWidth
          variant="standard"
          slotProps={{
            inputLabel: { shrink: true }
          }}
        />

        {/* Account Selection Node (Acts as "From Account" if type is Transfer) */}
        <TextField
          select
          label={txType === 'transfer' ? "From Account" : "Account"}
          value={txAccount}
          onChange={(e) => setTxAccount(e.target.value)}
          required
          fullWidth
          variant="standard"
        >
          {accounts?.map((acc) => (
            <MenuItem key={acc.id} value={acc.id}>
              {acc.name}
            </MenuItem>
          ))}
        </TextField>

        {/* Destination Account Selection Node (Rendered ONLY during a transfer event) */}
        {txType === 'transfer' && (
          <TextField
            select
            label="To Account"
            value={txToAccount}
            onChange={(e) => setTxToAccount(e.target.value)}
            required
            fullWidth
            variant="standard"
          >
            {accounts?.map((acc) => (
              <MenuItem key={acc.id} value={acc.id}>
                {acc.name}
              </MenuItem>
            ))}
          </TextField>
        )}

        {/* Category Selection Node (Hidden during a transfer event) */}
        {txType !== 'transfer' && (
          <TextField
            select
            label="Category"
            value={txCategory}
            onChange={(e) => setTxCategory(e.target.value)}
            required
            fullWidth
            variant="standard"
          >
            {categories.map((cat) => (
              <MenuItem key={cat} value={cat}>
                {cat}
              </MenuItem>
            ))}
          </TextField>
        )}

        {/* Amount Numerical Input field */}
        <TextField
          label="Amount"
          type="number"
          placeholder="0.00"
          value={txAmount}
          onChange={(e) => setTxAmount(e.target.value)}
          required
          fullWidth
          variant="standard"
          slotProps={{
            htmlInput: { step: '0.01', min: '0' },
            input: {
              sx: {
                fontSize: '1.25rem',
                fontWeight: 800,
                color: txType === 'expense' ? 'error.main' : txType === 'income' ? 'primary.main' : 'info.main',
              }
            },
            inputLabel: { shrink: true }
          }}
        />

        {/* Note Context string field */}
        <TextField
          label="Note"
          type="text"
          placeholder="Enter notes..."
          value={txNote}
          onChange={(e) => setTxNote(e.target.value)}
          fullWidth
          variant="standard"
        />
      </Box>

      {/* FIXED ACTION BOTTOM SAVE BAR */}
      <Box 
        sx={{ 
          p: 2, 
          bgcolor: 'background.paper', 
          borderTop: '1px solid', 
          borderColor: 'divider' 
        }}
      >
        <Button
          type="submit"
          variant="contained"
          fullWidth
          size="large"
          color={getThemeColor()}
          startIcon={<CheckIcon />}
          sx={{ 
            py: 1.5, 
            borderRadius: 3, 
            fontWeight: 700,
            textTransform: 'none',
            fontSize: '0.95rem',
            boxShadow: 3
          }}
        >
          Save Entry
        </Button>
      </Box>
    </Box>
  );
};