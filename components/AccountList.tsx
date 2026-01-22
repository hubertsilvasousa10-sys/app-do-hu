
import React, { useState } from 'react';
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
}

const AccountList: React.FC<AccountListProps> = ({ 
  accounts, metrics, earnings, onAddAccount, onDeleteAccount, onAddMetric, onAddEarning, onToggleHot
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [filter, setFilter] = useState<Platform | 'all'>('all');
  const [newAcc, setNewAcc] = useState<{name: string, platforms: Platform[], niche: string, createdAt: string, profileUrl: string}>({ 
    name: '', 
    platforms: [Platform.TIKTOK], 
    niche: '', 
    createdAt: new Date().toISOString().split('T')[0],
    profileUrl: ''
  });

  const [metricModal, setMetricModal] = useState<{ open: boolean, account: Account | null }>({ open: false, account: null });
  const [earningModal, setEarningModal] = useState<{ open: boolean, account: Account | null }>({ open: false, account: null });

  const [newMetric, setNewMetric] = useState({ views: 0, videosCount: 1, date: new Date().toISOString().split('T')[0], platform: Platform.TIKTOK });
  const [newEarning, setNewEarning] = useState({ amount: 0, date: new Date().toISOString().split('T')[0] });

  const filteredAccounts = filter === 'all' 
    ? accounts 
    : accounts.filter(a => a.platforms.includes(filter as Platform));

  const hotAccounts = accounts.filter(a => a.isHot);
  const normalAccounts = filteredAccounts.filter(a => !a.isHot);

  const getAccountStats = (id: string) => {
    const accMetrics = metrics.filter(m => m.accountId === id);
    const accEarnings = earnings.filter(e => e.accountId === id);
    return {
      views: accMetrics.reduce((acc, m) => acc + m.views, 0),
      videos: accMetrics.reduce((acc, m) => acc + m.videosCount, 0),
      earnings: accEarnings.reduce((acc, e) => acc + e.amount, 0),
    };
  };

  const getPlatformBadgeClass = (platform: Platform) => {
    switch (platform) {
      case Platform.TIKTOK: return 'bg-black text-white';
      case Platform.INSTAGRAM: return 'bg-gradient-to-tr from-purple-500 to-pink-500 text-white';
      case Platform.YOUTUBE_SHORTS: return 'bg-red-600 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const togglePlatform = (p: Platform) => {
    setNewAcc(prev => {
      const platforms = prev.platforms.includes(p)
        ? prev.platforms.filter(item => item !== p)
        : [...prev.platforms, p];
      return { ...prev, platforms: platforms.length > 0 ? platforms : prev.platforms };
    });
  };

  const openMetricModal = (acc: Account) => {
    setNewMetric(prev => ({ ...prev, platform: acc.platforms[0] || Platform.TIKTOK }));
    setMetricModal({ open: true, account: acc });
  };

  const openEarningModal = (acc: Account) => {
    setEarningModal({ open: true, account: acc });
  };

  const renderAccountCard = (account: Account) => {
    const stats = getAccountStats(account.id);
    return (
      <div key={account.id} className={`bg-white rounded-xl border ${account.isHot ? 'border-orange-400 ring-2 ring-orange-100 shadow-lg' : 'border-gray-100'} shadow-sm overflow-hidden hover:shadow-md transition-all relative group`}>
        {account.isHot && (
          <div className="absolute top-0 right-0 p-1.5 bg-orange-400 text-white text-[10px] font-black rounded-bl-xl z-10 shadow-sm">
            🔥 HOT
          </div>
        )}
        <div className="p-5 border-b border-gray-50 bg-gray-50/50 flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-bold text-gray-900 text-lg truncate max-w-[150px]">{account.name}</h4>
              {account.profileUrl && (
                <a 
                  href={account.profileUrl} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-indigo-600 hover:text-indigo-800 transition-colors bg-white p-1 rounded-md shadow-sm border border-gray-100"
                  title="Abrir Perfil Externo"
                >
                  🔗
                </a>
              )}
            </div>
            <p className="text-xs text-indigo-500 font-medium mb-2">{account.niche}</p>
            <div className="flex flex-wrap gap-1">
              {account.platforms.map(p => (
                <span key={p} className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold tracking-wider uppercase ${getPlatformBadgeClass(p)}`}>
                  {p}
                </span>
              ))}
            </div>
          </div>
          <div className="flex flex-col items-center gap-3">
            <button 
              onClick={() => onDeleteAccount(account.id)} 
              className="text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all p-2 rounded-lg"
              title="Excluir Conta Permanentemente"
            >
              🗑️
            </button>
            <button 
              onClick={() => onToggleHot(account.id)} 
              className={`w-8 h-8 flex items-center justify-center rounded-full transition-all border ${
                account.isHot 
                ? 'bg-orange-500 text-white border-orange-600 scale-110' 
                : 'bg-white text-gray-400 border-gray-200 hover:text-orange-500 hover:border-orange-300'
              }`}
              title={account.isHot ? "Remover da Hot List" : "Mover para Hot List"}
            >
              ↓
            </button>
          </div>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-3 gap-2 text-center bg-gray-50 p-3 rounded-lg border border-gray-100">
            <div><p className="text-[10px] text-gray-400 font-bold uppercase">Views</p><p className="text-sm font-bold text-gray-800">{stats.views.toLocaleString()}</p></div>
            <div><p className="text-[10px] text-gray-400 font-bold uppercase">Vídeos</p><p className="text-sm font-bold text-gray-800">{stats.videos}</p></div>
            <div><p className="text-[10px] text-gray-400 font-bold uppercase">Ganhos</p><p className="text-sm font-black text-green-600">R$ {stats.earnings.toFixed(2)}</p></div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => openMetricModal(account)} className="flex-1 bg-white border border-indigo-200 text-indigo-700 py-2 rounded-lg text-xs font-bold hover:bg-indigo-50 shadow-sm transition-colors">+ Métricas</button>
            <button onClick={() => openEarningModal(account)} className="flex-1 bg-white border border-green-200 text-green-700 py-2 rounded-lg text-xs font-bold hover:bg-green-50 shadow-sm transition-colors">+ Ganhos</button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Minhas Contas</h2>
          <p className="text-gray-500">Gerencie seus perfis e priorize sua Hot List.</p>
        </div>
        <div className="flex gap-2">
           <select 
            className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
          >
            <option value="all">Todas as Redes</option>
            {Object.values(Platform).map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <button 
            onClick={() => setIsAdding(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 transition-colors shadow-lg"
          >
            + Nova Conta
          </button>
        </div>
      </div>

      {isAdding && (
        <div className="bg-white p-6 rounded-xl border-2 border-indigo-100 shadow-xl animate-slideDown">
          <h3 className="text-lg font-bold mb-4 text-indigo-900 flex items-center gap-2">
            <span className="bg-indigo-100 p-1.5 rounded-lg">✨</span>
            Nova Configuração de Perfil
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Nome da Conta</label>
              <input 
                type="text" placeholder="Ex: @vendedor_oficial" 
                className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                value={newAcc.name} onChange={e => setNewAcc({...newAcc, name: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Link do Perfil</label>
              <input 
                type="url" placeholder="https://www.tiktok.com/@..." 
                className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                value={newAcc.profileUrl} onChange={e => setNewAcc({...newAcc, profileUrl: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Nicho / Categoria</label>
              <input 
                type="text" placeholder="Ex: Vendas, Curiosidades" 
                className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                value={newAcc.niche} onChange={e => setNewAcc({...newAcc, niche: e.target.value})}
              />
            </div>
          </div>
          
          <div className="mb-6 flex flex-col md:flex-row gap-6">
            <div className="flex-1">
              <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Plataformas Ativas</label>
              <div className="flex flex-wrap gap-2">
                {Object.values(Platform).map(p => {
                  const isSelected = newAcc.platforms.includes(p);
                  return (
                    <button
                      key={p} type="button" onClick={() => togglePlatform(p)}
                      className={`px-4 py-2 rounded-lg border text-xs font-bold transition-all ${
                        isSelected ? 'bg-indigo-600 border-indigo-600 text-white shadow-md scale-105' : 'bg-white border-gray-200 text-gray-600 hover:border-indigo-300'
                      }`}
                    >
                      {isSelected ? '✓ ' : ''}{p}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="w-full md:w-auto">
              <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Início da Operação</label>
              <input 
                type="date" 
                className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                value={newAcc.createdAt} onChange={e => setNewAcc({...newAcc, createdAt: e.target.value})}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-50">
            <button onClick={() => setIsAdding(false)} className="text-gray-500 px-4 py-2 text-sm font-bold hover:text-gray-700">Descartar</button>
            <button 
              onClick={() => { onAddAccount(newAcc); setIsAdding(false); }}
              className="bg-indigo-600 text-white px-8 py-2 rounded-lg font-bold shadow-lg hover:bg-indigo-700 transition-all hover:scale-105"
            >
              Criar Conta Integrada
            </button>
          </div>
        </div>
      )}

      {hotAccounts.length > 0 && (
        <div className="space-y-4 animate-fadeIn">
          <div className="flex items-center gap-2 border-b-2 border-orange-100 pb-2">
            <span className="text-2xl drop-shadow-sm">🔥</span>
            <h3 className="text-lg font-black text-gray-800 uppercase tracking-tighter">Hot List - Foco Máximo</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 bg-orange-50/20 p-5 rounded-2xl border border-orange-100 shadow-inner">
            {hotAccounts.map(account => renderAccountCard(account))}
          </div>
        </div>
      )}

      <div className="space-y-4">
        <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2 flex items-center gap-2">
          📱 Todas as Contas {filter !== 'all' && <span className="text-indigo-400 bg-indigo-50 px-2 py-0.5 rounded text-[10px]">{filter}</span>}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {normalAccounts.length > 0 ? (
            normalAccounts.map(account => renderAccountCard(account))
          ) : (
            <div className="col-span-full py-20 text-center text-gray-300 border-2 border-dashed border-gray-100 rounded-2xl bg-white/50">
              <p className="text-4xl mb-4">📭</p>
              <p className="font-medium">Nenhum perfil comum nesta visualização.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modais omitidos para brevidade, mas funcionais */}
      {metricModal.open && metricModal.account && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md p-6 rounded-2xl shadow-2xl animate-scaleIn">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-800">Lançar Métricas</h3>
              <span className="text-xs font-bold text-indigo-500 bg-indigo-50 px-2 py-1 rounded uppercase tracking-wider">{metricModal.account.name}</span>
            </div>
            <div className="space-y-5">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Qual Rede Social?</label>
                <select 
                  className="w-full border-2 border-gray-100 rounded-xl p-3 text-sm focus:border-indigo-500 outline-none transition-all"
                  value={newMetric.platform}
                  onChange={e => setNewMetric({...newMetric, platform: e.target.value as Platform})}
                >
                  {metricModal.account.platforms.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Views</label>
                  <input type="number" className="w-full border-2 border-gray-100 rounded-xl p-3 text-sm focus:border-indigo-500 outline-none" value={newMetric.views} onChange={e => setNewMetric({...newMetric, views: Number(e.target.value)})} />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Data do Dado</label>
                  <input type="date" className="w-full border-2 border-gray-100 rounded-xl p-3 text-sm focus:border-indigo-500 outline-none" value={newMetric.date} onChange={e => setNewMetric({...newMetric, date: e.target.value})} />
                </div>
              </div>
            </div>
            <div className="mt-8 flex justify-end gap-3">
              <button onClick={() => setMetricModal({ open: false, account: null })} className="px-4 py-2 text-gray-400 text-sm font-bold">Cancelar</button>
              <button 
                onClick={() => { onAddMetric({ ...newMetric, accountId: metricModal.account!.id }); setMetricModal({ open: false, account: null }); }}
                className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-xl hover:bg-indigo-700 transition-all"
              >Salvar Agora</button>
            </div>
          </div>
        </div>
      )}

      {earningModal.open && earningModal.account && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md p-6 rounded-2xl shadow-2xl animate-scaleIn">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">Registrar Faturamento 💰</h3>
            <div className="space-y-5">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Valor do Repasse (R$)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">R$</span>
                  <input type="number" step="0.01" className="w-full border-2 border-gray-100 rounded-xl p-3 pl-12 text-lg font-bold focus:border-green-500 outline-none transition-all" value={newEarning.amount} onChange={e => setNewEarning({...newEarning, amount: Number(e.target.value)})} />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Data do Recebimento</label>
                <input type="date" className="w-full border-2 border-gray-100 rounded-xl p-3 text-sm focus:border-green-500 outline-none" value={newEarning.date} onChange={e => setNewEarning({...newEarning, date: e.target.value})} />
              </div>
            </div>
            <div className="mt-8 flex justify-end gap-3">
              <button onClick={() => setEarningModal({ open: false, account: null })} className="px-4 py-2 text-gray-400 text-sm font-bold">Cancelar</button>
              <button 
                onClick={() => { onAddEarning({ ...newEarning, accountId: earningModal.account!.id }); setEarningModal({ open: false, account: null }); }}
                className="px-8 py-3 bg-green-600 text-white rounded-xl font-bold shadow-xl hover:bg-green-700 transition-all"
              >Confirmar Valor</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes scaleIn {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-scaleIn {
          animation: scaleIn 0.2s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default AccountList;
