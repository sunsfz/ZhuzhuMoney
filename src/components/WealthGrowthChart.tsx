import React, { useState, useMemo } from 'react';
import { CashTransaction, GirlProfile, SavingsSnapshot, THEME_STYLES } from '../types/finance';
import { TrendingUp, Calendar, Wallet, Landmark, Sparkles, Filter, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { playPopSound } from '../utils/audio';
import { format, parseISO, subMonths, subYears, isAfter, isBefore } from 'date-fns';

type TimeRange = '1M' | '3M' | '6M' | '1Y' | 'ALL';
type AccountPivot = 'total' | 'cash' | 'savings';

interface WealthGrowthChartProps {
  girl: GirlProfile;
  transactions: CashTransaction[];
  savingsSnapshots: SavingsSnapshot[];
}

interface DataPoint {
  date: string;
  displayDate: string;
  cash: number;
  savings: number;
  total: number;
}

export const WealthGrowthChart: React.FC<WealthGrowthChartProps> = ({
  girl,
  transactions,
  savingsSnapshots,
}) => {
  const [timeRange, setTimeRange] = useState<TimeRange>('ALL');
  const [pivot, setPivot] = useState<AccountPivot>('total');
  const [hoveredPoint, setHoveredPoint] = useState<DataPoint | null>(null);

  const theme = THEME_STYLES[girl.themeColor || 'pink'];

  // Filter girl's data
  const girlTransactions = useMemo(
    () => transactions.filter((t) => t.girlId === girl.id),
    [transactions, girl.id]
  );
  const girlSnapshots = useMemo(
    () => savingsSnapshots.filter((s) => s.girlId === girl.id),
    [savingsSnapshots, girl.id]
  );

  // Compute chronological timeline of balances
  const fullTimeline = useMemo(() => {
    // Collect all dates
    const dateSet = new Set<string>();
    girlTransactions.forEach((t) => dateSet.add(t.date));
    girlSnapshots.forEach((s) => dateSet.add(s.date));

    // Ensure today is included
    const todayStr = new Date().toISOString().split('T')[0];
    dateSet.add(todayStr);

    const sortedDates = Array.from(dateSet).sort();

    // Sort transactions & snapshots
    const sortedTx = [...girlTransactions].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    const sortedSav = [...girlSnapshots].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const points: DataPoint[] = [];

    sortedDates.forEach((dateStr) => {
      // Cash up to this date
      const cashBal = sortedTx
        .filter((t) => t.date <= dateStr)
        .reduce((sum, t) => (t.type === 'deposit' ? sum + t.amount : sum - t.amount), 0);

      // Latest savings snapshot on or before this date
      const relevantSav = sortedSav.filter((s) => s.date <= dateStr);
      const savBal = relevantSav.length > 0 ? relevantSav[relevantSav.length - 1].balance : 0;

      let displayDate = dateStr;
      try {
        displayDate = format(parseISO(dateStr), 'MMM d, yy');
      } catch {}

      points.push({
        date: dateStr,
        displayDate,
        cash: Math.max(0, cashBal),
        savings: Math.max(0, savBal),
        total: Math.max(0, cashBal + savBal),
      });
    });

    return points;
  }, [girlTransactions, girlSnapshots]);

  // Filter timeline based on TimeRange
  const filteredPoints = useMemo(() => {
    if (fullTimeline.length === 0) return [];
    if (timeRange === 'ALL') return fullTimeline;

    const now = new Date();
    let cutoffDate: Date;

    switch (timeRange) {
      case '1M':
        cutoffDate = subMonths(now, 1);
        break;
      case '3M':
        cutoffDate = subMonths(now, 3);
        break;
      case '6M':
        cutoffDate = subMonths(now, 6);
        break;
      case '1Y':
        cutoffDate = subYears(now, 1);
        break;
      default:
        return fullTimeline;
    }

    const cutoffStr = cutoffDate.toISOString().split('T')[0];
    const filtered = fullTimeline.filter((p) => p.date >= cutoffStr);

    // If filtering leaves too few points, include at least the initial baseline point
    if (filtered.length < 2 && fullTimeline.length >= 2) {
      return fullTimeline.slice(-5);
    }
    return filtered;
  }, [fullTimeline, timeRange]);

  // Value selector based on pivot
  const getValue = (p: DataPoint) => {
    if (pivot === 'cash') return p.cash;
    if (pivot === 'savings') return p.savings;
    return p.total;
  };

  // Stats for the selected view
  const stats = useMemo(() => {
    if (filteredPoints.length === 0) {
      return { start: 0, current: 0, change: 0, percent: 0, max: 0 };
    }
    const start = getValue(filteredPoints[0]);
    const current = getValue(filteredPoints[filteredPoints.length - 1]);
    const change = current - start;
    const percent = start > 0 ? (change / start) * 100 : 0;
    const max = Math.max(...filteredPoints.map(getValue), 10);

    return { start, current, change, percent, max };
  }, [filteredPoints, pivot]);

  // Generate SVG path for chart curve
  const chartSvg = useMemo(() => {
    const points = filteredPoints;
    if (points.length === 0) return { path: '', areaPath: '', coords: [] };

    const width = 600;
    const height = 220;
    const padding = { top: 20, bottom: 30, left: 20, right: 20 };

    const maxVal = Math.max(...points.map(getValue), 10) * 1.15; // 15% head room
    const minVal = Math.min(...points.map(getValue), 0);

    const rangeY = maxVal - minVal || 1;

    if (points.length === 1) {
      const p = points[0];
      const val = getValue(p);
      const y = height - padding.bottom - ((val - minVal) / rangeY) * (height - padding.top - padding.bottom);
      const x1 = padding.left;
      const x2 = width - padding.right;
      const path = `M ${x1} ${y} L ${x2} ${y}`;
      const areaPath = `M ${x1} ${y} L ${x2} ${y} L ${x2} ${height - padding.bottom} L ${x1} ${height - padding.bottom} Z`;
      const coords = [
        { x: (x1 + x2) / 2, y, point: p, value: val },
      ];
      return { path, areaPath, coords, height, width };
    }

    const stepX = (width - padding.left - padding.right) / Math.max(1, points.length - 1);

    const coords = points.map((p, idx) => {
      const val = getValue(p);
      const x = padding.left + idx * stepX;
      const y = height - padding.bottom - ((val - minVal) / rangeY) * (height - padding.top - padding.bottom);
      return { x, y, point: p, value: val };
    });

    // Build smooth bezier SVG line
    let path = `M ${coords[0].x} ${coords[0].y}`;
    for (let i = 1; i < coords.length; i++) {
      const prev = coords[i - 1];
      const curr = coords[i];
      const cpX = (prev.x + curr.x) / 2;
      path += ` C ${cpX} ${prev.y}, ${cpX} ${curr.y}, ${curr.x} ${curr.y}`;
    }

    // Area path closed to bottom
    const areaPath = `${path} L ${coords[coords.length - 1].x} ${height - padding.bottom} L ${coords[0].x} ${height - padding.bottom} Z`;

    return { path, areaPath, coords, height, width };
  }, [filteredPoints, pivot]);

  const handleTimeSelect = (r: TimeRange) => {
    playPopSound();
    setTimeRange(r);
  };

  const handlePivotSelect = (p: AccountPivot) => {
    playPopSound();
    setPivot(p);
  };

  // Color config based on pivot
  const colorScheme = {
    total: {
      line: '#F59E0B',
      gradientStart: '#FDE68A',
      gradientStop: '#FEF3C7',
      accent: 'text-amber-600',
      pill: 'bg-amber-100 text-amber-900 border-amber-300',
      name: 'Total Wealth (All Accounts)',
    },
    cash: {
      line: '#10B981',
      gradientStart: '#A7F3D0',
      gradientStop: '#ECFDF5',
      accent: 'text-emerald-600',
      pill: 'bg-emerald-100 text-emerald-900 border-emerald-300',
      name: 'Pocket Cash Ledger',
    },
    savings: {
      line: '#8B5CF6',
      gradientStart: '#DDD6FE',
      gradientStop: '#F5F3FF',
      accent: 'text-purple-600',
      pill: 'bg-purple-100 text-purple-900 border-purple-300',
      name: 'Custodial Savings Vault',
    },
  }[pivot];

  return (
    <div className="bg-white/90 backdrop-blur-xs rounded-3xl p-5 sm:p-6 border border-amber-100/90 shadow-xs space-y-5">
      {/* Top Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">📈</span>
            <h3 className="font-heading font-bold text-lg text-slate-800">
              {girl.name}'s Wealth Growth Journey
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Interactive visual balance over time
          </p>
        </div>

        {/* Pivot Selector (Total / Cash / Savings) */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200/60 overflow-x-auto text-xs font-heading font-bold">
          <button
            onClick={() => handlePivotSelect('total')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition cursor-pointer shrink-0 ${
              pivot === 'total' ? 'bg-amber-500 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Total Wealth</span>
          </button>

          <button
            onClick={() => handlePivotSelect('cash')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition cursor-pointer shrink-0 ${
              pivot === 'cash' ? 'bg-emerald-500 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Wallet className="w-3.5 h-3.5" />
            <span>Cash Ledger</span>
          </button>

          <button
            onClick={() => handlePivotSelect('savings')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl transition cursor-pointer shrink-0 ${
              pivot === 'savings' ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Landmark className="w-3.5 h-3.5" />
            <span>Savings Vault</span>
          </button>
        </div>
      </div>

      {/* Time Range Pills & Quick Stat Badges */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-100">
        {/* Time Selector */}
        <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600">
          {(['1M', '3M', '6M', '1Y', 'ALL'] as TimeRange[]).map((r) => (
            <button
              key={r}
              onClick={() => handleTimeSelect(r)}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                timeRange === r
                  ? 'bg-slate-800 text-white shadow-2xs'
                  : 'hover:bg-slate-200/60 hover:text-slate-900'
              }`}
            >
              {r === 'ALL' ? 'All Time' : r}
            </button>
          ))}
        </div>

        {/* Growth Stats Summary */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-slate-400">Current Balance</span>
            <div className={`font-heading font-black text-xl ${colorScheme.accent}`}>
              ${stats.current.toFixed(2)}
            </div>
          </div>

          <div
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold border shadow-2xs ${
              stats.change >= 0
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-rose-50 text-rose-700 border-rose-200'
            }`}
          >
            {stats.change >= 0 ? (
              <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.5]" />
            ) : (
              <ArrowDownRight className="w-3.5 h-3.5 stroke-[2.5]" />
            )}
            <span>
              {stats.change >= 0 ? '+' : ''}${stats.change.toFixed(2)} ({stats.percent.toFixed(1)}%)
            </span>
          </div>
        </div>
      </div>

      {/* Interactive SVG Visual Chart */}
      <div className="relative w-full overflow-hidden bg-gradient-to-b from-slate-50/50 to-amber-50/30 rounded-2xl border border-slate-200/60 p-2 sm:p-4">
        {filteredPoints.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-slate-400 text-xs">
            No transaction records found for this time range.
          </div>
        ) : (
          <div className="relative">
            <svg
              viewBox={`0 0 ${chartSvg.width || 600} ${chartSvg.height || 220}`}
              className="w-full h-48 sm:h-56 overflow-visible"
            >
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={colorScheme.line} stopOpacity="0.35" />
                  <stop offset="100%" stopColor={colorScheme.line} stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              {[0.25, 0.5, 0.75].map((ratio) => (
                <line
                  key={ratio}
                  x1="20"
                  y1={20 + ratio * 170}
                  x2="580"
                  y2={20 + ratio * 170}
                  stroke="#E2E8F0"
                  strokeDasharray="4 4"
                  strokeWidth="1"
                />
              ))}

              {/* Filled Area */}
              {chartSvg.areaPath && (
                <path d={chartSvg.areaPath} fill="url(#chartGradient)" />
              )}

              {/* Line Curve */}
              {chartSvg.path && (
                <path
                  d={chartSvg.path}
                  fill="none"
                  stroke={colorScheme.line}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Interactive Data Dots */}
              {chartSvg.coords.map((c, i) => (
                <g key={i}>
                  <circle
                    cx={c.x}
                    cy={c.y}
                    r="5"
                    fill="white"
                    stroke={colorScheme.line}
                    strokeWidth="3"
                    className="transition-transform duration-200 hover:scale-150 cursor-pointer"
                    onMouseEnter={() => setHoveredPoint(c.point)}
                    onTouchStart={() => setHoveredPoint(c.point)}
                  />
                </g>
              ))}
            </svg>

            {/* Hover Tooltip Card */}
            {hoveredPoint && (
              <div className="absolute top-2 left-1/2 transform -translate-x-1/2 bg-slate-900/90 backdrop-blur-md text-white px-3.5 py-2 rounded-xl text-xs shadow-lg border border-slate-700 flex items-center gap-3 animate-fadeIn pointer-events-none">
                <div>
                  <div className="text-[10px] text-slate-400">{hoveredPoint.displayDate}</div>
                  <div className="font-heading font-black text-sm text-amber-300">
                    ${hoveredPoint[pivot].toFixed(2)}
                  </div>
                </div>
                <div className="text-[10px] text-slate-300 border-l border-slate-700 pl-2">
                  <div>Cash: ${hoveredPoint.cash.toFixed(2)}</div>
                  <div>Savings: ${hoveredPoint.savings.toFixed(2)}</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Date Labels below chart */}
        {filteredPoints.length > 0 && (
          <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 px-3 pt-2">
            <span>{filteredPoints[0]?.displayDate}</span>
            <span className="hidden sm:inline">
              {filteredPoints[Math.floor(filteredPoints.length / 2)]?.displayDate}
            </span>
            <span>{filteredPoints[filteredPoints.length - 1]?.displayDate} (Latest)</span>
          </div>
        )}
      </div>
    </div>
  );
};
