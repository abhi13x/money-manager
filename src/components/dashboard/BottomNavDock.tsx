import React from 'react';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import QueryStatsOutlinedIcon from '@mui/icons-material/QueryStatsOutlined';
import ReceiptIcon from '@mui/icons-material/Receipt';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';

// Define the expected navigation views
export type NavView = 'home' | 'transactions' | 'stats' | 'accounts';

interface BottomNavDockProps {
  currentView: NavView;
  onViewChange: (newView: NavView) => void;
}

export const BottomNavDock: React.FC<BottomNavDockProps> = ({ currentView, onViewChange }) => {
  return (
    <BottomNavigation
      showLabels
      // 💡 Map the structural parent state here
      value={currentView} 
      // 💡 The 'newValue' parameter captures the 'value' prop of the clicked Action item
      onChange={(event, newValue: NavView) => {
        onViewChange(newValue); 
      }}
      sx={{ borderTop: '1px solid', borderColor: 'divider' }}
    >
      <BottomNavigationAction label="Home" value="home" icon={<HomeOutlinedIcon />} />
      <BottomNavigationAction label="Transactions" value="transactions" icon={<ReceiptIcon />} />
      <BottomNavigationAction label="Stats" value="stats" icon={<QueryStatsOutlinedIcon />} />
      <BottomNavigationAction label="Accounts" value="accounts" icon={<AccountBalanceWalletIcon />} />
    </BottomNavigation>
  );
};