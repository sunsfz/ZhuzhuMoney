import React from 'react';
import { CashTransaction, GirlProfile, SavingsGoal, SavingsSnapshot, THEME_STYLES } from '../../types/finance';
import { PiggyBankInteractive } from './PiggyBankInteractive';
import { KidHistoryTimeline } from './KidHistoryTimeline';
import { KidGoalsList } from './KidGoalsList';
import { WealthGrowthChart } from '../WealthGrowthChart';
import { Wallet, Landmark, Sparkles, Calendar } from 'lucide-react';
import { calculateCashBalance, getLatestSavingsBalance } from '../../services/storage';

interface KidDashboardProps {
  girl: GirlProfile;
  transactions: CashTransaction[];
  savingsSnapshots: SavingsSnapshot[];
  goals: SavingsGoal[];
  onAddGoalClick?: () => void;
}

export const KidDashboard: React.FC<KidDashboardProps> = ({
  girl,
  transactions,
  savingsSnapshots,
  goals,
  onAddGoalClick,
}) => {
  const theme = THEME_STYLES[girl.themeColor || 'pink'];
  const cashBalance = calculateCashBalance(girl.id, transactions);
  const latestSavings = getLatestSavingsBalance(girl.id, savingsSnapshots);
  const totalTreasure = cashBalance + latestSavings.balance;
  const girlGoals = goals.filter(g => g.girlId === girl.id);
  const girlTransactions = transactions.filter(t => t.girlId === girl.id);

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Banner Greeting */}
      <div className={`p-6 sm:p-8 rounded-3xl bg-gradient-to-r ${theme.gradient} text-white shadow-lg relative overflow-hidden`}>
        {/* Floating decorative emojis */}
        <div className="absolute top-2 right-4 text-3xl opacity-30 select-none animate-float-soft">
          ⭐
        </div>
        <div className="absolute bottom-2 right-20 text-2xl opacity-20 select-none animate-pulse-gentle">
          ✨
        </div>

        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-3xl bg-white/20 backdrop-blur-md flex items-center justify-center text-4xl shadow-inner border border-white/30">
              {girl.avatarEmoji}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-heading font-extrabold text-2xl sm:text-3xl tracking-tight">
                  Hi {girl.name}!
                </h2>
                <span className="text-xl">🌸</span>
              </div>
              <p className="text-white/90 text-sm font-medium mt-0.5">
                Here is your treasure chest & savings adventure!
              </p>
            </div>
          </div>

          <div className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/30 flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-amber-200 animate-spin" style={{ animationDuration: '6s' }} />
            <div>
              <div className="text-[10px] uppercase font-bold tracking-wider text-white/80">Total Wealth</div>
              <div className="font-heading font-black text-xl text-white">
                ${totalTreasure.toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Interactive Piggy + Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        {/* Left Column: Piggy Bank */}
        <div className="md:col-span-5 flex flex-col">
          <PiggyBankInteractive
            cashBalance={cashBalance}
            savingsBalance={latestSavings.balance}
            girlName={girl.name}
            themeColor={girl.themeColor}
          />
        </div>

        {/* Right Column: 2 Big Cheerful Cards (Pocket Cash & Custodial Savings) */}
        <div className="md:col-span-7 flex flex-col justify-between gap-4">
          {/* Pocket Cash Card */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white border-2 border-emerald-200/90 shadow-sm relative overflow-hidden transition hover:shadow-md">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
                    <Wallet className="w-5 h-5" />
                  </span>
                  <span className="font-heading font-bold text-slate-600 text-sm">
                    Pocket Cash (Virtual Ledger)
                  </span>
                </div>
                <div className="font-heading font-black text-3xl sm:text-4xl text-emerald-600 mt-2 tracking-tight">
                  ${cashBalance.toFixed(2)}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  💵 Spendable money held by parent for snacks, books, and treats!
                </p>
              </div>

              <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-2xl">
                💰
              </div>
            </div>
          </div>

          {/* Custodial Savings Card */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white border-2 border-purple-200/90 shadow-sm relative overflow-hidden transition hover:shadow-md">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-purple-100 text-purple-700">
                    <Landmark className="w-5 h-5" />
                  </span>
                  <span className="font-heading font-bold text-slate-600 text-sm">
                    Custodial Savings (Real Bank)
                  </span>
                </div>
                <div className="font-heading font-black text-3xl sm:text-4xl text-purple-600 mt-2 tracking-tight">
                  ${latestSavings.balance.toFixed(2)}
                </div>
                <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                  <span className="flex items-center gap-1 font-medium">
                    <Calendar className="w-3 h-3 text-purple-400" />
                    Last updated: {latestSavings.date}
                  </span>
                  {latestSavings.note && (
                    <span className="truncate max-w-[180px] bg-purple-50 px-2 py-0.5 rounded-md text-purple-700 text-[11px]">
                      {latestSavings.note}
                    </span>
                  )}
                </div>
              </div>

              <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center text-2xl">
                🏦
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Wealth Growth Chart & Time Filter */}
      <WealthGrowthChart
        girl={girl}
        transactions={transactions}
        savingsSnapshots={savingsSnapshots}
      />

      {/* Wishlist & Goals Section */}
      <KidGoalsList
        goals={girlGoals}
        cashBalance={cashBalance}
        girlName={girl.name}
        onAddGoalClick={onAddGoalClick}
      />

      {/* Illustrated Story Activity Feed */}
      <KidHistoryTimeline
        transactions={girlTransactions}
        girlName={girl.name}
      />
    </div>
  );
};
