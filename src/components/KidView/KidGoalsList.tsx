import React from 'react';
import { SavingsGoal } from '../../types/finance';
import { Sparkles, Trophy, CheckCircle2, Target, Plus } from 'lucide-react';
import confetti from 'canvas-confetti';
import { playFanfareSound, playPopSound } from '../../utils/audio';

interface KidGoalsListProps {
  goals: SavingsGoal[];
  cashBalance: number;
  girlName: string;
  onAddGoalClick?: () => void;
}

export const KidGoalsList: React.FC<KidGoalsListProps> = ({
  goals,
  cashBalance,
  girlName,
  onAddGoalClick,
}) => {
  const handleGoalCheer = () => {
    playFanfareSound();
    confetti({
      particleCount: 50,
      spread: 70,
      origin: { y: 0.7 },
      colors: ['#38BDF8', '#F472B6', '#FBBF24', '#34D399', '#A78BFA'],
    });
  };

  return (
    <div className="bg-white/80 backdrop-blur-xs rounded-3xl p-5 sm:p-6 border border-amber-100/80 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">🎯</span>
          <div>
            <h3 className="font-heading font-bold text-lg text-slate-800">My Wishlist & Savings Goals</h3>
            <p className="text-xs text-slate-500">Items {girlName} is saving up to unlock!</p>
          </div>
        </div>

        {onAddGoalClick && (
          <button
            onClick={() => {
              playPopSound();
              onAddGoalClick();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-heading font-bold bg-amber-100 text-amber-800 hover:bg-amber-200 transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Wish</span>
          </button>
        )}
      </div>

      {goals.length === 0 ? (
        <div className="text-center py-6 bg-amber-50/50 rounded-2xl border border-dashed border-amber-200">
          <div className="text-3xl mb-1">🌟</div>
          <p className="font-heading font-semibold text-sm text-slate-600">No wishlist items added yet</p>
          <p className="text-xs text-slate-400 mt-0.5">What is {girlName} dreaming of saving for?</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {goals.map((goal) => {
            const progress = Math.min(100, Math.max(0, (cashBalance / goal.targetAmount) * 100));
            const isAffordable = cashBalance >= goal.targetAmount || goal.completed;
            const remaining = Math.max(0, goal.targetAmount - cashBalance);

            return (
              <div
                key={goal.id}
                onClick={isAffordable ? handleGoalCheer : undefined}
                className={`p-4 rounded-2xl border transition-all duration-300 relative overflow-hidden ${
                  isAffordable
                    ? 'bg-gradient-to-tr from-amber-50 to-emerald-50 border-emerald-300 shadow-sm cursor-pointer hover:scale-[1.02]'
                    : 'bg-white border-slate-200/80 shadow-2xs'
                }`}
              >
                {isAffordable && (
                  <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 bg-emerald-500 text-white rounded-full text-[10px] font-bold shadow-xs animate-pulse-gentle">
                    <Trophy className="w-3 h-3" />
                    <span>Unlocked! 🎉</span>
                  </div>
                )}

                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-100/80 flex items-center justify-center text-2xl shrink-0 shadow-2xs">
                    {goal.emoji || '🎁'}
                  </div>

                  <div className="flex-1 min-w-0 pr-12">
                    <h4 className="font-heading font-bold text-sm text-slate-800 truncate">
                      {goal.title}
                    </h4>
                    {goal.notes && (
                      <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{goal.notes}</p>
                    )}

                    <div className="flex items-baseline gap-1 mt-1 font-heading">
                      <span className="font-bold text-sm text-slate-800">
                        ${cashBalance.toFixed(2)}
                      </span>
                      <span className="text-xs text-slate-400">/ ${goal.targetAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-3">
                  <div className="w-full bg-slate-100 rounded-full h-3.5 p-0.5 border border-slate-200/60 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        isAffordable
                          ? 'bg-gradient-to-r from-emerald-400 to-teal-500'
                          : 'bg-gradient-to-r from-amber-400 to-orange-400'
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-medium text-slate-500 mt-1.5">
                    <span>{progress.toFixed(0)}% Saved</span>
                    <span>
                      {isAffordable ? (
                        <span className="text-emerald-600 font-bold">Ready to purchase! ✨</span>
                      ) : (
                        `$${remaining.toFixed(2)} to go!`
                      )}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
