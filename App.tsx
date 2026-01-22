
import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import AccountList from './components/AccountList';
import Financials from './components/Financials';
import { storage } from './services/storageService';
import { Account, MetricEntry, EarningEntry } from './types';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'info' | 'error';
}

// Gerador de ID resiliente para ambiente estático
const generateId = () => {
  return Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'accounts' | 'financials'>('dashboard');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [metrics, setMetrics] = useState<MetricEntry[]>([]);
  const [earnings, setEarnings] = useState<EarningEntry[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ isOpen: boolean; accountId: string | null }>({
    isOpen: false,
    accountId: null
  });

  // Carregamento inicial do LocalStorage
  useEffect(() => {
    try {
      setAccounts(storage.getAccounts());
      setMetrics(storage.getMetrics());
      setEarnings(storage.getEarnings());
    } catch (e) {
      console.error("Erro ao ler dados locais:", e);
    }
  }, []);

  // Sincronização automática com LocalStorage
  useEffect(() => { storage.saveAccounts(accounts); }, [accounts]);
  useEffect(() => { storage.saveMetrics(metrics); }, [metrics]);
  useEffect(() => { storage.saveEarnings(earnings); }, [earnings]);

  const addToast = useCallback((message: string, type: 'success' | 'info' | 'error' = 'success') => {
    const id = generateId();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  const handleAddAccount = (accData: Omit<Account, 'id'>) => {
    const newAcc: Account = {
      ...accData,
      id: generateId(),
      isHot: false,
    };
    setAccounts(prev => [...prev, newAcc]);
    addToast('Conta criada com sucesso!');
  };

  const triggerDeleteConfirmation = (id: string) => {
    setDeleteConfirmation({ isOpen: true, accountId: id });
  };

  const confirmDeleteAccount = () => {
    const id = deleteConfirmation.accountId;
    if (id) {
      setAccounts(prev => prev.filter(a => a.id !== id));
      setMetrics(prev => prev.filter(m => m.accountId !== id));
      setEarnings(prev => prev.filter(e => e.accountId !== id));
      addToast('Dados removidos permanentemente.', 'info');
    }
    setDeleteConfirmation({ isOpen: false, accountId: null });
  };

  const handleToggleHot = (id: string) => {
    setAccounts(prev => {
      const updated = prev.map(acc => 
        acc.id === id ? { ...acc, isHot: !acc.isHot } : acc
      );
      const acc = updated.find(a => a.id === id);
      addToast(acc?.isHot ? 'Foco total nesta conta! 🔥' : 'Removido da prioridade');
      return updated;
    });
  };

  const handleAddMetric = (metricData: Omit<MetricEntry, 'id'>) => {
    const newMetric: MetricEntry = {
      ...metricData,
      id: generateId(),
    };
    setMetrics(prev => [...prev, newMetric]);
    addToast('Métricas atualizadas!');
  };

  const handleAddEarning = (earningData: Omit<EarningEntry, 'id'>) => {
    const newEarning: EarningEntry = {
      ...earningData,
      id: generateId(),
    };
    setEarnings(prev => [...prev, newEarning]);
    addToast('Ganhos registrados! 💸');
  };

  const accountToBeDeleted = accounts.find(a => a.id === deleteConfirmation.accountId);

  return (
    <div className="flex flex-col md:flex-row min-h-screen relative bg-[#fcfdfe]">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="flex-1 p-4 md:p-10 lg:p-12 overflow-y-auto max-h-screen">
        <div className="max-w-6xl mx-auto">
          {activeTab === 'dashboard' && (
            <Dashboard 
              accounts={accounts} 
              metrics={metrics} 
              earnings={earnings} 
            />
          )}
          
          {activeTab === 'accounts' && (
            <AccountList 
              accounts={accounts}
              metrics={metrics}
              earnings={earnings}
              onAddAccount={handleAddAccount}
              onDeleteAccount={triggerDeleteConfirmation}
              onAddMetric={handleAddMetric}
              onAddEarning={handleAddEarning}
              onToggleHot={handleToggleHot}
            />
          )}

          {activeTab === 'financials' && (
            <Financials 
              accounts={accounts} 
              earnings={earnings} 
            />
          )}
        </div>
      </main>

      {/* Modal de Exclusão */}
      {deleteConfirmation.isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-8 animate-scaleIn">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                ⚠️
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Atenção!</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                A conta <span className="font-bold text-gray-800">{accountToBeDeleted?.name}</span> e todo seu histórico serão apagados para sempre.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <button 
                onClick={confirmDeleteAccount}
                className="w-full bg-rose-600 text-white py-4 rounded-2xl font-bold hover:bg-rose-700 transition-all shadow-lg shadow-rose-100"
              >
                Confirmar Exclusão
              </button>
              <button 
                onClick={() => setDeleteConfirmation({ isOpen: false, accountId: null })}
                className="w-full bg-slate-100 text-slate-600 py-4 rounded-2xl font-bold hover:bg-slate-200 transition-all"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toasts */}
      <div className="fixed bottom-6 right-6 z-[110] flex flex-col gap-3">
        {toasts.map(toast => (
          <div 
            key={toast.id} 
            className={`px-6 py-4 rounded-2xl shadow-2xl text-white font-bold flex items-center gap-3 animate-slideInRight ${
              toast.type === 'success' ? 'bg-emerald-600' : 
              toast.type === 'error' ? 'bg-rose-600' : 'bg-slate-800'
            }`}
          >
            <span>{toast.type === 'success' ? '⚡' : toast.type === 'info' ? 'ℹ️' : '⚠️'}</span>
            {toast.message}
          </div>
        ))}
      </div>

      <style>{`
        @keyframes slideInRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes scaleIn { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .animate-slideInRight { animation: slideInRight 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
        .animate-scaleIn { animation: scaleIn 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
      `}</style>
    </div>
  );
};

export default App;
