import React, { useState } from 'react';
import { AppData, GirlProfile, ThemeColor, THEME_STYLES } from '../types/finance';
import { X, Save, RefreshCw, Download, Upload, RotateCcw, KeyRound, Check, FileSpreadsheet, Copy, ExternalLink, Users } from 'lucide-react';
import { exportDataAsJSON, importDataFromJSON, INITIAL_DATA } from '../services/storage';
import { GOOGLE_APPS_SCRIPT_TEMPLATE } from '../services/googleSheetsSync';
import { playFanfareSound, playPopSound } from '../utils/audio';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  appData: AppData;
  onSaveAppData: (newData: AppData) => void;
  onManualSync: (url: string) => Promise<void>;
  onPushToCloud?: (url: string) => Promise<void>;
  onPullFromCloud?: (url: string) => Promise<void>;
  isSyncing: boolean;
  isParentMode: boolean;
  onRequestParentMode?: () => void;
}

const THEME_OPTIONS: { id: ThemeColor; name: string; colorClass: string }[] = [
  { id: 'pink', name: 'Strawberry Pink', colorClass: 'bg-pink-400' },
  { id: 'purple', name: 'Lavender Dream', colorClass: 'bg-purple-400' },
  { id: 'mint', name: 'Mint Green', colorClass: 'bg-emerald-400' },
  { id: 'peach', name: 'Peach Sunshine', colorClass: 'bg-orange-400' },
  { id: 'sky', name: 'Sky Blue', colorClass: 'bg-sky-400' },
  { id: 'sun', name: 'Lemon Yellow', colorClass: 'bg-amber-400' },
];

