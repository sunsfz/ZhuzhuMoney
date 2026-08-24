import React, { useState, useEffect } from 'react';
import { AppData, CashTransaction, GirlProfile, SavingsGoal, SavingsSnapshot } from './types/finance';
import { loadAppData, saveAppData } from './services/storage';
import { fetchFromGoogleSheet, pushToGoogleSheet } from './services/googleSheetsSync';
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

  // Initial cloud sync and auto-fetch on window focus (when switching apps or waking up iPad)
  useEffect(() => {
    if (appData.googleSheetScriptUrl) {
      handleSilentPull(appData.googleSheetScriptUrl);
    }

    const handleFocus = () => {
      if (appData.googleSheetScriptUrl) {
        handleSilentPull(appData.googleSheetScriptUrl);
      }
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && appData.googleSheetScriptUrl) {
        handleSilentPull(appData.googleSheetScriptUrl);
      }
    });

    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [appData.googleSheetScriptUrl]);

  const handleSilentPull = async (url: string) => {
    try {
      const cloudData = await fetchFromGoogleSheet(url);
      if (cloudData && cloudData.girls && cloudData.girls.length > 0) {
        setAppData(cloudData);
        saveAppData(cloudData);
      }
    } catch {
      // Background sync silently fails if offline
    }
  };

  const updateStateAndStorage = (newData: AppData) => {
    setAppData(newData);
    saveAppData(newData);
  };

  const handleCloudSync = async (url: string, showNotification = true) => {
    if (!url) return;
    setIsSyncing(true);
    try {
      // First push current data to guarantee Google Sheet is up to date and populated
      await pushToGoogleSheet(url, appData);
      
      const cloudData = await fetchFromGoogleSheet(url);
      if (cloudData && cloudData.girls && cloudData.girls.length > 0) {
        updateStateAndStorage(cloudData);
      }
      
      if (showNotification) {
        playFanfareSound();
        alert('Data successfully saved & synced to your Google Sheet! ☁️✨ Check your spreadsheet tabs (Cash Ledger & Custodial Savings).');
      }
    } catch (err) {
      console.error('Sync error:', err);
      if (showNotification) {
        alert('Sync error: Please make sure your Apps Script Web App is deployed with "Who has access: Anyone".');
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

  const currentGirl = appData.girls.find((g) => g.id === selectedGirlId) || appData.girls[0];

  // Cash Transaction Handlers
  const handleSaveTransaction = (
    txData: Omit<CashTransaction, 'id' | 'createdAt'>,
    editingId?: string
  ) => {
    if (editingId) {
      const updated = appData.transactions.map((t) =>
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
        transactions: [newTx, ...appData.transactions],
      });
    }
  };

  const handleDeleteTransaction = (id: string) => {
    const updated = appData.transactions.filter((t) => t.id !== id);
    updateStateAndStorage({ ...appData, transactions: updated });
  };

  // Savings Snapshot Handlers
  const handleSaveSavingsSnapshot = (
    snapData: Omit<SavingsSnapshot, 'id' | 'createdAt'>,
    editingId?: string
  ) => {
    if (editingId) {
      const updated = appData.savingsSnapshots.map((s) =>
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
        savingsSnapshots: [newSnap, ...appData.savingsSnapshots],
      });
    }
  };

  const handleDeleteSavingsSnapshot = (id: string) => {
    const updated = appData.savingsSnapshots.filter((s) => s.id !== id);
    updateStateAndStorage({ ...appData, savingsSnapshots: updated });
  };

  // Goal Handlers
  const handleSaveGoal = (goalData: Omit<SavingsGoal, 'id'>, editingId?: string) => {
    if (editingId) {
      const updated = appData.goals.map((g) =>
        g.id === editingId ? { ...g, ...goalData } : g
      );
      updateStateAndStorage({ ...appData, goals: updated });
    } else {
      const newGoal: SavingsGoal = {
        ...goalData,
        id: `goal_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      };
      updateStateAndStorage({ ...appData, goals: [...appData.goals, newGoal] });
    }
  };

  const handleDeleteGoal = (id: string) => {
    const updated = appData.goals.filter((g) => g.id !== id);
    updateStateAndStorage({ ...appData, goals: updated });
  };

  const handleToggleGoalComplete = (id: string) => {
    const updated = appData.goals.map((g) =>
      g.id === id ? { ...g, completed: !g.completed } : g
    );
    updateStateAndStorage({ ...appData, goals: updated });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/30 via-pink-50/20 to-purple-50/30">
      {/* Top Header */}
      <Header
        girls={appData.girls}
        selectedGirlId={selectedGirlId}
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
            transactions={appData.transactions}
            savingsSnapshots={appData.savingsSnapshots}
            goals={appData.goals}
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
            transactions={appData.transactions}
            savingsSnapshots={appData.savingsSnapshots}
            goals={appData.goals}
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
