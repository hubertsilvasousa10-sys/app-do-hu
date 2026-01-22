
import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import AccountList from './components/AccountList';
import Financials from './components/Financials';
import { storage } from './services/storageService';
import { Account, MetricEntry, EarningEntry, Platform } from './types';
import { GoogleGenAI, Type } from "@google/genai";

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'info' | 'error';
}

// Fallback para geração de ID caso o navegador não suporte randomUUID
const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'accounts' | 'financials'>('dashboard');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [metrics, setMetrics] = useState<MetricEntry[]>([]);
  const [earnings, setEarnings] = useState<EarningEntry[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [hasError, setHasError] = useState(false);
  
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ isOpen: boolean; accountId: string | null }>({
    isOpen: false,
    accountId: null
  });

  // Carregamento inicial robusto
  useEffect(() => {
    try {
      setAccounts(storage.getAccounts() || []);
      setMetrics(storage.getMetrics() || []);
      setEarnings(storage.getEarnings() || []);
    } catch (e) {
      console.error("Erro ao carregar do storage:", e);
      setHasError(true);
    }
  }, []);

  // Persistência
  useEffect(() => { storage.saveAccounts(accounts); }, [accounts]);
  useEffect(() => { storage.saveMetrics(metrics); }, [metrics]);
  useEffect(() => { storage.saveEarnings(earnings); }, [earnings]);

  const addToast = useCallback((message: string, type: 'success' | 'info' | 'error' = 'success') => {
    const id = generateId();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
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
    setAccounts(prev => prev.map(acc => 
      acc.id === id ? { ...acc, isHot: !acc.isHot } : acc
    ));
    addToast('Status Hot atualizado!');
  };

  const handleAddMetric = (metricData: Omit<MetricEntry, 'id'>) => {
    setMetrics(prev => [...prev, { ...metricData, id: generateId() }]);
    addToast('Métricas salvas!');
  };

  const handleAddEarning = (earningData: Omit<EarningEntry, 'id'>) => {
    setEarnings(prev => [...prev, { ...earningData, id: generateId() }]);
    addToast('Ganhos registrados! 💰');
  };

  const handleAISync = async (accountId: string, base64Image?: string) => {
    const apiKey = typeof process !== 'undefined' ? process.env.API_KEY : '';
    
    if (!apiKey) {
      addToast("Chave de API não configurada no ambiente.", "error");
      return;
    }

    setIsSyncing(true);
    const account = accounts.find(a => a.id === accountId);
    if (!account) {
      setIsSyncing(false);
      return;
    }

    try {
      const ai = new GoogleGenAI({ apiKey });
      let prompt = `Extraia visualizações, quantidade de vídeos e data deste perfil social: "${account.name}". `;
      let parts: any[] = [];

      if (base64Image) {
        parts.push({
          inlineData: { mimeType: "image/jpeg", data: base64Image.split(',')[1] || base64Image }
        });
      } else if (account.profileUrl) {
        prompt += `Link do perfil: ${account.profileUrl}`;
      } else {
        addToast("Forneça um print ou link para a IA.", "error");
        setIsSyncing(false);
        return;
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

      const text = response.text;
      if (text) {
        const data = JSON.parse(text);
        handleAddMetric({
          accountId,
          views: data.views || 0,
          videosCount: data.videosCount || 1,
          date: data.date || new Date().toISOString().split('T')[0],
          platform: account.platforms[0] || Platform.TIKTOK
        });
        setAccounts(prev => prev.map(a => a.id === accountId ? { ...a, lastSync: new Date().toISOString() } : a));
        addToast("Sincronização concluída!", "success");
      }
    } catch (error) {
      console.error(error);
      addToast("Erro na sincronização IA.", "error");
    } finally {
      setIsSyncing(false);
    }
  };

  if (hasError) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50 p-6 text-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Ops! Algo deu errado.</h1>
          <p className="text-gray-500 mb-4">Houve um erro ao carregar seus dados locais.</p>
          <button onClick={() => window.location.reload()} className="bg-indigo-600 text-white px-6 py-2 rounded-xl">Recarregar Página</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen relative overflow-x-hidden">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="flex-1 p-4 md:p-8 lg:p-12 overflow-y-auto max-h-screen">
        <div className="max-w-6xl mx-auto">
          {activeTab === 'dashboard' && <Dashboard accounts={accounts} metrics={metrics} earnings={earnings} />}
          {activeTab === 'accounts' && (
            <AccountList 
              accounts={accounts}
              metrics={metrics}
              earnings={earnings}
              onAddAccount={handleAddAccount}
              onDeleteAccount={(id) => setDeleteConfirmation({ isOpen: true, accountId: id })}
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

      {/* Modais e Toasts permanecem os mesmos, mas com IDs seguros */}
      {deleteConfirmation.isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-scaleIn">
            <h3 className="text-xl font-bold mb-2">Excluir Conta?</h3>
            <p className="text-gray-500 text-sm mb-6">Esta ação não pode ser desfeita.</p>
            <div className="flex flex-col gap-2">
              <button onClick={confirmDeleteAccount} className="w-full bg-rose-600 text-white py-3 rounded-xl font-bold">Sim, Excluir</button>
              <button onClick={() => setDeleteConfirmation({ isOpen: false, accountId: null })} className="w-full bg-gray-100 text-gray-600 py-3 rounded-xl font-bold">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      <div className="fixed bottom-6 right-6 z-[110] flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <div key={t.id} className={`px-5 py-3 rounded-2xl shadow-2xl text-white font-bold animate-slideInRight pointer-events-auto ${t.type === 'success' ? 'bg-emerald-600' : t.type === 'error' ? 'bg-rose-600' : 'bg-gray-800'}`}>
            {t.message}
          </div>
        ))}
      </div>

      {isSyncing && (
        <div className="fixed inset-0 bg-indigo-900/40 backdrop-blur-md z-[200] flex flex-col items-center justify-center text-white">
          <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin mb-4"></div>
          <p className="font-bold">IA em Ação...</p>
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideDown { from { transform: translateY(-20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes scaleIn { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @keyframes slideInRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        .animate-fadeIn { animation: fadeIn 0.4s ease-out; }
        .animate-slideDown { animation: slideDown 0.3s ease-out; }
        .animate-scaleIn { animation: scaleIn 0.2s ease-out; }
        .animate-slideInRight { animation: slideInRight 0.3s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default App;
