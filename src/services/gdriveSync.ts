/**
 * GDriveSyncService
 * 
 * Implements 100% client-side synchronization using the Google Drive API 
 * and the 'appDataFolder' scope to ensure user privacy.
 */

import { db } from '../db/schema';

const G_DRIVE_SCOPES = 'https://www.googleapis.com/auth/drive.appdata';
const BACKUP_FILENAME = getBackupFileName();;

function getBackupFileName(): string {
  const now = new Date();

  // Extract components
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
  const year = String(now.getFullYear());
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const milliseconds = String(now.getMilliseconds()).padStart(3, '0');

  // Combined string matching: DDMMYYYY_HHMMSSmmm
  return `BKP_${day}${month}${year}_${hours}${minutes}${seconds}${milliseconds}`;
}

export class GDriveSyncService {
  private static instance: GDriveSyncService;

  private constructor() {}

  public static getInstance(): GDriveSyncService {
    if (!GDriveSyncService.instance) {
      GDriveSyncService.instance = new GDriveSyncService();
    }
    return GDriveSyncService.instance;
  }

  /**
   * Initializes the OAuth2 implicit flow.
   * Requires the Google Identity Services library to be loaded in index.html
   */
  async requestAuth(): Promise<string | null> {
    return new Promise((resolve, reject) => {
      try {
        const client = (window as any).google.accounts.oauth2.initTokenClient({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
          scope: G_DRIVE_SCOPES,
          callback: (response: any) => {
            if (response.error) {
              reject(response.error);
              resolve(null);
            } else {
              resolve(response.access_token);
            }
          },
        });

        client.requestAccessToken();
      } catch (error) {
        console.error('OAuth initialization failed:', error);
        reject(error);
        resolve(null);
      }
    });
  }

  /**
   * Exports all local data and uploads it to the hidden appDataFolder.
   */
  async exportBackupToDrive(token: string): Promise<void> {
    try {
      // 1. Serialize existing schema tables
      const data = {
        accounts: await db.accounts.toArray(),
        transactions: await db.transactions.toArray(),
        categories: await db.categories.toArray(),
        exportedAt: new Date().toISOString(),
      };
      const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });

      // 2. Check if backup already exists in appDataFolder
      const existingFile = await this.findBackupFile(token);

      if (existingFile) {
        // Update existing file
        await this.updateFile(token, existingFile.id, blob);
      } else {
        // Create new file
        await this.createFile(token, blob);
      }
    } catch (error) {
      this.handleSyncError(error);
      throw error;
    }
  }

  /**
   * Downloads backup.json and re-populates the Dexie database.
   */
  async importBackupFromDrive(token: string): Promise<void> {
    try {
      const existingFile = await this.findBackupFile(token);
      if (!existingFile) throw new Error('No backup found on Google Drive');

      const response = await fetch(`https://www.googleapis.com/drive/v3/files/${existingFile.id}?alt=media`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to download backup');

      const data = await response.json();

      // Rehydrate Dexie atomically using only valid schema tables
      await db.transaction('rw', [db.accounts, db.transactions, db.categories], async () => {
        await db.accounts.clear();
        await db.transactions.clear();
        await db.categories.clear();

        if (data.accounts) await db.accounts.bulkAdd(data.accounts);
        if (data.transactions) await db.transactions.bulkAdd(data.transactions);
        if (data.categories) await db.categories.bulkAdd(data.categories);
      });
    } catch (error) {
      this.handleSyncError(error);
      throw error;
    }
  }

  private async findBackupFile(token: string) {
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=name='${BACKUP_FILENAME}' and 'appDataFolder' in parents`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const result = await response.json();
    return result.files?.[0] || null;
  }

  private async createFile(token: string, blob: Blob) {
    const metadata = {
      name: BACKUP_FILENAME,
      parents: ['appDataFolder'],
    };

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', blob);

    await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });
  }

  private async updateFile(token: string, fileId: string, blob: Blob) {
    await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
      method: 'PATCH',
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: blob,
    });
  }

  private handleSyncError(error: any) {
    if (error.status === 401) {
      console.error('Sync failed: Token expired. Please re-authenticate.');
    } else if (!window.navigator.onLine) {
      console.error('Sync failed: You are currently offline.');
    } else {
      console.error('Sync error:', error);
    }
  }
}