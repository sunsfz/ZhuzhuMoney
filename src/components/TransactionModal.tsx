import React, { useState, useEffect } from 'react';
import { CashTransaction, CATEGORY_PRESETS, CategoryOption, TransactionType } from '../types/finance';
import { X, Plus, Check, DollarSign, Calendar, Tag, FileText, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { playCoinSound, playSpendSound, playPopSound } from '../utils/audio';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transaction: Omit<CashTransaction, 'id' | 'createdAt'>, editingId?: string) => void;
  editingTransaction?: CashTransaction | null;
  girlId: string;
  girlName: string;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingTransaction,
  girlId,
  girlName,
}) => {
  const [type, setType] = useState<TransactionType>('spent');
  const [amount, setAmount] = useState<string>('');
  const [category, setCategory] = useState<string>('Ice Cream & Boba');
  const [categoryEmoji, setCategoryEmoji] = useState<string>('🍦');
  const [description, setDescription] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (editingTransaction) {
      setType(editingTransaction.type);
      setAmount(editingTransaction.amount.toString());
      setCategory(editingTransaction.category);
      setCategoryEmoji(editingTransaction.categoryEmoji || '💰');
      setDescription(editingTransaction.description);
      setDate(editingTransaction.date);
    } else {
      // Default reset
      setType('spent');
      setAmount('');
      setCategory('Ice Cream & Boba');
      setCategoryEmoji('🍦');
      setDescription('');
      setDate(new Date().toISOString().split('T')[0]);
    }
  }, [editingTransaction, isOpen]);

  if (!isOpen) return null;

  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    playPopSound();
    // Set a sensible default category for that type
    if (newType === 'deposit') {
      setCategory('Allowance');
      setCategoryEmoji('💵');
    } else {
      setCategory('Ice Cream & Boba');
      setCategoryEmoji('🍦');
    }
  };

  const handleSelectCategory = (cat: CategoryOption) => {
    setCategory(cat.name);
    setCategoryEmoji(cat.emoji);
    playPopSound();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      alert('Please enter a valid amount greater than 0');
      return;
    }

    if (type === 'deposit') {
      playCoinSound();
    } else {
      playSpendSound();
    }

    onSave(
      {
        girlId,
        type,
        amount: Math.round(numAmount * 100) / 100,
        category,
        categoryEmoji,
        description: description.trim(),
        date,
      },
      editingTransaction ? editingTransaction.id : undefined
    );

    onClose();
  };

  const filteredCategories = CATEGORY_PRESETS.filter(
    (c) => c.type === 'both' || c.type === type
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl border border-amber-100 relative my-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-5">
          <h3 className="font-heading font-bold text-xl text-slate-800">
            {editingTransaction ? 'Edit Cash Entry' : 'Add Cash Transaction'}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Updating virtual notebook ledger for <span className="font-bold text-slate-700">{girlName}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type Selector (Deposit vs Spent) */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl">
            <button
              type="button"
              onClick={() => handleTypeChange('spent')}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl font-heading font-bold text-sm transition-all cursor-pointer ${
                type === 'spent'
                  ? 'bg-rose-500 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ArrowDownRight className="w-4 h-4" />
              <span>Money Spent / Debit</span>
            </button>

            <button
              type="button"
              onClick={() => handleTypeChange('deposit')}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl font-heading font-bold text-sm transition-all cursor-pointer ${
                type === 'deposit'
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>Deposit / Earned</span>
            </button>
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Amount ($)
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
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-9 pr-4 py-3 rounded-2xl border-2 border-slate-200 focus:border-amber-400 focus:ring-0 text-xl font-heading font-bold text-slate-800 transition"
              />
            </div>
          </div>

          {/* Category Quick Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Category
            </label>
            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1 bg-amber-50/40 rounded-2xl border border-amber-100">
              {filteredCategories.map((cat) => {
                const isSelected = category === cat.name;
                return (
                  <button
                    key={cat.name}
                    type="button"
                    onClick={() => handleSelectCategory(cat)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                      isSelected
                        ? 'bg-slate-800 text-white shadow-xs scale-105'
                        : 'bg-white text-slate-700 hover:bg-amber-100 border border-slate-200/60'
                    }`}
                  >
                    <span>{cat.emoji}</span>
                    <span>{cat.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Item Description / Memo */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Spend Item / Description
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder={type === 'spent' ? 'e.g. Strawberry ice cream at playground' : 'e.g. Weekly chore allowance'}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl border-2 border-slate-200 focus:border-amber-400 focus:ring-0 text-sm font-medium text-slate-800 transition"
              />
            </div>
          </div>

          {/* Date Picker */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Transaction Date
            </label>
            <div className="relative">
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl border-2 border-slate-200 focus:border-amber-400 focus:ring-0 text-sm font-medium text-slate-800 transition"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              className={`w-full py-3.5 rounded-2xl font-heading font-bold text-white shadow-md hover:shadow-lg transition cursor-pointer flex items-center justify-center gap-2 ${
                type === 'deposit'
                  ? 'bg-emerald-500 hover:bg-emerald-600'
                  : 'bg-rose-500 hover:bg-rose-600'
              }`}
            >
              <Check className="w-5 h-5" />
              <span>{editingTransaction ? 'Save Changes' : 'Record Transaction'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
