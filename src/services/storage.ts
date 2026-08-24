import { AppData, CashTransaction, GirlProfile, SavingsGoal, SavingsSnapshot } from '../types/finance';
import { pushToGoogleSheet } from './googleSheetsSync';

const STORAGE_KEY = 'zhuzhu_money_data_v3';
const SHEET_URL_KEY = 'zhuzhu_google_sheet_url_v3';

export const DEFAULT_GOOGLE_SHEET_URL = 'https://script.google.com/macros/s/AKfycbxiGiaOZWkVmeYEfQnQfBGnC4KUfvfYm7fxRuKsMZkoT1Q5VkgKdogP3ph3286M0pja/exec';

export const INITIAL_DATA: AppData = {
  girls: [
    {
      id: 'girl_1',
      name: 'Jessie',
      avatarEmoji: '👧🏻',
      themeColor: 'pink',
      birthday: '2016-01-01', // 10 years old, long hair
    },
    {
      id: 'girl_2',
      name: 'Raina',
      avatarEmoji: '🧒🏻',
      themeColor: 'purple',
      birthday: '2018-01-01', // 8 years old, shorter hair
    },
  ],
  transactions: [],
  savingsSnapshots: [],
  goals: [],
  parentPin: '0518',
  googleSheetScriptUrl: DEFAULT_GOOGLE_SHEET_URL,
};

export const loadAppData = (): AppData => {
  try {
    let persistentUrl = '';
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const syncParam = urlParams.get('sync');
      if (syncParam) {
        persistentUrl = decodeURIComponent(syncParam);
        localStorage.setItem(SHEET_URL_KEY, persistentUrl);
      } else {
        persistentUrl = localStorage.getItem(SHEET_URL_KEY) || '';
      }
    }

    const envUrl = (import.meta as unknown as { env?: { VITE_GOOGLE_SHEET_URL?: string } }).env?.VITE_GOOGLE_SHEET_URL || '';
    const activeUrl = persistentUrl || envUrl || DEFAULT_GOOGLE_SHEET_URL;

    const rawV3 = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    if (!rawV3) {
      const cleanInitial = {
        ...INITIAL_DATA,
        parentPin: '0518',
        googleSheetScriptUrl: activeUrl,
      };
      return cleanInitial;
    }
    const parsed = JSON.parse(rawV3);
    
    // Discard old deprecated URLs if present
    const cleanUrl = (parsed.googleSheetScriptUrl && parsed.googleSheetScriptUrl.includes('AKfycbxj_2KU0Ds_'))
      ? DEFAULT_GOOGLE_SHEET_URL
      : (parsed.googleSheetScriptUrl || activeUrl);

    return {
      ...INITIAL_DATA,
      ...parsed,
      parentPin: parsed.parentPin || '0518',
      googleSheetScriptUrl: cleanUrl,
    };
  } catch (err) {
    console.error('Failed to load app data from localStorage', err);
    return INITIAL_DATA;
  }
};

export const saveAppData = (data: AppData, shouldPushToCloud = false): void => {
  try {
    const updated = {
      ...data,
      lastSyncTimestamp: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    if (updated.googleSheetScriptUrl) {
      localStorage.setItem(SHEET_URL_KEY, updated.googleSheetScriptUrl);
      if (shouldPushToCloud) {
        pushToGoogleSheet(updated.googleSheetScriptUrl, updated).catch(err => {
          console.warn('Auto-sync to Google Sheet failed:', err);
        });
      }
    }
  } catch (err) {
    console.error('Failed to save app data to localStorage', err);
  }
};

export const calculateCashBalance = (girlId: string, transactions: CashTransaction[]): number => {
  return transactions
    .filter(t => t.girlId === girlId)
    .reduce((sum, t) => (t.type === 'deposit' ? sum + t.amount : sum - t.amount), 0);
};

export const getLatestSavingsBalance = (girlId: string, snapshots: SavingsSnapshot[]): { balance: number; date: string; note?: string } => {
  const girlSnapshots = snapshots
    .filter(s => s.girlId === girlId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (girlSnapshots.length === 0) {
    return { balance: 0, date: new Date().toISOString().split('T')[0] };
  }

  return {
    balance: girlSnapshots[0].balance,
    date: girlSnapshots[0].date,
    note: girlSnapshots[0].note,
  };
};

export const getSavingsGrowth = (girlId: string, snapshots: SavingsSnapshot[]): { initial: number; current: number; change: number; percent: number } => {
  const girlSnapshots = snapshots
    .filter(s => s.girlId === girlId)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  if (girlSnapshots.length < 2) {
    const bal = girlSnapshots[0]?.balance || 0;
    return { initial: bal, current: bal, change: 0, percent: 0 };
  }

  const initial = girlSnapshots[0].balance;
  const current = girlSnapshots[girlSnapshots.length - 1].balance;
  const change = current - initial;
  const percent = initial > 0 ? (change / initial) * 100 : 0;

  return { initial, current, change, percent };
};

export const exportDataAsJSON = (data: AppData) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const dateStr = new Date().toISOString().split('T')[0];
  a.href = url;
  a.download = `zhuzhu-money-backup-${dateStr}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const importDataFromJSON = async (file: File): Promise<AppData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = JSON.parse(text);
        if (!parsed.girls || !Array.isArray(parsed.girls)) {
          throw new Error('Invalid backup file format');
        }
        resolve(parsed as AppData);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
};
