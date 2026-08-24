import React from 'react';
import { GirlProfile, SavingsGoal } from '../../types/finance';
import { Plus, Target, Trash2, Edit2, CheckCircle2, Circle } from 'lucide-react';
import { playFanfareSound, playPopSound, playSpendSound } from '../../utils/audio';

interface GoalsBookkeepingProps {
  girl: GirlProfile;
  goals: SavingsGoal[];
  cashBalance: number;
  onAddGoal: () => void;
  onEditGoal: (goal: SavingsGoal) => void;
  onDeleteGoal: (id: string) => void;
  onToggleGoalComplete: (id: string) => void;
}

export const GoalsBookkeeping: React.FC<GoalsBookkeepingProps> = ({
  girl,
  goals,
  cashBalance,
  onAddGoal,
  onEditGoal,
  onDeleteGoal,
  onToggleGoalComplete,
}) => {
  const girlGoals = goals.filter((g) => g.girlId === girl.id);

  const handleDelete = (id: string, title: string) => {
    if (window.confirm(`Delete goal "${title}"?`)) {
      playSpendSound();
      onDeleteGoal(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-amber-100 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-heading font-bold text-xl text-slate-800">
              Wishlist & Savings Goals ({girl.name})
            </h3>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
              Milestone Targets
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Help {girl.name} set tangible goals to encourage saving habits.
          </p>
        </div>

        <button
          onClick={() => {
            playPopSound();
            onAddGoal();
          }}
          className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl font-heading font-bold text-sm bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white shadow-md hover:shadow-lg transition cursor-pointer"
        >
          <Plus className="w-5 h-5" />
          <span>Add Goal</span>
        </button>
      </div>

      {/* Goals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {girlGoals.length === 0 ? (
          <div className="col-span-2 bg-white rounded-3xl p-12 text-center border border-slate-200/80">
            <div className="text-4xl mb-2">🎯</div>
            <h4 className="font-heading font-bold text-slate-700">No wishlist goals set yet</h4>
            <p className="text-xs text-slate-400 mt-1">
              Add goals like a toy, book series, or game to show progress bars on the kid view!
            </p>
          </div>
        ) : (
          girlGoals.map((goal) => {
            const progress = Math.min(100, Math.max(0, (cashBalance / goal.targetAmount) * 100));
            const isAffordable = cashBalance >= goal.targetAmount || goal.completed;

            return (
              <div
                key={goal.id}
                className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center text-2xl shrink-0">
                      {goal.emoji || '🎯'}
                    </div>
                    <div>
                      <h4 className="font-heading font-bold text-base text-slate-800">
                        {goal.title}
                      </h4>
                      {goal.notes && <p className="text-xs text-slate-500 mt-0.5">{goal.notes}</p>}
                      <div className="font-heading font-bold text-sm text-slate-700 mt-1">
                        Target: ${goal.targetAmount.toFixed(2)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        playPopSound();
                        onEditGoal(goal);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition cursor-pointer"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(goal.id, goal.title)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Progress */}
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isAffordable ? 'bg-emerald-500' : 'bg-amber-500'
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500 mt-1.5 font-medium">
                    <span>{progress.toFixed(0)}% Saved with Pocket Cash</span>
                    <button
                      onClick={() => {
                        if (!goal.completed) playFanfareSound();
                        onToggleGoalComplete(goal.id);
                      }}
                      className="flex items-center gap-1 font-bold text-xs text-slate-600 hover:text-slate-900 cursor-pointer"
                    >
                      {goal.completed ? (
                        <span className="text-emerald-600 flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4 fill-emerald-100" /> Completed
                        </span>
                      ) : (
                        <span className="text-slate-400 flex items-center gap-1">
                          <Circle className="w-4 h-4" /> Mark Complete
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
