import React, { useState, useEffect } from 'react';
import { AppData, CashTransaction, GirlProfile, SavingsGoal, SavingsSnapshot } from './types/finance';
import { INITIAL_DATA, loadAppData, saveAppData, DEFAULT_GOOGLE_SHEET_URL } from './services/storage';
import {
  fetchFromGoogleSheet,
  pushToGoogleSheet,
  pushTransactionToGoogle,
  pushSavingsToGoogle,
  pushGoalToGoogle,
} from './services/googleSheetsSync';
import { Header } from './components/Header';
import { KidDashboard } from './components/KidView/KidDashboard';
import { ParentDashboard } from './components/ParentView/ParentDashboard';
import { ParentPinModal } from './components/ParentPinModal';
import { TransactionModal } from './components/TransactionModal';
import { SavingsModal } from './components/SavingsModal';
import { GoalModal } from './components/GoalModal';
import { SettingsModal } from './components/SettingsModal';
import { playFanfareSound, playPopSound } from './utils/audio';

export function App() {
  const [appData, setAppData] = useState<AppData>(loadAppData);
  const [selectedGirlId, setSelectedGirlId] = useState<string>(
    appData.girls[0]?.id || 'girl_1'
  );
  const [isParentMode, setIsParentMode] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Modals
  const [isPinModalOpen, setIsPinModalOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState<boolean>(false);
  const [editingTransaction, setEditingTransaction] = useState<CashTransaction | null>(null);

  const [isSavingsModalOpen, setIsSavingsModalOpen] = useState<boolean>(false);
  const [editingSnapshot, setEditingSnapshot] = useState<SavingsSnapshot | null>(null);

  const [isGoalModalOpen, setIsGoalModalOpen] = useState<boolean>(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);

  // Initial cloud sync on startup only (never clobber on window focus or typing)
  useEffect(() => {
    const activeUrl = appData.googleSheetScriptUrl || DEFAULT_GOOGLE_SHEET_URL;
    handleSilentPull(activeUrl);
  }, []);

  const handleSilentPull = async (url: string) => {
    try {
      const cloudData = await fetchFromGoogleSheet(url);
      if (cloudData && cloudData.girls && cloudData.girls.length > 0) {
        setAppData(cloudData);
        saveAppData(cloudData, false);
      }
    } catch (err) {
      console.warn('Silent cloud pull failed:', err);
    }
  };

  const updateStateAndStorage = (newData: AppData, pushToCloud = true) => {
    setAppData(newData);
    saveAppData(newData, false);

    if (pushToCloud) {
      const activeUrl = newData.googleSheetScriptUrl || DEFAULT_GOOGLE_SHEET_URL;
      if (activeUrl) {
        setIsSyncing(true);
        pushToGoogleSheet(activeUrl, newData)
          .catch((err) => console.warn('Background auto-push failed:', err))
          .finally(() => setIsSyncing(false));
      }
    }
  };

  const handleCloudSync = async (url: string, showNotification = true) => {
    if (!url) return;
    setIsSyncing(true);
    try {
      // First push current data to Google Sheet
      await pushToGoogleSheet(url, appData);
      
      // Allow Google Apps Script 800ms to complete spreadsheet writes
      await new Promise(r => setTimeout(r, 800));

      const cloudData = await fetchFromGoogleSheet(url);
      if (cloudData && cloudData.girls && cloudData.girls.length > 0) {
        setAppData(cloudData);
        saveAppData(cloudData, false);
      }
      
      if (showNotification) {
        playFanfareSound();
        alert('Data successfully saved & synced to your Google Sheet! ☁️✨ Check your spreadsheet tabs (Cash Ledger & Custodial Savings).');
      }
    } catch (err: any) {
      console.error('Sync error:', err);
      if (showNotification) {
        alert(
          'Sync Notice: Unable to reach Google Sheet.\n\nPlease ensure your Google Apps Script deployment is set to:\n1. Execute as: "Me"\n2. Who has access: "Anyone"'
        );
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const handlePushToCloud = async (url: string) => {
    if (!url) return;
    setIsSyncing(true);
    try {
      await pushToGoogleSheet(url, appData);
      playFanfareSound();
      alert('Successfully uploaded all records to your Google Sheet! 🚀 Check your spreadsheet tabs.');
    } catch (err) {
      alert('Failed to upload to Google Sheet: ' + err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handlePullFromCloud = async (url: string) => {
    if (!url) return;
    setIsSyncing(true);
    try {
      const cloudData = await fetchFromGoogleSheet(url);
      if (cloudData) {
        updateStateAndStorage(cloudData);
        playFanfareSound();
        alert('Successfully fetched latest data from Google Sheet! 📥');
      } else {
        alert('Google Sheet data is currently empty.');
      }
    } catch (err) {
      alert('Failed to pull from Google Sheet: ' + err);
    } finally {
      setIsSyncing(false);
    }
  };

  const safeGirls: GirlProfile[] = (appData.girls && appData.girls.length > 0) ? appData.girls : INITIAL_DATA.girls;
  const currentGirl: GirlProfile = safeGirls.find((g: GirlProfile) => g.id === selectedGirlId) || safeGirls[0];
  const safeTransactions = appData.transactions || [];
  const safeSavings = appData.savingsSnapshots || [];
  const safeGoals = appData.goals || [];

  // Cash Transaction Handlers
  const handleSaveTransaction = (
    txData: Omit<CashTransaction, 'id' | 'createdAt'>,
    editingId?: string
  ) => {
    if (editingId) {
      const updated = safeTransactions.map((t) =>
        t.id === editingId ? { ...t, ...txData } : t
      );
      updateStateAndStorage({ ...appData, transactions: updated });
    } else {
      const newTx: CashTransaction = {
        ...txData,
        id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        createdAt: new Date().toISOString(),
      };
      updateStateAndStorage({
        ...appData,
        transactions: [newTx, ...safeTransactions],
      });
    }
  };

  const handleDeleteTransaction = (id: string) => {
    const updated = safeTransactions.filter((t) => t.id !== id);
    updateStateAndStorage({ ...appData, transactions: updated });
  };

  // Savings Snapshot Handlers
  const handleSaveSavingsSnapshot = (
    snapData: Omit<SavingsSnapshot, 'id' | 'createdAt'>,
    editingId?: string
  ) => {
    if (editingId) {
      const updated = safeSavings.map((s) =>
        s.id === editingId ? { ...s, ...snapData } : s
      );
      updateStateAndStorage({ ...appData, savingsSnapshots: updated });
    } else {
      const newSnap: SavingsSnapshot = {
        ...snapData,
        id: `sav_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        createdAt: new Date().toISOString(),
      };
      updateStateAndStorage({
        ...appData,
        savingsSnapshots: [newSnap, ...safeSavings],
      });
    }
  };

  const handleDeleteSavingsSnapshot = (id: string) => {
    const updated = safeSavings.filter((s) => s.id !== id);
    updateStateAndStorage({ ...appData, savingsSnapshots: updated });
  };

  // Goal Handlers
  const handleSaveGoal = (goalData: Omit<SavingsGoal, 'id'>, editingId?: string) => {
    if (editingId) {
      const updated = safeGoals.map((g) =>
        g.id === editingId ? { ...g, ...goalData } : g
      );
      updateStateAndStorage({ ...appData, goals: updated });
    } else {
      const newGoal: SavingsGoal = {
        ...goalData,
        id: `goal_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      };
      updateStateAndStorage({ ...appData, goals: [...safeGoals, newGoal] });
    }
  };

  const handleDeleteGoal = (id: string) => {
    const updated = safeGoals.filter((g) => g.id !== id);
    updateStateAndStorage({ ...appData, goals: updated });
  };

  const handleToggleGoalComplete = (id: string) => {
    const updated = safeGoals.map((g) =>
      g.id === id ? { ...g, completed: !g.completed } : g
    );
    updateStateAndStorage({ ...appData, goals: updated });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/30 via-pink-50/20 to-purple-50/30">
      {/* Top Header */}
      <Header
        girls={safeGirls}
        selectedGirlId={currentGirl.id}
        onSelectGirl={setSelectedGirlId}
        isParentMode={isParentMode}
        onRequestParentMode={() => setIsPinModalOpen(true)}
        onExitParentMode={() => setIsParentMode(false)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        isSyncing={isSyncing}
        onTriggerSync={() =>
          appData.googleSheetScriptUrl && handleCloudSync(appData.googleSheetScriptUrl, true)
        }
        hasGoogleSheet={Boolean(appData.googleSheetScriptUrl)}
      />

      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-4 py-6">
        {isParentMode ? (
          <ParentDashboard
            girl={currentGirl}
            transactions={safeTransactions}
            savingsSnapshots={safeSavings}
            goals={safeGoals}
            onAddTransaction={() => {
              setEditingTransaction(null);
              setIsTransactionModalOpen(true);
            }}
            onEditTransaction={(tx) => {
              setEditingTransaction(tx);
              setIsTransactionModalOpen(true);
            }}
            onDeleteTransaction={handleDeleteTransaction}
            onAddSavingsSnapshot={() => {
              setEditingSnapshot(null);
              setIsSavingsModalOpen(true);
            }}
            onEditSavingsSnapshot={(snapshot) => {
              setEditingSnapshot(snapshot);
              setIsSavingsModalOpen(true);
            }}
            onDeleteSavingsSnapshot={handleDeleteSavingsSnapshot}
            onAddGoal={() => {
              setEditingGoal(null);
              setIsGoalModalOpen(true);
            }}
            onEditGoal={(goal) => {
              setEditingGoal(goal);
              setIsGoalModalOpen(true);
            }}
            onDeleteGoal={handleDeleteGoal}
            onToggleGoalComplete={handleToggleGoalComplete}
          />
        ) : (
          <KidDashboard
            girl={currentGirl}
            transactions={safeTransactions}
            savingsSnapshots={safeSavings}
            goals={safeGoals}
            onAddGoalClick={() => {
              setEditingGoal(null);
              setIsGoalModalOpen(true);
            }}
          />
        )}
      </main>

      {/* Modals */}
      <ParentPinModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        onSuccess={() => {
          setIsPinModalOpen(false);
          setIsParentMode(true);
        }}
        correctPin={appData.parentPin}
      />

      <TransactionModal
        isOpen={isTransactionModalOpen}
        onClose={() => {
          setIsTransactionModalOpen(false);
          setEditingTransaction(null);
        }}
        onSave={handleSaveTransaction}
        editingTransaction={editingTransaction}
        girlId={currentGirl.id}
        girlName={currentGirl.name}
      />

      <SavingsModal
        isOpen={isSavingsModalOpen}
        onClose={() => {
          setIsSavingsModalOpen(false);
          setEditingSnapshot(null);
        }}
        onSave={handleSaveSavingsSnapshot}
        editingSnapshot={editingSnapshot}
        girlId={currentGirl.id}
        girlName={currentGirl.name}
      />

      <GoalModal
        isOpen={isGoalModalOpen}
        onClose={() => {
          setIsGoalModalOpen(false);
          setEditingGoal(null);
        }}
        onSave={handleSaveGoal}
        editingGoal={editingGoal}
        girlId={currentGirl.id}
        girlName={currentGirl.name}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        appData={appData}
        onSaveAppData={updateStateAndStorage}
        onManualSync={(url) => handleCloudSync(url, true)}
        onPushToCloud={handlePushToCloud}
        onPullFromCloud={handlePullFromCloud}
        isSyncing={isSyncing}
        isParentMode={isParentMode}
        onRequestParentMode={() => setIsPinModalOpen(true)}
      />
    </div>
  );
}
