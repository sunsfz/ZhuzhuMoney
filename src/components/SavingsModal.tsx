import React, { useState, useEffect } from 'react';
import { SavingsSnapshot } from '../types/finance';
import { X, Check, Landmark, Calendar, FileText } from 'lucide-react';
import { playFanfareSound, playPopSound } from '../utils/audio';

interface SavingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (snapshot: Omit<SavingsSnapshot, 'id' | 'createdAt'>, editingId?: string) => void;
  editingSnapshot?: SavingsSnapshot | null;
  girlId: string;
  girlName: string;
  lastBalance?: number;
}

export const SavingsModal: React.FC<SavingsModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingSnapshot,
  girlId,
  girlName,
  lastBalance,
}) => {
  const [balance, setBalance] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState<string>('');

  useEffect(() => {
    if (editingSnapshot) {
      setBalance(editingSnapshot.balance.toString());
      setDate(editingSnapshot.date);
      setNote(editingSnapshot.note || '');
    } else {
      setBalance(lastBalance ? lastBalance.toString() : '');
      setDate(new Date().toISOString().split('T')[0]);
      setNote('');
    }
  }, [editingSnapshot, isOpen, lastBalance]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numBalance = parseFloat(balance);
    if (isNaN(numBalance) || numBalance < 0) {
      alert('Please enter a valid balance (0 or greater)');
      return;
    }

    playFanfareSound();

    onSave(
      {
        girlId,
        balance: Math.round(numBalance * 100) / 100,
        date,
        note: note.trim() || undefined,
      },
      editingSnapshot ? editingSnapshot.id : undefined
    );

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-purple-100 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-5">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-xl text-slate-800">
                {editingSnapshot ? 'Edit Savings Snapshot' : 'Update Savings Balance'}
              </h3>
              <p className="text-xs text-slate-500">
                Custodial account record for <span className="font-bold text-slate-700">{girlName}</span>
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Balance Amount */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Current Custodial Balance ($)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-bold text-lg">
                $
              </div>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                placeholder="0.00"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                className="w-full pl-9 pr-4 py-3 rounded-2xl border-2 border-purple-200 focus:border-purple-500 focus:ring-0 text-2xl font-heading font-black text-purple-700 transition"
              />
            </div>
          </div>

          {/* Date Stamp */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Statement / Checkpoint Date
            </label>
            <div className="relative">
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl border-2 border-slate-200 focus:border-purple-400 focus:ring-0 text-sm font-medium text-slate-800 transition"
              />
            </div>
          </div>

          {/* Memo / Notes */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Memo / Statement Note (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Vanguard UTMA statement, interest dividend, birthday check"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl border-2 border-slate-200 focus:border-purple-400 focus:ring-0 text-sm font-medium text-slate-800 transition"
            />
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl font-heading font-bold text-white bg-purple-600 hover:bg-purple-700 shadow-md hover:shadow-lg transition cursor-pointer flex items-center justify-center gap-2"
            >
              <Check className="w-5 h-5" />
              <span>{editingSnapshot ? 'Save Snapshot' : 'Record Balance Snapshot'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
