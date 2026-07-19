import React, { useState } from 'react';
import { 
  Box, 
  Button, 
  Card, 
  CardContent, 
  Typography, 
  Grid,
  IconButton, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  TextField, 
  MenuItem 
} from '@mui/material';
import { Trash2, Edit, PlusCircle } from 'lucide-react';
import { db, type Account, type AccountType } from '@/db/schema';

interface AccountsTabProps {
  accounts: Account[];
  format: (cents: number) => string;
}

const ACCOUNT_CATEGORIES: { label: string; types: AccountType[] }[] = [
  { label: 'Liquid Cash & Banking', types: ['cash', 'savings', 'wallet'] },
  { label: 'Borrowing & Credit Lines', types: ['credit_card', 'debit_card'] },
  { label: 'Equities & Long Term Assets', types: ['mutual_fund', 'stock'] },
  { label: 'Deposits & Fixed Securities', types: ['fd_rd'] },
  { label: 'National Schemes', types: ['scheme'] }, 
];

export const AccountsTab: React.FC<AccountsTabProps> = ({ accounts, format }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  // Form State Values
  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('savings');
  const [balance, setBalance] = useState('');
  const [repeatDay, setRepeatDay] = useState('');
  const [interest, setInterest] = useState('');
  const [ccStatement, setCcStatement] = useState('');
  const [ccDue, setCcDue] = useState('');

  const openAddMode = () => {
    setEditingAccount(null);
    setName('');
    setType('savings');
    setBalance('');
    setRepeatDay('');
    setInterest('');
    setCcStatement('');
    setCcDue('');
    setIsOpen(true);
  };

  const openEditMode = (acc: Account) => {
    setEditingAccount(acc);
    setName(acc.name);
    setType(acc.type);
    setBalance((acc.currentBalance / 100).toString());
    setRepeatDay(acc.repeatInvestmentDate?.toString() || '');
    setInterest(acc.interestRate?.toString() || '');
    setCcStatement(acc.statementDate?.toString() || '');
    setCcDue(acc.dueDate?.toString() || '');
    setIsOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const balCents = Math.round(parseFloat(balance) * 100);

    const data: Partial<Account> = {
      name,
      type,
      currentBalance: balCents,
      initialBalance: editingAccount ? editingAccount.initialBalance : balCents,
      currency: 'INR',
    };

    if (['mutual_fund', 'stock', 'fd_rd', 'scheme'].includes(type)) {
      data.repeatInvestmentDate = parseInt(repeatDay) || undefined;
    }
    if (['fd_rd', 'scheme'].includes(type)) {
      data.interestRate = parseFloat(interest) || undefined;
    }
    if (type === 'credit_card') {
      data.statementDate = parseInt(ccStatement) || undefined;
      data.dueDate = parseInt(ccDue) || undefined;
    }

    if (editingAccount) {
      await db.accounts.update(editingAccount.id, data);
    } else {
      await db.accounts.add({
        ...(data as Account), // Spread first to clear type strictness
        id: crypto.randomUUID() // Enforce ID generation last to clear ts(2783)
      });
    }
    setIsOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this account? Associated balance records will be detached.")) {
      await db.accounts.delete(id);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" sx={{ fontWeight: 800 }}>Asset Registers</Typography>
        <Button variant="contained" startIcon={<PlusCircle size={18} />} onClick={openAddMode} sx={{ borderRadius: '12px', fontWeight: 700, textTransform: 'none' }}>
          Add Account
        </Button>
      </Box>

      {/* Main categories listing */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {ACCOUNT_CATEGORIES.map((cat, idx) => {
          const categorizedAccounts = accounts.filter(acc => cat.types.includes(acc.type));
          if (categorizedAccounts.length === 0) return null;

          return (
            <Box key={idx}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.secondary', mb: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {cat.label}
              </Typography>
              <Grid container spacing={3}>
                {categorizedAccounts.map((acc) => (
                  <Grid size={{ xs: 12, sm: 6 }} key={acc.id}>
                    <Card sx={{ borderRadius: '16px', border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
                      <CardContent sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box>
                          <Typography variant="body1" sx={{ fontWeight: 800 }}>{acc.name}</Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
                            {acc.type.replace('_', ' ').toUpperCase()} 
                            {acc.interestRate ? ` | Interest: ${acc.interestRate}%` : ''}
                            {acc.repeatInvestmentDate ? ` | SIP Date: Day ${acc.repeatInvestmentDate}` : ''}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 900 }}>
                            {format(acc.currentBalance)}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <IconButton size="small" onClick={() => openEditMode(acc)}><Edit size={15} /></IconButton>
                            <IconButton size="small" color="error" onClick={() => handleDelete(acc.id)}><Trash2 size={15} /></IconButton>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          );
        })}
      </Box>

      {/* Account Add/Edit Modal */}
      <Dialog open={isOpen} onClose={() => setIsOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 800 }}>{editingAccount ? 'Edit Account' : 'Add Account'}</DialogTitle>
        <Box component="form" onSubmit={handleSave}>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <TextField label="Account Name" value={name} onChange={(e) => setName(e.target.value)} required fullWidth />
            
            <TextField select label="Account Type" value={type} onChange={(e) => setType(e.target.value as AccountType)} required fullWidth>
              <MenuItem value="cash">Cash</MenuItem>
              <MenuItem value="savings">Savings Account</MenuItem>
              <MenuItem value="wallet">Wallet</MenuItem>
              <MenuItem value="credit_card">Credit Card</MenuItem>
              <MenuItem value="debit_card">Debit Card</MenuItem>
              <MenuItem value="mutual_fund">Mutual Fund</MenuItem>
              <MenuItem value="stock">Stocks</MenuItem>
              <MenuItem value="fd_rd">Fixed Deposit / RD</MenuItem>
              <MenuItem value="scheme">Scheme (NPS, PPF, EPFO)</MenuItem>
            </TextField>

            <TextField label="Current Balance" type="number" value={balance} onChange={(e) => setBalance(e.target.value)} required fullWidth />

            {/* Dynamic Investment Dates input */}
            {['mutual_fund', 'stock', 'fd_rd', 'scheme'].includes(type) && (
              <TextField label="Repeat Investment Day (1-31)" type="number" value={repeatDay} onChange={(e) => setRepeatDay(e.target.value)} required fullWidth />
            )}

            {/* Dynamic Interest values input (MUI v6 slotProps fix) */}
            {['fd_rd', 'scheme'].includes(type) && (
              <TextField 
                label="Interest Rate (%)" 
                type="number" 
                slotProps={{ htmlInput: { step: "0.01" } }} 
                value={interest} 
                onChange={(e) => setInterest(e.target.value)} 
                required 
                fullWidth 
              />
            )}

            {/* Dynamic Statement dates input */}
            {type === 'credit_card' && (
              <>
                <TextField label="Statement Date (1-31)" type="number" value={ccStatement} onChange={(e) => setCcStatement(e.target.value)} required fullWidth />
                <TextField label="Due Date (1-31)" type="number" value={ccDue} onChange={(e) => setCcDue(e.target.value)} required fullWidth />
              </>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 3, gap: 1 }}>
            <Button onClick={() => setIsOpen(false)} color="inherit">Cancel</Button>
            <Button type="submit" variant="contained">Save</Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
};