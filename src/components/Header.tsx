import React, { useState } from 'react';
import { GirlProfile, THEME_STYLES } from '../types/finance';
import { Lock, Unlock, Volume2, VolumeX, Settings, Sparkles, RefreshCw } from 'lucide-react';
import { isSoundEnabled, setSoundEnabled, playPopSound } from '../utils/audio';

interface HeaderProps {
  girls: GirlProfile[];
  selectedGirlId: string;
  onSelectGirl: (id: string) => void;
  isParentMode: boolean;
  onRequestParentMode: () => void;
  onExitParentMode: () => void;
  onOpenSettings: () => void;
  isSyncing?: boolean;
  onTriggerSync?: () => void;
  hasGoogleSheet?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  girls,
  selectedGirlId,
  onSelectGirl,
  isParentMode,
  onRequestParentMode,
  onExitParentMode,
  onOpenSettings,
  isSyncing,
  onTriggerSync,
  hasGoogleSheet,
}) => {
  const [soundOn, setSoundOn] = useState(isSoundEnabled());

  const currentGirl = girls.find(g => g.id === selectedGirlId) || girls[0];
  const theme = THEME_STYLES[currentGirl?.themeColor || 'pink'];

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    setSoundEnabled(next);
    if (next) playPopSound();
  };

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-amber-100 shadow-xs transition-all">
      <div className="max-w-5xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        {/* App Brand */}
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-400 to-rose-400 flex items-center justify-center text-2xl shadow-sm animate-float-soft cursor-pointer">
            🐷
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-heading font-bold text-xl text-slate-800 tracking-tight">ZhuzhuMoney</span>
              <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-amber-100 text-amber-800">
                {isParentMode ? 'Parent Bookkeeping' : 'Kid View'}
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">Sister Financial Standing & Piggy Tracker</p>
          </div>
        </div>

        {/* Girl Profile Switcher Tabs */}
        <div className="flex items-center bg-amber-50/80 p-1 rounded-2xl border border-amber-200/60 shadow-inner">
          {girls.map((girl) => {
            const isSelected = girl.id === selectedGirlId;
            const girlTheme = THEME_STYLES[girl.themeColor];

            return (
              <button
                key={girl.id}
                onClick={() => {
                  playPopSound();
                  onSelectGirl(girl.id);
                }}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-heading font-semibold text-sm transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? `${girlTheme.primary} shadow-md scale-105`
                    : 'text-slate-600 hover:text-slate-900 hover:bg-amber-100/50'
                }`}
              >
                <span className="text-lg leading-none">{girl.avatarEmoji}</span>
                <span>{girl.name}</span>
                {isSelected && <Sparkles className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '4s' }} />}
              </button>
            );
          })}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Sync indicator if Google Sheet connected */}
          {hasGoogleSheet && onTriggerSync && (
            <button
              onClick={onTriggerSync}
              disabled={isSyncing}
              title="Auto-Sync is ON. Click to manually refresh from Google Sheet."
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition cursor-pointer shadow-2xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-emerald-600' : 'text-emerald-500'}`} />
              <span className="hidden sm:inline text-[11px]">{isSyncing ? 'Syncing...' : 'Google Sheet Synced'}</span>
            </button>
          )}

          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            title={soundOn ? 'Sound On' : 'Sound Off'}
            className="p-2 rounded-xl text-slate-600 bg-slate-100 hover:bg-slate-200 hover:text-slate-900 transition cursor-pointer"
          >
            {soundOn ? <Volume2 className="w-4 h-4 text-pink-500" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
          </button>

          {/* Parent Mode Toggle */}
          {isParentMode ? (
            <button
              onClick={() => {
                playPopSound();
                onExitParentMode();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-bold text-emerald-700 bg-emerald-100/80 hover:bg-emerald-200 border border-emerald-300 transition cursor-pointer shadow-xs"
            >
              <Unlock className="w-4 h-4" />
              <span>Parent Active</span>
            </button>
          ) : (
            <button
              onClick={() => {
                playPopSound();
                onRequestParentMode();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 shadow-xs transition cursor-pointer"
            >
              <Lock className="w-4 h-4 text-slate-500" />
              <span>Parent Mode</span>
            </button>
          )}

          {/* Settings */}
          <button
            onClick={() => {
              playPopSound();
              onOpenSettings();
            }}
            title="Settings & Data Backup"
            className="p-2 rounded-xl text-slate-600 bg-slate-100 hover:bg-slate-200 hover:text-slate-900 transition cursor-pointer"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
