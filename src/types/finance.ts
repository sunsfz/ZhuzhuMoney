export type ThemeColor = 'pink' | 'purple' | 'mint' | 'peach' | 'sky' | 'sun';

export interface GirlProfile {
  id: string;
  name: string;
  avatarEmoji: string;
  themeColor: ThemeColor;
  birthday?: string;
}

export type TransactionType = 'deposit' | 'spent';

export interface CashTransaction {
  id: string;
  girlId: string;
  type: TransactionType;
  amount: number;
  category: string;
  categoryEmoji: string;
  description: string;
  date: string; // YYYY-MM-DD
  createdAt: string; // ISO String
}

export interface SavingsSnapshot {
  id: string;
  girlId: string;
  balance: number;
  date: string; // YYYY-MM-DD
  note?: string;
  createdAt: string; // ISO String
}

export interface SavingsGoal {
  id: string;
  girlId: string;
  title: string;
  targetAmount: number;
  emoji: string;
  completed: boolean;
  notes?: string;
  targetDate?: string;
}

export interface AppData {
  girls: GirlProfile[];
  transactions: CashTransaction[];
  savingsSnapshots: SavingsSnapshot[];
  goals: SavingsGoal[];
  parentPin: string;
  googleSheetScriptUrl?: string;
  lastSyncTimestamp?: string;
}

export interface CategoryOption {
  name: string;
  emoji: string;
  type: TransactionType | 'both';
  color: string;
}

export const CATEGORY_PRESETS: CategoryOption[] = [
  // Deposits (Earned / Gifted)
  { name: 'Allowance', emoji: '💵', type: 'deposit', color: 'bg-emerald-100 text-emerald-700' },
  { name: 'Chores & Help', emoji: '🧹', type: 'deposit', color: 'bg-teal-100 text-teal-700' },
  { name: 'Birthday / Holiday Gift', emoji: '🎁', type: 'deposit', color: 'bg-pink-100 text-pink-700' },
  { name: 'Tooth Fairy', emoji: '🧚‍♀️', type: 'deposit', color: 'bg-purple-100 text-purple-700' },
  { name: 'Great Grades & Star Work', emoji: '⭐', type: 'deposit', color: 'bg-amber-100 text-amber-700' },
  { name: 'Small Business / Lemonade', emoji: '🍋', type: 'deposit', color: 'bg-yellow-100 text-yellow-700' },
  { name: 'Other Deposit', emoji: '💰', type: 'deposit', color: 'bg-lime-100 text-lime-700' },

  // Spent (Expenses)
  { name: 'Ice Cream & Boba', emoji: '🍦', type: 'spent', color: 'bg-rose-100 text-rose-700' },
  { name: 'Toys & Dolls', emoji: '🧸', type: 'spent', color: 'bg-orange-100 text-orange-700' },
  { name: 'Books & Manga', emoji: '📚', type: 'spent', color: 'bg-blue-100 text-blue-700' },
  { name: 'Treats & Snacks', emoji: '🍩', type: 'spent', color: 'bg-amber-100 text-amber-700' },
  { name: 'Games & Apps', emoji: '🎮', type: 'spent', color: 'bg-indigo-100 text-indigo-700' },
  { name: 'Clothes & Accessories', emoji: '👗', type: 'spent', color: 'bg-fuchsia-100 text-fuchsia-700' },
  { name: 'Crafts & Art Supplies', emoji: '🎨', type: 'spent', color: 'bg-violet-100 text-violet-700' },
  { name: 'Outing & Movies', emoji: '🍿', type: 'spent', color: 'bg-cyan-100 text-cyan-700' },
  { name: 'School Supplies', emoji: '🎒', type: 'spent', color: 'bg-sky-100 text-sky-700' },
  { name: 'Other Spent', emoji: '🛍️', type: 'spent', color: 'bg-red-100 text-red-700' },
];

export const THEME_STYLES: Record<ThemeColor, {
  primary: string;
  secondary: string;
  bgLight: string;
  badge: string;
  border: string;
  accent: string;
  gradient: string;
}> = {
  pink: {
    primary: 'bg-pink-500 hover:bg-pink-600 text-white',
    secondary: 'bg-pink-100 text-pink-700 border-pink-200',
    bgLight: 'bg-pink-50/70',
    badge: 'bg-pink-100 text-pink-800',
    border: 'border-pink-300',
    accent: 'text-pink-500',
    gradient: 'from-pink-400 via-rose-400 to-pink-500',
  },
  purple: {
    primary: 'bg-purple-500 hover:bg-purple-600 text-white',
    secondary: 'bg-purple-100 text-purple-700 border-purple-200',
    bgLight: 'bg-purple-50/70',
    badge: 'bg-purple-100 text-purple-800',
    border: 'border-purple-300',
    accent: 'text-purple-500',
    gradient: 'from-purple-400 via-violet-400 to-purple-500',
  },
  mint: {
    primary: 'bg-emerald-500 hover:bg-emerald-600 text-white',
    secondary: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    bgLight: 'bg-emerald-50/70',
    badge: 'bg-emerald-100 text-emerald-800',
    border: 'border-emerald-300',
    accent: 'text-emerald-500',
    gradient: 'from-emerald-400 via-teal-400 to-teal-500',
  },
  peach: {
    primary: 'bg-orange-400 hover:bg-orange-500 text-white',
    secondary: 'bg-orange-100 text-orange-700 border-orange-200',
    bgLight: 'bg-orange-50/70',
    badge: 'bg-orange-100 text-orange-800',
    border: 'border-orange-300',
    accent: 'text-orange-500',
    gradient: 'from-orange-400 via-amber-400 to-orange-500',
  },
  sky: {
    primary: 'bg-sky-500 hover:bg-sky-600 text-white',
    secondary: 'bg-sky-100 text-sky-700 border-sky-200',
    bgLight: 'bg-sky-50/70',
    badge: 'bg-sky-100 text-sky-800',
    border: 'border-sky-300',
    accent: 'text-sky-500',
    gradient: 'from-sky-400 via-cyan-400 to-blue-500',
  },
  sun: {
    primary: 'bg-amber-500 hover:bg-amber-600 text-white',
    secondary: 'bg-amber-100 text-amber-800 border-amber-200',
    bgLight: 'bg-amber-50/70',
    badge: 'bg-amber-100 text-amber-800',
    border: 'border-amber-300',
    accent: 'text-amber-500',
    gradient: 'from-amber-400 via-yellow-400 to-amber-500',
  },
};
