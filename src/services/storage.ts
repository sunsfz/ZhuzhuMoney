import { AppData, CashTransaction, GirlProfile, SavingsGoal, SavingsSnapshot } from '../types/finance';
import { pushToGoogleSheet } from './googleSheetsSync';

const STORAGE_KEY = 'zhuzhu_money_data_v2';
const SHEET_URL_KEY = 'zhuzhu_google_sheet_url';

export const DEFAULT_GOOGLE_SHEET_URL = 'https://script.google.com/macros/s/AKfycbxj_2KU0Ds_Kd4VuXQlD_ZjVyQAeNxU6SFrZZrdIOJ8tqMobuAox9YBe3QeURpLBmP5/exec';

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
      name: 'Rains',
      avatarEmoji: '🧒🏻',
      themeColor: 'purple',
      birthday: '2018-01-01', // 8 years old, shorter hair
    },
  ],
  transactions: [
    // Jessie's Cash Starting Balance ($66.00)
    {
      id: 'tx_jessie_init',
      girlId: 'girl_1',
      type: 'deposit',
      amount: 66.00,
      category: 'Allowance',
      categoryEmoji: '💵',
      description: 'Starting cash pocket balance',
      date: '2026-08-24',
      createdAt: '2026-08-24T10:00:00.000Z',
    },

    // Rains' Cash Starting Balance ($126.00)
    {
      id: 'tx_rains_init',
      girlId: 'girl_2',
      type: 'deposit',
      amount: 126.00,
      category: 'Allowance',
      categoryEmoji: '💵',
      description: 'Starting cash pocket balance',
      date: '2026-08-24',
      createdAt: '2026-08-24T10:00:00.000Z',
    },
  ],
  savingsSnapshots: [
    // Jessie's Custodial Savings Checkpoint ($100.00)
    {
      id: 'sav_jessie_init',
      girlId: 'girl_1',
      balance: 100.00,
      date: '2026-08-24',
      note: 'Initial custodial account balance',
      createdAt: '2026-08-24T10:00:00.000Z',
    },

    // Rains' Custodial Savings Checkpoint ($100.00)
    {
      id: 'sav_rains_init',
      girlId: 'girl_2',
      balance: 100.00,
      date: '2026-08-24',
      note: 'Initial custodial account balance',
      createdAt: '2026-08-24T10:00:00.000Z',
    },
  ],
  goals: [], // No wishlist items to start
  parentPin: '0518',
  googleSheetScriptUrl: DEFAULT_GOOGLE_SHEET_URL,
};

export const loadAppData = (): AppData => {
  try {
    // Check URL param first (e.g. ?sync=https://script.google.com/...)
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

    const rawV2 = localStorage.getItem(STORAGE_KEY);
    if (!rawV2) {
      const cleanInitial = {
        ...INITIAL_DATA,
        parentPin: '0518',
        googleSheetScriptUrl: activeUrl,
      };
      saveAppData(cleanInitial);
      return cleanInitial;
    }
    const parsed = JSON.parse(rawV2);
    return {
      ...INITIAL_DATA,
      ...parsed,
      parentPin: parsed.parentPin || '0518',
      googleSheetScriptUrl: parsed.googleSheetScriptUrl || activeUrl,
    };
  } catch (err) {
    console.error('Failed to load app data from localStorage', err);
    return INITIAL_DATA;
  }
};

export const saveAppData = (data: AppData): void => {
  try {
    const updated = {
      ...data,
      lastSyncTimestamp: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    if (updated.googleSheetScriptUrl) {
      localStorage.setItem(SHEET_URL_KEY, updated.googleSheetScriptUrl);
      pushToGoogleSheet(updated.googleSheetScriptUrl, updated).catch(err => {
        console.warn('Auto-sync to Google Sheet failed:', err);
      });
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
