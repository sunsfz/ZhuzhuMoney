import React, { useState } from 'react';
import { CashTransaction, GirlProfile, SavingsGoal, SavingsSnapshot, THEME_STYLES } from '../../types/finance';
import { CashBookkeeping } from './CashBookkeeping';
import { SavingsBookkeeping } from './SavingsBookkeeping';
import { GoalsBookkeeping } from './GoalsBookkeeping';
import { Wallet, Landmark, Target, Sparkles, BookOpen } from 'lucide-react';
import { playPopSound } from '../../utils/audio';
import { calculateCashBalance, getLatestSavingsBalance } from '../../services/storage';

interface ParentDashboardProps {
  girl: GirlProfile;
  transactions: CashTransaction[];
  savingsSnapshots: SavingsSnapshot[];
  goals: SavingsGoal[];
  onAddTransaction: () => void;
  onEditTransaction: (tx: CashTransaction) => void;
  onDeleteTransaction: (id: string) => void;
  onAddSavingsSnapshot: () => void;
  onEditSavingsSnapshot: (snapshot: SavingsSnapshot) => void;
  onDeleteSavingsSnapshot: (id: string) => void;
  onAddGoal: () => void;
  onEditGoal: (goal: SavingsGoal) => void;
  onDeleteGoal: (id: string) => void;
  onToggleGoalComplete: (id: string) => void;
}

type TabType = 'cash' | 'savings' | 'goals';

export const ParentDashboard: React.FC<ParentDashboardProps> = ({
  girl,
  transactions,
  savingsSnapshots,
  goals,
  onAddTransaction,
  onEditTransaction,
  onDeleteTransaction,
  onAddSavingsSnapshot,
  onEditSavingsSnapshot,
  onDeleteSavingsSnapshot,
  onAddGoal,
  onEditGoal,
  onDeleteGoal,
  onToggleGoalComplete,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('cash');

  const cashBalance = calculateCashBalance(girl.id, transactions);
  const latestSavings = getLatestSavingsBalance(girl.id, savingsSnapshots);
  const totalTreasure = cashBalance + latestSavings.balance;

  const handleTabChange = (tab: TabType) => {
    playPopSound();
    setActiveTab(tab);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Banner Overview for Selected Girl */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-14 h-14 rounded-2xl bg-amber-100/80 flex items-center justify-center text-3xl shadow-inner">
            {girl.avatarEmoji}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-heading font-extrabold text-2xl text-slate-800 tracking-tight">
                {girl.name}'s Financial Accounts
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Cash Ledger: <span className="font-bold text-emerald-600">${cashBalance.toFixed(2)}</span> &bull; Custodial Savings: <span className="font-bold text-purple-600">${latestSavings.balance.toFixed(2)}</span>
            </p>
          </div>
        </div>

        <div className="bg-slate-50 px-4 py-2 rounded-2xl border border-slate-200 flex items-center gap-3">
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400">Total Net Worth</div>
            <div className="font-heading font-black text-xl text-slate-800">
              ${totalTreasure.toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200/70 overflow-x-auto">
        <button
          onClick={() => handleTabChange('cash')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-heading font-bold text-sm transition cursor-pointer shrink-0 ${
            activeTab === 'cash'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <Wallet className="w-4 h-4" />
          <span>Cash Notebook Ledger</span>
        </button>

        <button
          onClick={() => handleTabChange('savings')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-heading font-bold text-sm transition cursor-pointer shrink-0 ${
            activeTab === 'savings'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <Landmark className="w-4 h-4" />
          <span>Custodial Savings (Real Bank)</span>
        </button>

        <button
          onClick={() => handleTabChange('goals')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-heading font-bold text-sm transition cursor-pointer shrink-0 ${
            activeTab === 'goals'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <Target className="w-4 h-4" />
          <span>Wishlist & Goals</span>
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'cash' && (
        <CashBookkeeping
          girl={girl}
          transactions={transactions}
          onAddTransaction={onAddTransaction}
          onEditTransaction={onEditTransaction}
          onDeleteTransaction={onDeleteTransaction}
        />
      )}

      {activeTab === 'savings' && (
        <SavingsBookkeeping
          girl={girl}
          snapshots={savingsSnapshots}
          onAddSnapshot={onAddSavingsSnapshot}
          onEditSnapshot={onEditSavingsSnapshot}
          onDeleteSnapshot={onDeleteSavingsSnapshot}
        />
      )}

      {activeTab === 'goals' && (
        <GoalsBookkeeping
          girl={girl}
          goals={goals}
          cashBalance={cashBalance}
          onAddGoal={onAddGoal}
          onEditGoal={onEditGoal}
          onDeleteGoal={onDeleteGoal}
          onToggleGoalComplete={onToggleGoalComplete}
        />
      )}
    </div>
  );
};
