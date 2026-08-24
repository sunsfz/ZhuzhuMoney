import React, { useState, useEffect } from 'react';
import { SavingsGoal } from '../types/finance';
import { X, Check, Target } from 'lucide-react';
import { playFanfareSound, playPopSound } from '../utils/audio';

interface GoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (goal: Omit<SavingsGoal, 'id'>, editingId?: string) => void;
  editingGoal?: SavingsGoal | null;
  girlId: string;
  girlName: string;
}

const EMOJI_OPTIONS = ['🎮', '🧸', '🚲', '📚', '👗', '🎨', '🛹', '🎧', '📱', '🏰', '👟', '🎁'];

export const GoalModal: React.FC<GoalModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingGoal,
  girlId,
  girlName,
}) => {
  const [title, setTitle] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [emoji, setEmoji] = useState('🎮');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (editingGoal) {
      setTitle(editingGoal.title);
      setTargetAmount(editingGoal.targetAmount.toString());
      setEmoji(editingGoal.emoji || '🎮');
      setNotes(editingGoal.notes || '');
    } else {
      setTitle('');
      setTargetAmount('');
      setEmoji('🎮');
      setNotes('');
    }
  }, [editingGoal, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(targetAmount);
    if (isNaN(numAmount) || numAmount <= 0) {
      alert('Please enter a valid target amount');
      return;
    }

    playFanfareSound();

    onSave(
      {
        girlId,
        title: title.trim(),
        targetAmount: Math.round(numAmount * 100) / 100,
        emoji,
        completed: editingGoal ? editingGoal.completed : false,
        notes: notes.trim() || undefined,
      },
      editingGoal ? editingGoal.id : undefined
    );

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-amber-100 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-5">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-xl text-slate-800">
                {editingGoal ? 'Edit Wishlist Goal' : 'Add Dream Wish / Goal'}
              </h3>
              <p className="text-xs text-slate-500">
                Savings target for <span className="font-bold text-slate-700">{girlName}</span>
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Goal / Item Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Nintendo Switch Game, Roller Skates"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl border-2 border-slate-200 focus:border-amber-400 focus:ring-0 text-sm font-medium text-slate-800 transition"
            />
          </div>

          {/* Target Amount */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Target Cost ($)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-bold text-lg">
                $
              </div>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="0.00"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                className="w-full pl-9 pr-4 py-3 rounded-2xl border-2 border-slate-200 focus:border-amber-400 focus:ring-0 text-xl font-heading font-bold text-slate-800 transition"
              />
            </div>
          </div>

          {/* Emoji Picker */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Choose Icon
            </label>
            <div className="flex flex-wrap gap-2 p-2 bg-amber-50/50 rounded-2xl border border-amber-100">
              {EMOJI_OPTIONS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => {
                    playPopSound();
                    setEmoji(e);
                  }}
                  className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition cursor-pointer ${
                    emoji === e
                      ? 'bg-amber-400 text-white scale-110 shadow-xs'
                      : 'bg-white hover:bg-amber-100 border border-slate-200'
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Details / Notes (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Specific model, color preference"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl border-2 border-slate-200 focus:border-amber-400 focus:ring-0 text-sm font-medium text-slate-800 transition"
            />
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl font-heading font-bold text-white bg-amber-500 hover:bg-amber-600 shadow-md hover:shadow-lg transition cursor-pointer flex items-center justify-center gap-2"
            >
              <Check className="w-5 h-5" />
              <span>{editingGoal ? 'Save Goal' : 'Add Goal to Wishlist'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
