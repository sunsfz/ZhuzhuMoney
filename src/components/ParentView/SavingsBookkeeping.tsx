import React from 'react';
import { GirlProfile, SavingsSnapshot } from '../../types/finance';
import { Plus, Landmark, Calendar, Trash2, Edit2, TrendingUp, Sparkles, FileText, ArrowUpRight } from 'lucide-react';
import { playPopSound, playSpendSound } from '../../utils/audio';
import { getSavingsGrowth } from '../../services/storage';

interface SavingsBookkeepingProps {
  girl: GirlProfile;
  snapshots: SavingsSnapshot[];
  onAddSnapshot: () => void;
  onEditSnapshot: (snapshot: SavingsSnapshot) => void;
  onDeleteSnapshot: (id: string) => void;
}

export const SavingsBookkeeping: React.FC<SavingsBookkeepingProps> = ({
  girl,
  snapshots,
  onAddSnapshot,
  onEditSnapshot,
  onDeleteSnapshot,
}) => {
  const girlSnapshots = [...snapshots]
    .filter((s) => s.girlId === girl.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const growth = getSavingsGrowth(girl.id, snapshots);
  const latest = girlSnapshots[0];

  const handleDelete = (id: string, date: string) => {
    if (window.confirm(`Delete savings snapshot from ${date}?`)) {
      playSpendSound();
      onDeleteSnapshot(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Update Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-purple-100 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-heading font-bold text-xl text-slate-800">
              Custodial Savings Account ({girl.name})
            </h3>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800">
              Real Bank Account
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Record balance snapshots from bank / 529 / UTMA statements with timestamps.
          </p>
        </div>

        <button
          onClick={() => {
            playPopSound();
            onAddSnapshot();
          }}
          className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl font-heading font-bold text-sm bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-md hover:shadow-lg transition cursor-pointer"
        >
          <Plus className="w-5 h-5" />
          <span>Record Balance Snapshot</span>
        </button>
      </div>

      {/* Analytics Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Latest Balance */}
        <div className="bg-white p-5 rounded-3xl border border-purple-100 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Current Balance</span>
            <div className="font-heading font-black text-2xl sm:text-3xl text-purple-700 mt-1">
              ${latest ? latest.balance.toFixed(2) : '0.00'}
            </div>
            {latest && (
              <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                <Calendar className="w-3 h-3" /> As of {latest.date}
              </span>
            )}
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center text-xl">
            🏦
          </div>
        </div>

        {/* Growth Gain */}
        <div className="bg-white p-5 rounded-3xl border border-purple-100 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Net Growth</span>
            <div className="font-heading font-black text-2xl sm:text-3xl text-emerald-600 mt-1 flex items-center gap-1">
              <TrendingUp className="w-5 h-5" />
              <span>+${Math.max(0, growth.change).toFixed(2)}</span>
            </div>
            <span className="text-[11px] text-slate-400">
              +{growth.percent.toFixed(1)}% since initial entry
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl">
            📈
          </div>
        </div>

        {/* Total Statement Checkpoints */}
        <div className="bg-white p-5 rounded-3xl border border-purple-100 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Checkpoints Logged</span>
            <div className="font-heading font-black text-2xl sm:text-3xl text-slate-800 mt-1">
              {girlSnapshots.length}
            </div>
            <span className="text-[11px] text-slate-400">Timestamped records</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-600 flex items-center justify-center text-xl">
            📑
          </div>
        </div>
      </div>

      {/* Snapshots Timeline & Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 sm:px-6 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Landmark className="w-4 h-4 text-purple-600" />
            <h4 className="font-heading font-bold text-sm text-slate-800">
              Balance History & Statement Snapshots
            </h4>
          </div>
          <span className="text-xs text-slate-500 font-medium">Newest to oldest</span>
        </div>

        {girlSnapshots.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-4xl mb-2">🏦</div>
            <h4 className="font-heading font-bold text-slate-700">No statement snapshots yet</h4>
            <p className="text-xs text-slate-400 mt-1">
              Click "Record Balance Snapshot" above to log {girl.name}'s initial savings balance!
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {girlSnapshots.map((snap, index) => {
              // Calculate difference from previous snapshot if exists
              const previousSnap = girlSnapshots[index + 1];
              const diff = previousSnap ? snap.balance - previousSnap.balance : 0;

              return (
                <div
                  key={snap.id}
                  className="p-4 sm:px-6 flex items-center justify-between gap-4 hover:bg-purple-50/30 transition"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-heading font-bold text-sm shrink-0">
                      #{girlSnapshots.length - index}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-heading font-bold text-sm text-slate-800 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-purple-500" />
                          {snap.date}
                        </span>
                        {index === 0 && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                            Current Active Balance
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 font-medium truncate mt-0.5">
                        {snap.note || 'Regular statement checkpoint'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <div className="font-heading font-black text-lg text-purple-700">
                        ${snap.balance.toFixed(2)}
                      </div>
                      {previousSnap && diff !== 0 && (
                        <span
                          className={`text-[11px] font-bold ${
                            diff > 0 ? 'text-emerald-600' : 'text-rose-500'
                          }`}
                        >
                          {diff > 0 ? `+` : ''}${diff.toFixed(2)}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          playPopSound();
                          onEditSnapshot(snap);
                        }}
                        title="Edit snapshot"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-purple-600 hover:bg-purple-50 transition cursor-pointer"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleDelete(snap.id, snap.date)}
                        title="Delete snapshot"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