const AVATAR_OPTIONS = ['👧🏻', '👧🏼', '👧🏽', '👧🏾', '👧🏿', '🧒🏻', '🦄', '🐱', '🐰', '🐼', '🦊', '🌸'];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  appData,
  onSaveAppData,
  onManualSync,
  onPushToCloud,
  onPullFromCloud,
  isSyncing,
  isParentMode,
  onRequestParentMode,
}) => {
  const [activeTab, setActiveTab] = useState<'profiles' | 'sync' | 'security' | 'backup'>('profiles');
  const [girls, setGirls] = useState<GirlProfile[]>(appData.girls);
  const [pin, setPin] = useState(appData.parentPin);
  const [googleSheetUrl, setGoogleSheetUrl] = useState(appData.googleSheetScriptUrl || '');
  const [copiedCode, setCopiedCode] = useState(false);
  const [showScriptGuide, setShowScriptGuide] = useState(false);

  if (!isOpen) return null;

  const handleUpdateGirl = (index: number, updates: Partial<GirlProfile>) => {
    const updated = [...girls];
    updated[index] = { ...updated[index], ...updates };
    setGirls(updated);
  };

  const handleSaveAll = () => {
    playFanfareSound();
    onSaveAppData({
      ...appData,
      girls,
      parentPin: pin.trim() || '0518',
      googleSheetScriptUrl: googleSheetUrl.trim() || undefined,
    });
    onClose();
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_TEMPLATE);
    setCopiedCode(true);
    playPopSound();
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const imported = await importDataFromJSON(file);
      if (window.confirm('Restore data from this backup? This will replace current records.')) {
        playFanfareSound();
        onSaveAppData(imported);
        onClose();
      }
    } catch (err) {
      alert('Failed to read backup file. Please ensure it is a valid JSON file.');
    }
  };

  const handleResetSample = () => {
    if (window.confirm('Reset all data to clean Jessie & Raina initial setup ($66 / $126 cash, $100 savings, 0 wishlists)?')) {
      playPopSound();
      const freshData: AppData = {
        ...INITIAL_DATA,
        googleSheetScriptUrl: googleSheetUrl || appData.googleSheetScriptUrl,
      };
      onSaveAppData(freshData);
      setGirls(freshData.girls);
      setPin(freshData.parentPin);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-3xl p-6 shadow-2xl border border-amber-100 relative my-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-5">
          <h3 className="font-heading font-bold text-2xl text-slate-800">
            {isParentMode ? 'App Settings & Bookkeeping Controls' : 'Profile & Theme Customization'}
          </h3>
          <p className="text-xs text-slate-500">
            {isParentMode
              ? 'Configure girl names, themes, PIN code, and Google Sheet sync'
              : 'Choose your favorite avatar and pastel theme colors!'}
          </p>
        </div>

        {/* Tab Switcher (Only show advanced tabs if in Parent Mode) */}
        {isParentMode ? (
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl mb-6 overflow-x-auto text-xs font-heading font-bold">
            <button
              onClick={() => setActiveTab('profiles')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition cursor-pointer shrink-0 ${
                activeTab === 'profiles' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Girl Profiles</span>
            </button>

            <button
              onClick={() => setActiveTab('sync')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition cursor-pointer shrink-0 ${
                activeTab === 'sync' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Google Sheets Sync</span>
            </button>

            <button
              onClick={() => setActiveTab('security')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition cursor-pointer shrink-0 ${
                activeTab === 'security' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <KeyRound className="w-4 h-4 text-amber-600" />
              <span>Parent PIN</span>
            </button>

            <button
              onClick={() => setActiveTab('backup')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition cursor-pointer shrink-0 ${
                activeTab === 'backup' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Download className="w-4 h-4 text-purple-600" />
              <span>Backup & Reset</span>
            </button>
          </div>
        ) : (
          <div className="mb-4 p-3 bg-amber-50/80 rounded-2xl border border-amber-200/60 flex items-center justify-between text-xs text-amber-900">
            <span>👧🏻 Girls Mode: Customize your avatar & color themes below.</span>
            {onRequestParentMode && (
              <button
                onClick={() => {
                  onClose();
                  onRequestParentMode();
                }}
                className="font-bold text-amber-800 hover:underline cursor-pointer ml-2 shrink-0"
              >
                Unlock Parent Settings 🔒
              </button>
            )}
          </div>
        )}

        {/* Tab 1: Girl Profiles */}
        {activeTab === 'profiles' && (
          <div className="space-y-6">
            {girls.map((girl, index) => (
              <div key={girl.id} className="p-4 rounded-2xl bg-amber-50/40 border border-amber-200/60">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-6 h-6 rounded-full bg-amber-200 text-amber-900 flex items-center justify-center font-bold text-xs">
                    {index + 1}
                  </span>
                  <h4 className="font-heading font-bold text-base text-slate-800">
                    {girl.name} ({girl.id === 'girl_1' ? '10 yrs' : '8 yrs'})
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Name</label>
                    <input
                      type="text"
                      disabled={!isParentMode}
                      value={girl.name}
                      onChange={(e) => handleUpdateGirl(index, { name: e.target.value })}
                      className={`w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-bold text-slate-800 ${
                        isParentMode ? 'bg-white focus:border-amber-400' : 'bg-slate-100 cursor-not-allowed text-slate-600'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Theme Color</label>
                    <select
                      value={girl.themeColor}
                      onChange={(e) => handleUpdateGirl(index, { themeColor: e.target.value as ThemeColor })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:border-amber-400 text-sm font-semibold text-slate-800 bg-white cursor-pointer"
                    >
                      {THEME_OPTIONS.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Avatar selection */}
                <div className="mt-3">
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">Avatar Emoji</label>
                  <div className="flex flex-wrap gap-2">
                    {AVATAR_OPTIONS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => handleUpdateGirl(index, { avatarEmoji: emoji })}
                        className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center transition cursor-pointer ${
                          girl.avatarEmoji === emoji
                            ? 'bg-amber-400 text-white scale-110 shadow-xs ring-2 ring-amber-300'
                            : 'bg-white hover:bg-amber-100 border border-slate-200'
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 2: Google Sheets Sync */}
        {activeTab === 'sync' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900">
              <div className="flex items-center gap-1.5 font-heading font-bold text-sm mb-1 text-emerald-800">
                <FileSpreadsheet className="w-4 h-4" />
                <span>Google Sheets Multi-Device Sync</span>
              </div>
              <p>
                Connected to your private Google Spreadsheet. The script automatically creates clean, formatted tabs for <b>Cash Ledger</b> and <b>Custodial Savings</b> in your Google Drive!
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Google Apps Script Web App URL
              </label>
              <div className="space-y-3">
                <input
                  type="url"
                  placeholder="https://script.google.com/macros/s/.../exec"
                  value={googleSheetUrl}
                  onChange={(e) => setGoogleSheetUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border-2 border-slate-200 focus:border-emerald-500 text-xs font-mono text-slate-800 bg-slate-50 focus:bg-white transition"
                />
                
                <div className="flex flex-wrap gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      if (!googleSheetUrl.trim()) {
                        alert('Please paste your Google Apps Script Web App URL into the box above first!');
                        return;
                      }
                      onPushToCloud ? onPushToCloud(googleSheetUrl.trim()) : onManualSync(googleSheetUrl.trim());
                    }}
                    disabled={isSyncing}
                    className="flex-1 min-w-[200px] px-4 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-heading font-bold flex items-center justify-center gap-2 cursor-pointer shadow-md transition"
                  >
                    <Upload className={`w-4 h-4 ${isSyncing ? 'animate-bounce' : ''}`} />
                    <span>{isSyncing ? 'Uploading...' : 'Upload / Push to Google Sheet'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (!googleSheetUrl.trim()) {
                        alert('Please paste your Google Apps Script Web App URL into the box above first!');
                        return;
                      }
                      onPullFromCloud ? onPullFromCloud(googleSheetUrl.trim()) : onManualSync(googleSheetUrl.trim());
                    }}
                    disabled={isSyncing}
                    className="px-4 py-3 rounded-2xl bg-slate-800 hover:bg-slate-900 active:scale-95 text-white text-xs font-heading font-bold flex items-center justify-center gap-2 cursor-pointer shadow-md transition"
                  >
                    <Download className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>Download / Fetch</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Expandable Setup Instructions */}
            <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50">
              <div className="flex items-center justify-between">
                <h5 className="font-heading font-bold text-xs text-slate-800">
                  How to setup your Google Sheet (takes 2 minutes)
                </h5>
                <button
                  type="button"
                  onClick={() => setShowScriptGuide(!showScriptGuide)}
                  className="text-xs text-emerald-700 font-bold hover:underline cursor-pointer"
                >
                  {showScriptGuide ? 'Hide Instructions' : 'View Instructions'}
                </button>
              </div>

              {showScriptGuide && (
                <div className="mt-3 text-xs text-slate-600 space-y-2 border-t border-slate-200 pt-3">
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Create a new spreadsheet in <b>Google Sheets</b>.</li>
                    <li>Click <b>Extensions ➔ Apps Script</b> in the top menu.</li>
                    <li>
                      Delete any existing text and paste the script below:{' '}
                      <button
                        type="button"
                        onClick={handleCopyCode}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold hover:bg-emerald-200 cursor-pointer ml-1"
                      >
                        <Copy className="w-3 h-3" />
                        <span>{copiedCode ? 'Copied!' : 'Copy Script Code'}</span>
                      </button>
                    </li>
                    <li>Click <b>Deploy ➔ New deployment</b>.</li>
                    <li>Select type <b>Web app</b>, Execute as: <b>Me</b>, Who has access: <b>Anyone</b>.</li>
                    <li>Click <b>Deploy</b>, copy the <b>Web app URL</b>, and paste it into the box above!</li>
                  </ol>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Security / Parent PIN */}
        {activeTab === 'security' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200">
              <h4 className="font-heading font-bold text-sm text-slate-800 mb-1">Parent Lock PIN</h4>
              <p className="text-xs text-slate-600">
                This 4-digit code prevents kids from accidentally adding or deleting transactions while viewing their piggy bank.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">4-Digit PIN</label>
              <input
                type="text"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                placeholder="1234"
                className="w-32 px-4 py-2.5 rounded-xl border-2 border-slate-200 focus:border-amber-400 text-center font-heading font-black text-xl tracking-widest text-slate-800"
              />
            </div>
          </div>
        )}

        {/* Tab 4: Backup & Reset */}
        {activeTab === 'backup' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200">
              <h4 className="font-heading font-bold text-sm text-purple-900 mb-1">JSON Backup & Restore</h4>
              <p className="text-xs text-purple-700">
                Download a complete offline copy of all your financial ledgers, or restore from a previous backup file.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  playPopSound();
                  exportDataAsJSON(appData);
                }}
                className="flex items-center justify-center gap-2 p-3.5 rounded-2xl bg-white border border-purple-200 hover:bg-purple-50 text-purple-700 font-heading font-bold text-xs shadow-2xs transition cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Export Backup File (.json)</span>
              </button>

              <label className="flex items-center justify-center gap-2 p-3.5 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-heading font-bold text-xs shadow-2xs transition cursor-pointer">
                <Upload className="w-4 h-4" />
                <span>Import Backup File</span>
                <input type="file" accept=".json" onChange={handleFileImport} className="hidden" />
              </label>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={handleResetSample}
                className="flex items-center gap-1.5 text-xs text-rose-600 hover:text-rose-700 font-semibold cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset to Default Sample Data</span>
              </button>
            </div>
          </div>
        )}

        {/* Save Button Footer */}
        <div className="mt-8 pt-4 border-t border-slate-100 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl font-heading font-bold text-xs text-slate-600 hover:bg-slate-100 transition cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSaveAll}
            className="px-6 py-2.5 rounded-xl font-heading font-bold text-xs bg-amber-500 hover:bg-amber-600 text-white shadow-md transition cursor-pointer flex items-center gap-1.5"
          >
            <Save className="w-4 h-4" />
            <span>Save Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
};
