
import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import AccountList from './components/AccountList';
import Financials from './components/Financials';
import { storage } from './services/storageService';
import { Account, MetricEntry, EarningEntry } from './types';
import { GoogleGenAI, Type } from "@google/genai";

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'info' | 'error';
}

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'accounts' | 'financials'>('dashboard');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [metrics, setMetrics] = useState<MetricEntry[]>([]);
  const [earnings, setEarnings] = useState<EarningEntry[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ isOpen: boolean; accountId: string | null }>({
    isOpen: false,
    accountId: null
  });

  // Carregamento inicial do LocalStorage (Persistência Estática)
  useEffect(() => {
    setAccounts(storage.getAccounts());
    setMetrics(storage.getMetrics());
    setEarnings(storage.getEarnings());
  }, []);

  // Salvar sempre que houver mudanças
  useEffect(() => { storage.saveAccounts(accounts); }, [accounts]);
  useEffect(() => { storage.saveMetrics(metrics); }, [metrics]);
  useEffect(() => { storage.saveEarnings(earnings); }, [earnings]);

  const addToast = useCallback((message: string, type: 'success' | 'info' | 'error' = 'success') => {
    const id = crypto.randomUUID();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const handleAddAccount = (accData: Omit<Account, 'id'>) => {
    const newAcc: Account = {
      ...accData,
      id: crypto.randomUUID(),
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
      addToast('Conta e dados removidos permanentemente.', 'info');
    }
    setDeleteConfirmation({ isOpen: false, accountId: null });
  };

  const handleToggleHot = (id: string) => {
    setAccounts(prev => {
      const updated = prev.map(acc => 
        acc.id === id ? { ...acc, isHot: !acc.isHot } : acc
      );
      const acc = updated.find(a => a.id === id);
      addToast(acc?.isHot ? 'Adicionado à Hot List 🔥' : 'Removido da Hot List');
      return updated;
    });
  };

  const handleAddMetric = (metricData: Omit<MetricEntry, 'id'>) => {
    const newMetric: MetricEntry = {
      ...metricData,
      id: crypto.randomUUID(),
    };
    setMetrics(prev => [...prev, newMetric]);
    addToast('Métricas salvas!');
  };

  const handleAddEarning = (earningData: Omit<EarningEntry, 'id'>) => {
    const newEarning: EarningEntry = {
      ...earningData,
      id: crypto.randomUUID(),
    };
    setEarnings(prev => [...prev, newEarning]);
    addToast('Ganhos registrados! 💰');
  };

  const handleAISync = async (accountId: string, base64Image?: string) => {
    setIsSyncing(true);
    const account = accounts.find(a => a.id === accountId);
    if (!account) return;

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      let prompt = `Analise as métricas de redes sociais para a conta "${account.name}". `;
      let parts: any[] = [];

      if (base64Image) {
        prompt += "Extraia visualizações (views), vídeos e data. Retorne JSON.";
        parts.push({
          inlineData: { mimeType: "image/jpeg", data: base64Image.split(',')[1] || base64Image }
        });
      } else {
        prompt += `Acesse ${account.profileUrl} e busque views recentes.`;
      }

      parts.push({ text: prompt });

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: { parts },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              views: { type: Type.NUMBER },
              videosCount: { type: Type.NUMBER },
              date: { type: Type.STRING }
            },
            required: ["views", "videosCount", "date"]
          },
          tools: account.profileUrl ? [{ googleSearch: {} }] : []
        }
      });

      const data = JSON.parse(response.text || '{}');
      if (data.views) {
        handleAddMetric({
          accountId,
          views: data.views,
          videosCount: data.videosCount || 1,
          date: data.date || new Date().toISOString().split('T')[0],
          platform: account.platforms[0]
        });
        setAccounts(prev => prev.map(a => a.id === accountId ? { ...a, lastSync: new Date().toISOString() } : a));
        addToast(`Sincronização OK! +${data.views.toLocaleString()} views.`, "success");
      }
    } catch (error) {
      addToast("Erro na sincronização IA.", "error");
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen relative">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="flex-1 p-4 md:p-12 overflow-y-auto max-h-screen bg-[#fcfdfe]">
        <div className="max-w-6xl mx-auto">
          {activeTab === 'dashboard' && <Dashboard accounts={accounts} metrics={metrics} earnings={earnings} />}
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
              onAISync={handleAISync}
              isSyncing={isSyncing}
            />
          )}
          {activeTab === 'financials' && <Financials accounts={accounts} earnings={earnings} />}
        </div>
      </main>

      {/* Confirmação de Exclusão */}
      {deleteConfirmation.isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full animate-scaleIn">
            <h3 className="text-xl font-bold mb-2">Excluir Conta?</h3>
            <p className="text-gray-500 text-sm mb-6">Todos os dados de visualizações e ganhos serão perdidos para sempre.</p>
            <div className="flex flex-col gap-2">
              <button onClick={confirmDeleteAccount} className="w-full bg-rose-600 text-white py-3 rounded-xl font-bold">Sim, Excluir</button>
              <button onClick={() => setDeleteConfirmation({ isOpen: false, accountId: null })} className="w-full bg-gray-100 text-gray-600 py-3 rounded-xl font-bold">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Toasts */}
      <div className="fixed bottom-6 right-6 z-[300] flex flex-col gap-2">
        {toasts.map(t => (
          <div key={t.id} className={`px-5 py-3 rounded-2xl shadow-xl text-white font-bold animate-slideInRight ${t.type === 'success' ? 'bg-emerald-600' : t.type === 'error' ? 'bg-rose-600' : 'bg-gray-800'}`}>
            {t.message}
          </div>
        ))}
      </div>

      {isSyncing && (
        <div className="fixed inset-0 bg-indigo-900/40 backdrop-blur-md z-[400] flex flex-col items-center justify-center text-white">
          <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin mb-4"></div>
          <p className="text-lg font-bold">IA Analisando...</p>
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideDown { from { transform: translateY(-20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes scaleIn { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @keyframes slideInRight { from { transform: translateX(50px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        .animate-fadeIn { animation: fadeIn 0.4s ease-out; }
        .animate-slideDown { animation: slideDown 0.3s ease-out; }
        .animate-scaleIn { animation: scaleIn 0.2s ease-out; }
        .animate-slideInRight { animation: slideInRight 0.3s ease-out; }
      `}</style>
    </div>
  );
};

export default App;
