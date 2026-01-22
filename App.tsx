
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

const generateId = () => Math.random().toString(36).substring(2, 9) + Date.now().toString(36);

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

  // Carregamento inicial
  useEffect(() => {
    try {
      const savedAcc = storage.getAccounts();
      const savedMet = storage.getMetrics();
      const savedEar = storage.getEarnings();
      if (savedAcc) setAccounts(savedAcc);
      if (savedMet) setMetrics(savedMet);
      if (savedEar) setEarnings(savedEar);
    } catch (e) {
      console.error("Erro no carregamento do storage:", e);
    }
  }, []);

  // Sincronização
  useEffect(() => { storage.saveAccounts(accounts); }, [accounts]);
  useEffect(() => { storage.saveMetrics(metrics); }, [metrics]);
  useEffect(() => { storage.saveEarnings(earnings); }, [earnings]);

  const addToast = useCallback((message: string, type: 'success' | 'info' | 'error' = 'success') => {
    const id = generateId();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  }, []);

  const handleAddAccount = (accData: Omit<Account, 'id'>) => {
    const newAcc: Account = { ...accData, id: generateId(), isHot: false };
    setAccounts(prev => [...prev, newAcc]);
    addToast('Conta criada com sucesso!');
  };

  const triggerDeleteConfirmation = (id: string) => setDeleteConfirmation({ isOpen: true, accountId: id });

  const confirmDeleteAccount = () => {
    const id = deleteConfirmation.accountId;
    if (id) {
      setAccounts(prev => prev.filter(a => a.id !== id));
      setMetrics(prev => prev.filter(m => m.accountId !== id));
      setEarnings(prev => prev.filter(e => e.accountId !== id));
      addToast('Dados removidos.', 'info');
    }
    setDeleteConfirmation({ isOpen: false, accountId: null });
  };

  const handleToggleHot = (id: string) => {
    setAccounts(prev => prev.map(acc => acc.id === id ? { ...acc, isHot: !acc.isHot } : acc));
    addToast('Prioridade atualizada!');
  };

  const handleAddMetric = (metricData: Omit<MetricEntry, 'id'>) => {
    setMetrics(prev => [...prev, { ...metricData, id: generateId() }]);
    addToast('Métricas atualizadas!');
  };

  const handleAddEarning = (earningData: Omit<EarningEntry, 'id'>) => {
    setEarnings(prev => [...prev, { ...earningData, id: generateId() }]);
    addToast('Ganhos registrados! 💸');
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-[#fcfdfe]">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="flex-1 p-4 md:p-10 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          {activeTab === 'dashboard' && <Dashboard accounts={accounts} metrics={metrics} earnings={earnings} />}
          {activeTab === 'accounts' && <AccountList accounts={accounts} metrics={metrics} earnings={earnings} onAddAccount={handleAddAccount} onDeleteAccount={triggerDeleteConfirmation} onAddMetric={handleAddMetric} onAddEarning={handleAddEarning} onToggleHot={handleToggleHot} />}
          {activeTab === 'financials' && <Financials accounts={accounts} earnings={earnings} />}
        </div>
      </main>

      {/* Toasts */}
      <div className="fixed bottom-6 right-6 z-[110] flex flex-col gap-3">
        {toasts.map(t => (
          <div key={t.id} className={`px-6 py-4 rounded-2xl shadow-xl text-white font-bold animate-slideIn ${t.type === 'success' ? 'bg-emerald-600' : 'bg-slate-800'}`}>
            {t.message}
          </div>
        ))}
      </div>

      {/* Modal Simples de Confirmação */}
      {deleteConfirmation.isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full">
            <h3 className="text-xl font-bold mb-4 text-center">Confirmar exclusão?</h3>
            <div className="flex flex-col gap-3">
              <button onClick={confirmDeleteAccount} className="bg-red-600 text-white py-3 rounded-xl font-bold">Sim, apagar tudo</button>
              <button onClick={() => setDeleteConfirmation({ isOpen: false, accountId: null })} className="bg-gray-100 py-3 rounded-xl font-bold">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        .animate-slideIn { animation: slideIn 0.3s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default App;
