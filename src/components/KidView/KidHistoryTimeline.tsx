import React from 'react';
import { CashTransaction } from '../../types/finance';
import { Sparkles, Calendar, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { format, isToday, isYesterday, parseISO } from 'date-fns';

interface KidHistoryTimelineProps {
  transactions: CashTransaction[];
  girlName: string;
}

export const KidHistoryTimeline: React.FC<KidHistoryTimelineProps> = ({
  transactions,
  girlName,
}) => {
  const sorted = [...transactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const formatFriendlyDate = (dateStr: string) => {
    try {
      const date = parseISO(dateStr);
      if (isToday(date)) return 'Today ⭐';
      if (isYesterday(date)) return 'Yesterday 💫';
      return format(date, 'MMM d, yyyy');
    } catch {
      return dateStr;
    }
  };

  if (sorted.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-8 border border-amber-100 text-center shadow-xs">
        <div className="text-4xl mb-2">🎁</div>
        <h4 className="font-heading font-bold text-slate-700 text-base">No cash adventures yet!</h4>
        <p className="text-xs text-slate-500 mt-1">
          When {girlName} earns allowance or buys treats, your parent will record the fun here!
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white/80 backdrop-blur-xs rounded-3xl p-5 sm:p-6 border border-amber-100/80 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">📖</span>
          <h3 className="font-heading font-bold text-lg text-slate-800">My Spending & Earning Story</h3>
        </div>
        <span className="text-xs font-semibold text-slate-500 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200/50">
          {sorted.length} {sorted.length === 1 ? 'activity' : 'activities'}
        </span>
      </div>

      <div className="space-y-3">
        {sorted.map((tx) => {
          const isDeposit = tx.type === 'deposit';

          return (
            <div
              key={tx.id}
              className={`flex items-center justify-between p-3.5 sm:p-4 rounded-2xl border transition-all duration-200 ${
                isDeposit
                  ? 'bg-gradient-to-r from-emerald-50/70 to-teal-50/40 border-emerald-200/70 hover:border-emerald-300'
                  : 'bg-gradient-to-r from-rose-50/70 to-orange-50/40 border-rose-200/70 hover:border-rose-300'
              }`}
            >
              {/* Category Icon & Details */}
              <div className="flex items-center gap-3">
                <div
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center text-2xl shadow-2xs ${
                    isDeposit ? 'bg-emerald-100/90' : 'bg-rose-100/90'
                  }`}
                >
                  {tx.categoryEmoji || (isDeposit ? '💵' : '🛍️')}
                </div>
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-heading font-bold text-sm text-slate-800">
                      {tx.category}
                    </span>
                    <span className="text-[11px] text-slate-400 flex items-center gap-0.5">
                      <Calendar className="w-3 h-3" />
                      {formatFriendlyDate(tx.date)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 font-medium line-clamp-1 mt-0.5">
                    {tx.description || (isDeposit ? 'Earned cash' : 'Spent cash')}
                  </p>
                </div>
              </div>

              {/* Amount Badge */}
              <div className="text-right shrink-0">
                <div
                  className={`inline-flex items-center gap-1 font-heading font-bold text-base px-3 py-1 rounded-xl shadow-2xs ${
                    isDeposit
                      ? 'bg-emerald-500 text-white'
                      : 'bg-rose-500 text-white'
                  }`}
                >
                  {isDeposit ? (
                    <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4 stroke-[2.5]" />
                  )}
                  <span>
                    {isDeposit ? '+' : '-'}${tx.amount.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
