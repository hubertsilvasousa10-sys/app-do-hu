
import React, { useState, useRef } from 'react';
import { Account, Platform, MetricEntry, EarningEntry } from '../types';

interface AccountListProps {
  accounts: Account[];
  metrics: MetricEntry[];
  earnings: EarningEntry[];
  onAddAccount: (acc: Omit<Account, 'id'>) => void;
  onDeleteAccount: (id: string) => void;
  onAddMetric: (m: Omit<MetricEntry, 'id'>) => void;
  onAddEarning: (e: Omit<EarningEntry, 'id'>) => void;
  onToggleHot: (id: string) => void;
  onAISync: (id: string, base64?: string) => Promise<void>;
  isSyncing: boolean;
}

const AccountList: React.FC<AccountListProps> = ({ 
  accounts, metrics, earnings, onAddAccount, onDeleteAccount, onAddMetric, onAddEarning, onToggleHot, onAISync, isSyncing
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [syncingAccountId, setSyncingAccountId] = useState<string | null>(null);

  // Estados dos formulários de criação
  const [newAcc, setNewAcc] = useState<{name: string, platforms: Platform[], niche: string, createdAt: string, profileUrl: string}>({ 
    name: '', 
    platforms: [Platform.TIKTOK], 
    niche: '', 
    createdAt: new Date().toISOString().split('T')[0],
    profileUrl: ''
  });

  // Estados dos modais de lançamento
  const [metricModal, setMetricModal] = useState<{ open: boolean, account: Account | null }>({ open: false, account: null });
  const [earningModal, setEarningModal] = useState<{ open: boolean, account: Account | null }>({ open: false, account: null });

  // Estados dos novos dados a serem lançados
  const [newMetric, setNewMetric] = useState({ views: 0, videosCount: 1, date: new Date().toISOString().split('T')[0], platform: Platform.TIKTOK });
  const [newEarning, setNewEarning] = useState({ amount: 0, date: new Date().toISOString().split('T')[0], description: '' });

  const hotAccounts = accounts.filter(a => a.isHot);
  const normalAccounts = accounts.filter(a => !a.isHot);

  const getAccountStats = (id: string) => {
    const accMetrics = metrics.filter(m => m.accountId === id);
    const accEarnings = earnings.filter(e => e.accountId === id);
    return {
      views: accMetrics.reduce((acc, m) => acc + m.views, 0),
      earnings: accEarnings.reduce((acc, e) => acc + e.amount, 0),
    };
  };

  const handleTogglePlatform = (p: Platform) => {
    setNewAcc(prev => ({
      ...prev,
      platforms: prev.platforms.includes(p) 
        ? (prev.platforms.length > 1 ? prev.platforms.filter(x => x !== p) : prev.platforms) 
        : [...prev.platforms, p]
    }));
  };

  const triggerSync = (id: string) => {
    setSyncingAccountId(id);
    const account = accounts.find(a => a.id === id);
    if (account?.profileUrl && confirm("Usar IA para buscar dados via Link Público? (Cancele para fazer upload de um print)")) {
      onAISync(id);
    } else {
      fileInputRef.current?.click();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && syncingAccountId) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onAISync(syncingAccountId, reader.result as string);
        setSyncingAccountId(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const renderAccountCard = (account: Account) => {
    const stats = getAccountStats(account.id);
    return (
      <div key={account.id} className={`bg-white rounded-2xl border ${account.isHot ? 'border-orange-400 ring-2 ring-orange-100' : 'border-gray-100'} shadow-sm hover:shadow-md transition-all flex flex-col`}>
        <div className="p-5 flex justify-between items-start border-b border-gray-50">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-bold text-gray-900">{account.name}</h4>
              <button onClick={() => onToggleHot(account.id)} className={`text-sm ${account.isHot ? 'text-orange-500' : 'text-gray-300'}`}>
                {account.isHot ? '🔥' : '☆'}
              </button>
            </div>
            <p className="text-xs text-indigo-600 font-medium mb-2">{account.niche}</p>
            <div className="flex flex-wrap gap-1">
              {account.platforms.map(p => (
                <span key={p} className="text-[9px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 font-bold uppercase">{p}</span>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => triggerSync(account.id)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-colors">✨</button>
            <button onClick={() => onDeleteAccount(account.id)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition-colors">🗑️</button>
          </div>
        </div>
        
        <div className="p-5 flex-1">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-gray-50 p-3 rounded-xl text-center">
              <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Total Views</p>
              <p className="text-lg font-black text-gray-800">{stats.views.toLocaleString()}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-xl text-center">
              <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Ganhos</p>
              <p className="text-lg font-black text-emerald-600">R$ {stats.earnings.toFixed(2)}</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={() => {
                setNewMetric(prev => ({ ...prev, platform: account.platforms[0] }));
                setMetricModal({ open: true, account });
              }}
              className="flex-1 py-2 rounded-xl border border-indigo-200 text-indigo-600 text-xs font-bold hover:bg-indigo-50"
            >
              Métricas
            </button>
            <button 
              onClick={() => setEarningModal({ open: true, account })}
              className="flex-1 py-2 rounded-xl border border-emerald-200 text-emerald-600 text-xs font-bold hover:bg-emerald-50"
            >
              Ganhos
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />

      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Suas Contas</h2>
          <p className="text-gray-500">Gerencie múltiplos perfis e use a IA para automatizar.</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all"
        >
          + Criar Perfil
        </button>
      </header>

      {isAdding && (
        <div className="bg-white p-6 rounded-3xl border-2 border-indigo-50 shadow-xl animate-slideDown">
          <h3 className="text-lg font-bold mb-6 text-gray-900">Novo Perfil Multi-Rede</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="space-y-4">
              <input type="text" placeholder="Nome da Conta (ex: @usuario)" className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none" value={newAcc.name} onChange={e => setNewAcc({...newAcc, name: e.target.value})} />
              <input type="text" placeholder="Nicho / Assunto" className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none" value={newAcc.niche} onChange={e => setNewAcc({...newAcc, niche: e.target.value})} />
              <input type="url" placeholder="URL do Perfil (Opcional para IA)" className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none" value={newAcc.profileUrl} onChange={e => setNewAcc({...newAcc, profileUrl: e.target.value})} />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase mb-3 block">Plataformas da Conta</label>
              <div className="flex flex-wrap gap-2">
                {[Platform.TIKTOK, Platform.INSTAGRAM, Platform.YOUTUBE_SHORTS].map(p => (
                  <button 
                    key={p} 
                    onClick={() => handleTogglePlatform(p)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${newAcc.platforms.includes(p) ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white border-gray-200 text-gray-400 hover:border-indigo-300'}`}
                  >
                    {p}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-gray-400 mt-4 italic">* Você pode selecionar várias para uma mesma conta.</p>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-50">
            <button onClick={() => setIsAdding(false)} className="px-6 py-2 text-gray-400 font-bold">Cancelar</button>
            <button 
              disabled={!newAcc.name}
              onClick={() => { onAddAccount(newAcc); setIsAdding(false); }}
              className="bg-indigo-600 text-white px-10 py-2.5 rounded-xl font-bold disabled:opacity-50"
            >
              Salvar Perfil
            </button>
          </div>
        </div>
      )}

      {hotAccounts.length > 0 && (
        <section>
          <h3 className="text-sm font-black text-orange-500 uppercase tracking-widest mb-4 flex items-center gap-2">🔥 Em Alta</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {hotAccounts.map(account => renderAccountCard(account))}
          </div>
        </section>
      )}

      <section>
        <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4">📱 Demais Perfis</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {normalAccounts.map(account => renderAccountCard(account))}
          {accounts.length === 0 && !isAdding && (
            <div className="col-span-full py-20 text-center border-2 border-dashed border-gray-200 rounded-3xl text-gray-400">
              Nenhuma conta cadastrada. Clique em "+ Criar Perfil" para começar.
            </div>
          )}
        </div>
      </section>

      {/* MODAL DE MÉTRICAS */}
      {metricModal.open && metricModal.account && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white w-full max-w-md p-8 rounded-3xl shadow-2xl animate-scaleIn">
            <h3 className="text-xl font-bold mb-6">Lançar Dados Manuais</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase block mb-1">Rede Social</label>
                <select 
                  className="w-full border p-3 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                  value={newMetric.platform}
                  onChange={e => setNewMetric({...newMetric, platform: e.target.value as Platform})}
                >
                  {metricModal.account.platforms.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase block mb-1">Visualizações</label>
                  <input type="number" className="w-full border p-3 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" onChange={e => setNewMetric({...newMetric, views: Number(e.target.value)})} />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase block mb-1">Postagens</label>
                  <input type="number" defaultValue={1} className="w-full border p-3 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" onChange={e => setNewMetric({...newMetric, videosCount: Number(e.target.value)})} />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase block mb-1">Data</label>
                <input type="date" className="w-full border p-3 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" value={newMetric.date} onChange={e => setNewMetric({...newMetric, date: e.target.value})} />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-8">
              <button onClick={() => setMetricModal({ open: false, account: null })} className="text-gray-400 font-bold px-4">Fechar</button>
              <button 
                onClick={() => { onAddMetric({ ...newMetric, accountId: metricModal.account!.id }); setMetricModal({ open: false, account: null }); }}
                className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE GANHOS */}
      {earningModal.open && earningModal.account && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white w-full max-w-md p-8 rounded-3xl shadow-2xl animate-scaleIn border-t-8 border-emerald-500">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">💰 Registrar Receita</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase block mb-1">Valor do Pagamento (R$)</label>
                <input 
                  type="number" 
                  step="0.01" 
                  autoFocus
                  placeholder="0,00"
                  className="w-full p-4 rounded-xl border-2 border-emerald-50 text-3xl font-black text-emerald-600 focus:border-emerald-500 outline-none" 
                  onChange={e => setNewEarning({...newEarning, amount: Number(e.target.value)})} 
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase block mb-1">Fonte / Descrição</label>
                <input type="text" placeholder="Ex: Monetização TikTok, Publi..." className="w-full border p-3 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500" value={newEarning.description} onChange={e => setNewEarning({...newEarning, description: e.target.value})} />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase block mb-1">Data</label>
                <input type="date" className="w-full border p-3 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500" value={newEarning.date} onChange={e => setNewEarning({...newEarning, date: e.target.value})} />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-8">
              <button onClick={() => setEarningModal({ open: false, account: null })} className="text-gray-400 font-bold px-4">Cancelar</button>
              <button 
                disabled={newEarning.amount <= 0}
                onClick={() => { onAddEarning({ ...newEarning, accountId: earningModal.account!.id }); setEarningModal({ open: false, account: null }); }}
                className="bg-emerald-600 text-white px-10 py-3 rounded-xl font-bold disabled:opacity-50 shadow-lg shadow-emerald-100"
              >
                Confirmar Recebimento
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountList;
