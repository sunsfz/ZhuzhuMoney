import React, { useState, useMemo } from 'react';
import { CashTransaction, GirlProfile, THEME_STYLES } from '../../types/finance';
import { Plus, Search, Filter, Trash2, Edit2, ArrowDownRight, ArrowUpRight, Calendar, DollarSign, Tag, TrendingDown, TrendingUp } from 'lucide-react';
import { playPopSound, playSpendSound } from '../../utils/audio';

interface CashBookkeepingProps {
  girl: GirlProfile;
  transactions: CashTransaction[];
  onAddTransaction: () => void;
  onEditTransaction: (tx: CashTransaction) => void;
  onDeleteTransaction: (id: string) => void;
}

export const CashBookkeeping: React.FC<CashBookkeepingProps> = ({
  girl,
  transactions,
  onAddTransaction,
  onEditTransaction,
  onDeleteTransaction,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'deposit' | 'spent'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const girlTransactions = useMemo(
    () => transactions.filter((t) => t.girlId === girl.id),
    [transactions, girl.id]
  );

  // Statistics
  const stats = useMemo(() => {
    let totalEarned = 0;
    let totalSpent = 0;

    girlTransactions.forEach((tx) => {
      if (tx.type === 'deposit') {
        totalEarned += tx.amount;
      } else {
        totalSpent += tx.amount;
      }
    });

    const netCash = totalEarned - totalSpent;
    return { totalEarned, totalSpent, netCash, count: girlTransactions.length };
  }, [girlTransactions]);

  // Unique categories for filter dropdown
  const categories = useMemo(() => {
    const set = new Set<string>();
    girlTransactions.forEach((t) => set.add(t.category));
    return Array.from(set);
  }, [girlTransactions]);

  // Filtered list
  const filteredTransactions = useMemo(() => {
    return girlTransactions
      .filter((t) => {
        if (typeFilter !== 'all' && t.type !== typeFilter) return false;
        if (selectedCategory !== 'all' && t.category !== selectedCategory) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchDesc = t.description.toLowerCase().includes(q);
          const matchCat = t.category.toLowerCase().includes(q);
          const matchAmt = t.amount.toString().includes(q);
          if (!matchDesc && !matchCat && !matchAmt) return false;
        }
        return true;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [girlTransactions, typeFilter, selectedCategory, searchQuery]);

  const handleDelete = (id: string, description: string) => {
    if (window.confirm(`Are you sure you want to delete "${description || 'this transaction'}"?`)) {
      playSpendSound();
      onDeleteTransaction(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Quick Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-amber-100 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-heading font-bold text-xl text-slate-800">
              Cash Account Ledger ({girl.name})
            </h3>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
              Notebook Virtual Pocket
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Log allowance deposits, chores, treats, and purchases with custom descriptions.
          </p>
        </div>

        <button
          onClick={() => {
            playPopSound();
            onAddTransaction();
          }}
          className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl font-heading font-bold text-sm bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-md hover:shadow-lg transition cursor-pointer"
        >
          <Plus className="w-5 h-5" />
          <span>Add Transaction</span>
        </button>
      </div>

      {/* 3 Quick Stat Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Net Pocket Cash */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Current Cash</span>
            <div className={`font-heading font-black text-2xl sm:text-3xl mt-1 ${stats.netCash >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              ${stats.netCash.toFixed(2)}
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl">
            💵
          </div>
        </div>

        {/* Total Earned / Deposited */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Earned / In</span>
            <div className="font-heading font-black text-2xl sm:text-3xl text-emerald-600 mt-1 flex items-center gap-1">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
              <span>${stats.totalEarned.toFixed(2)}</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl">
            📈
          </div>
        </div>

        {/* Total Spent */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Spent / Out</span>
            <div className="font-heading font-black text-2xl sm:text-3xl text-rose-600 mt-1 flex items-center gap-1">
              <TrendingDown className="w-5 h-5 text-rose-500" />
              <span>${stats.totalSpent.toFixed(2)}</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center text-xl">
            🛍️
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 transform -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search items, categories, or amounts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-amber-400 text-xs font-medium text-slate-800 transition"
          />
        </div>

        {/* Type Toggle */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setTypeFilter('all')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              typeFilter === 'all' ? 'bg-white text-slate-800 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setTypeFilter('deposit')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              typeFilter === 'deposit' ? 'bg-emerald-500 text-white shadow-2xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Deposits
          </button>
          <button
            onClick={() => setTypeFilter('spent')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              typeFilter === 'spent' ? 'bg-rose-500 text-white shadow-2xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Expenses
          </button>
        </div>

        {/* Category Filter */}
        {categories.length > 0 && (
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 cursor-pointer focus:border-amber-400"
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Transaction Records List */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        {filteredTransactions.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-4xl mb-2">📝</div>
            <h4 className="font-heading font-bold text-slate-700">No cash entries found</h4>
            <p className="text-xs text-slate-400 mt-1">
              {searchQuery || typeFilter !== 'all' || selectedCategory !== 'all'
                ? 'Try adjusting your filters or search terms.'
                : `Click "Add Transaction" above to start logging ${girl.name}'s cash pocket money!`}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredTransactions.map((tx) => {
              const isDeposit = tx.type === 'deposit';

              return (
                <div
                  key={tx.id}
                  className="p-4 sm:px-6 flex items-center justify-between gap-4 hover:bg-slate-50/80 transition"
                >
                  {/* Category & Details */}
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xl shrink-0 ${
                        isDeposit ? 'bg-emerald-100' : 'bg-rose-100'
                      }`}
                    >
                      {tx.categoryEmoji || (isDeposit ? '💵' : '🛍️')}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-heading font-bold text-sm text-slate-800">
                          {tx.category}
                        </span>
                        <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {tx.date}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 font-medium truncate mt-0.5">
                        {tx.description || (isDeposit ? 'Allowance / Earning' : 'General purchase')}
                      </p>
                    </div>
                  </div>

                  {/* Amount & Actions */}
                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className={`font-heading font-bold text-base px-2.5 py-0.5 rounded-lg ${
                        isDeposit ? 'text-emerald-700 bg-emerald-50' : 'text-rose-700 bg-rose-50'
                      }`}
                    >
                      {isDeposit ? '+' : '-'}${tx.amount.toFixed(2)}
                    </span>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          playPopSound();
                          onEditTransaction(tx);
                        }}
                        title="Edit transaction"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition cursor-pointer"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleDelete(tx.id, tx.description)}
                        title="Delete transaction"
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
