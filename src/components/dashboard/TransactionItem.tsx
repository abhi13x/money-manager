import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import type { Transaction, Account } from '@/types/finance';

export const TransactionItem = ({
  tx,
  accounts,
  format
}: {
  tx: Transaction;
  accounts: Account[];
  format: (v: number) => string;
}) => {
  // Extract primary account and fallback destination account for transfer tracking
  const account = accounts.find(a => a.id === tx.accountId);
  const toAccount = tx.accountId ? accounts.find(a => a.id === tx.accountId) : null;
  
  const isIncome = tx.type === 'income';
  const isExpense = tx.type === 'expense';
  const isTransfer = tx.type === 'transfer';

  // Contextual color picker aligning seamlessly with TransactionPanel specifications
  const getAmountColor = () => {
    if (isExpense) return 'error.main';
    if (isIncome) return 'primary.main';
    return 'info.main'; // Indigo/Blue variant for asset transfers
  };

  const getAmountPrefix = () => {
    if (isIncome) return '+';
    if (isExpense) return '-';
    return ''; // Transfers are ledger balances shifts, remaining unsigned
  };

  return (
    <Box
      sx={{
        p: 2,
        display: 'flex',
        flexDirection: 'column',
        gap: 0.75,
        borderBottom: '1px solid',
        borderColor: 'divider',
        transition: 'background-color 0.2s ease',
        '&:hover': {
          bgcolor: 'action.hover',
        },
      }}
    >
      {/* UPPER BLOCK LAYER: Dates, Labels, and Currency */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {/* Calendar Numeric Display Day Box */}
          <Typography
            variant="body2"
            sx={{
              fontWeight: 900,
              color: 'text.disabled',
              width: 24,
              textAlign: 'center',
            }}
          >
            {new Date(tx.date).getDate().toString().padStart(2, '0')}
          </Typography>

          {/* Functional Categorization Info Column */}
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
              {tx.category}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                fontSize: '0.65rem',
                color: 'text.secondary',
                fontWeight: 500,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              {new Date(tx.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short' })}
            </Typography>
          </Box>
        </Box>

        {/* Formatted Balanced Delta Value Output */}
        <Box sx={{ textAlign: 'right' }}>
          <Typography
            variant="body2"
            sx={{
              fontWeight: 700,
              letterSpacing: '-0.025em',
              color: getAmountColor(),
            }}
          >
            {getAmountPrefix()}{format(tx.amount)}
          </Typography>
        </Box>
      </Box>

      {/* LOWER BLOCK LAYER: Truncated Notes and Account Badges */}
      <Box
        sx={{
          pl: 4.5, // Indents row perfectly beneath the category title (offsets the 24px date + gap)
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 2,
        }}
      >
        {/* Dynamic Context Notes */}
        <Typography
          variant="caption"
          noWrap
          sx={{
            color: 'text.secondary',
            maxWidth: 220,
          }}
        >
          {tx.note || tx.category}
        </Typography>

        {/* Structural Account Target Pill Badge */}
        <Chip
          label={
            isTransfer && toAccount
              ? `${account?.name || 'Unknown'} → ${toAccount.name}`
              : account?.name || 'Unknown Ledger'
          }
          size="small"
          variant="outlined"
          sx={{
            height: 20,
            fontSize: '0.65rem',
            fontWeight: 500,
            color: 'text.secondary',
            borderColor: 'divider',
            bgcolor: 'background.default',
            '& .MuiChip-label': { px: 1 },
          }}
        />
      </Box>
    </Box>
  );
};