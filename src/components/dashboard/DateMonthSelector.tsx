// src/components/Dashboard/DateSelector.tsx
import React, { useState } from 'react';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

export const DateSelector: React.FC = () => {
  // Main Dashboard State (Format: YYYY-MM)
  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  // Popup Control States
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState(() => new Date().getFullYear());

  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  // Extract current year and month index for active UI highlighting
  const [activeYear, activeMonthIdx] = currentMonth.split('-').map(Number);

  const formatMonthDisplay = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  // Step the top-level bar forwards or backwards by exactly one month
  const handleChevronStep = (direction: 'prev' | 'next') => {
    const step = direction === 'prev' ? -1 : 1;
    const [year, month] = currentMonth.split('-').map(Number);
    const newDate = new Date(year, month - 1 + step, 1);

    setCurrentMonth(
      `${newDate.getFullYear()}-${String(newDate.getMonth() + 1).padStart(2, '0')}`
    );
  };

  // Open popup and sync the inner tracking year to match the active state
  const handleOpenPicker = () => {
    setPickerYear(activeYear);
    setIsPickerOpen(true);
  };

  // Commit changes when clicking a specific month cell matrix block
  const handleSelectMonth = (monthIndex: number) => {
    const targetMonth = String(monthIndex + 1).padStart(2, '0');
    setCurrentMonth(`${pickerYear}-${targetMonth}`);
    setIsPickerOpen(false);
  };

  return (
    <Box
      sx={{
        bgcolor: 'background.paper',
        borderBottom: '1px solid',
        borderColor: 'divider',
        p: 1.5,
      }}
    >
      {/* 1. TOP BAR CONTROL DOCK */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          bgcolor: 'action.hover',
          px: 1,
          py: 0.5,
          borderRadius: 3
        }}
      >
        <IconButton onClick={() => handleChevronStep('prev')} size="small">
          <ChevronLeftIcon />
        </IconButton>

        {/* CLICKABLE TRIGGER AREA */}
        <Box
          onClick={handleOpenPicker}
          sx={{
            flex: 1,
            textAlign: 'center',
            py: 1,
            cursor: 'pointer',
            color: 'text.primary',
            '&:hover': { color: 'error.main' },
            transition: 'color 0.2s ease'
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 700, letterSpacing: '0.3px' }}>
            {formatMonthDisplay(currentMonth)}
          </Typography>
        </Box>

        <IconButton onClick={() => handleChevronStep('next')} size="small">
          <ChevronRightIcon />
        </IconButton>
      </Box>

      {/* 2. DEDICATED MATERIAL NAVIGATION POPUP DIALOG */}
      <Dialog
        open={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        sx={{
          // 💡 Targets the underlying Paper layout component directly, bypasses type checks completely
          '& .MuiDialog-paper': {
            borderRadius: 4,
            p: 2,
            width: 'calc(100% - 32px)', // Handles safe edge spacing on smaller mobile frames
            maxWidth: 320,
            mx: 2
          }
        }}
      >
        {/* YEAR SELECTION SEGMENT CONTROL */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <IconButton onClick={() => setPickerYear(prev => prev - 1)} size="small">
            <ChevronLeftIcon />
          </IconButton>
          <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary' }}>
            {pickerYear}
          </Typography>
          <IconButton onClick={() => setPickerYear(prev => prev + 1)} size="small">
            <ChevronRightIcon />
          </IconButton>
        </Box>

        {/* MONTH SELECTION MATRIX GRID (3 columns x 4 rows) */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 1.5
          }}
        >
          {months.map((monthName, idx) => {
            const isSelected = activeYear === pickerYear && (activeMonthIdx - 1) === idx;

            return (
              <Button
                key={monthName}
                variant={isSelected ? 'contained' : 'text'}
                color={isSelected ? 'error' : 'inherit'}
                onClick={() => handleSelectMonth(idx)}
                sx={{
                  py: 1.5,
                  fontWeight: isSelected ? 'bold' : 500,
                  borderRadius: 2,
                  fontSize: '0.85rem',
                  textTransform: 'none',
                  bgcolor: isSelected ? 'error.main' : 'transparent',
                  '&:hover': {
                    bgcolor: isSelected ? 'error.dark' : 'action.selected',
                  }
                }}
              >
                {monthName}
              </Button>
            );
          })}
        </Box>
      </Dialog>
    </Box>
  );
};