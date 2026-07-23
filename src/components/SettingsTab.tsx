import React, { useState } from 'react';
import { 
  Box, Card, CardContent, Typography, 
  Grid, TextField, Button, MenuItem, List, 
  ListItem, ListItemText, IconButton, Divider, Alert 
} from '@mui/material';
import { Plus, Trash2, Globe, Cloud } from 'lucide-react';
import { db, type Category } from '@/db/schema';
import { useSettings } from '@/hooks/useSettings';
import { GDriveSyncService } from '@/services/gdriveSync';

interface SettingsTabProps {
  categories: Category[];
}

export const SettingsTab: React.FC<SettingsTabProps> = ({ categories }) => {
  const { defaultCurrency, updateDefaultCurrency } = useSettings();
  const [profileName, setProfileName] = useState('Abhishek Bhatnagar');

  // Category State Values
  const [newCatName, setNewCatName] = useState('');
  const [newCatType, setNewCatType] = useState<'income' | 'expense'>('expense');
  const [newParentId, setNewParentId] = useState<string>('');

  // Google Drive Sync State
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  const syncService = GDriveSyncService.getInstance();

  // Handle Actual Google Drive SSO & Sync Flow
  const handleGoogleSync = async () => {
    setIsSyncing(true);
    setSyncError(null);
    setSyncStatus(null);

    try {
      let token = accessToken;
      if (!token) {
        token = await syncService.requestAuth();
        if (token) setAccessToken(token);
      }

      if (token) {
        setSyncStatus('Syncing database with Google Drive...');
        await syncService.exportBackupToDrive(token);
        setSyncStatus('✓ Synced with Google Drive successfully!');
      }
    } catch (err: any) {
      setSyncError(
        err?.message || 'Failed to sync with Google Drive. Ensure VITE_GOOGLE_CLIENT_ID is set in .env'
      );
    } finally {
      setIsSyncing(false);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName) return;

    await db.categories.add({
      id: crypto.randomUUID(),
      name: newCatName,
      type: newCatType,
      parentId: newParentId || undefined
    });

    setNewCatName('');
    setNewParentId('');
  };

  const handleDeleteCategory = async (id: string) => {
    if (confirm("Delete this category? Sub-categories will be unlinked.")) {
      await db.categories.delete(id);
      // Unlink sub-categories
      const children = categories.filter(c => c.parentId === id);
      for (let child of children) {
        await db.categories.update(child.id, { parentId: undefined });
      }
    }
  };

  const handleAppleMockLogin = () => {
    alert('iCloud Keychain sync coming soon!');
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {/* Global Sync Status Banners */}
      {syncError && (
        <Alert severity="error" onClose={() => setSyncError(null)} sx={{ borderRadius: '12px' }}>
          {syncError}
        </Alert>
      )}
      {syncStatus && (
        <Alert severity="success" onClose={() => setSyncStatus(null)} sx={{ borderRadius: '12px' }}>
          {syncStatus}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Profile Details & Configuration settings */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ borderRadius: '18px', border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
            <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>Profile Config</Typography>
              
              <TextField 
                label="Username" 
                value={profileName} 
                onChange={(e) => setProfileName(e.target.value)} 
                fullWidth 
              />

              <TextField
                select
                label="Base Currency"
                value={defaultCurrency}
                onChange={(e) => updateDefaultCurrency(e.target.value)}
                fullWidth
              >
                <MenuItem value="INR">INR (₹)</MenuItem>
                <MenuItem value="USD">USD ($)</MenuItem>
                <MenuItem value="EUR">EUR (€)</MenuItem>
                <MenuItem value="GBP">GBP (£)</MenuItem>
              </TextField>

              {/* Federated Login Modules */}
              <Box sx={{ mt: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1.5 }}>Account Sync Profiles</Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  <Button 
                    variant="outlined" 
                    color="inherit"
                    disabled={isSyncing}
                    startIcon={<Globe size={18} />} 
                    onClick={handleGoogleSync}
                    sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '12px', justifyContent: 'flex-start', py: 1 }}
                  >
                    {isSyncing 
                      ? 'Connecting & Syncing...' 
                      : accessToken 
                      ? '✓ Synced with Google Account' 
                      : 'Sync with Google Account'}
                  </Button>
                  <Button 
                    variant="outlined" 
                    color="inherit"
                    startIcon={<Cloud size={18} />} 
                    onClick={handleAppleMockLogin}
                    sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '12px', justifyContent: 'flex-start', py: 1 }}
                  >
                    Sync with iCloud Keychain
                  </Button>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Categories administration */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ borderRadius: '18px', border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
            <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>Manage Categories</Typography>

              {/* Add category layout block */}
              <Box component="form" onSubmit={handleAddCategory} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField 
                  label="Category Name" 
                  value={newCatName} 
                  onChange={(e) => setNewCatName(e.target.value)} 
                  required 
                  size="small" 
                  fullWidth 
                />
                
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
                  <TextField
                    select
                    label="Transaction Flow"
                    value={newCatType}
                    onChange={(e) => setNewCatType(e.target.value as 'income' | 'expense')}
                    size="small"
                    fullWidth
                  >
                    <MenuItem value="expense">Expense</MenuItem>
                    <MenuItem value="income">Income</MenuItem>
                  </TextField>

                  <TextField
                    select
                    label="Nest as Sub-category"
                    value={newParentId}
                    onChange={(e) => setNewParentId(e.target.value)}
                    size="small"
                    fullWidth
                  >
                    <MenuItem value=""><em>None (Is Root)</em></MenuItem>
                    {categories
                      .filter(c => c.type === newCatType && !c.parentId)
                      .map((c) => (
                        <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                      ))}
                  </TextField>
                </Box>

                <Button type="submit" variant="contained" startIcon={<Plus size={16} />} sx={{ borderRadius: '12px', fontWeight: 700, py: 1.2 }}>
                  Create Category
                </Button>
              </Box>

              <Divider />

              {/* Active list view */}
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>Defined Categories</Typography>
                <Box sx={{ maxHeight: '200px', overflowY: 'auto' }}>
                  <List disablePadding>
                    {categories.map((cat) => {
                      const isSub = !!cat.parentId;
                      return (
                        <ListItem 
                          key={cat.id} 
                          sx={{ 
                            py: 0.5, 
                            px: 1, 
                            pl: isSub ? 4 : 1, 
                            display: 'flex', 
                            justifyContent: 'space-between',
                            bgcolor: isSub ? 'rgba(0,0,0,0.01)' : 'transparent'
                          }}
                        >
                          <ListItemText 
                            primary={isSub ? `↳ ${cat.name}` : cat.name} 
                            secondary={cat.type.toUpperCase()} 
                            slotProps={{
                              primary: { sx: { fontWeight: isSub ? 500 : 700, fontSize: '0.85rem' } },
                              secondary: { sx: { fontSize: '0.65rem', fontWeight: 700 } }
                            }}
                          />
                          <IconButton size="small" color="error" onClick={() => handleDeleteCategory(cat.id)}>
                            <Trash2 size={14} />
                          </IconButton>
                        </ListItem>
                      );
                    })}
                  </List>
                </Box>
              </Box>

            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};