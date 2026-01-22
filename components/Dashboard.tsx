
import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, Cell } from 'recharts';
import { Account, MetricEntry, EarningEntry, Platform } from '../types';

interface DashboardProps {
  accounts: Account[];
  metrics: MetricEntry[];
  earnings: EarningEntry[];
}

const Dashboard: React.FC<DashboardProps> = ({ accounts, metrics, earnings }) => {
  const hotAccounts = accounts.filter(a => a.isHot);

  const stats = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    const totalViews = metrics.reduce((acc, m) => acc + m.views, 0);
    const viewsThisMonth = metrics
      .filter(m => new Date(m.date).getTime() >= startOfMonth)
      .reduce((acc, m) => acc + m.views, 0);
    
    const totalEarnings = earnings.reduce((acc, e) => acc + e.amount, 0);

    const accountEarningsMap = earnings.reduce((acc, e) => {
      acc[e.accountId] = (acc[e.accountId] || 0) + e.amount;
      return acc;
    }, {} as Record<string, number>);

    const accountViewsMap = metrics.reduce((acc, m) => {
      acc[m.accountId] = (acc[m.accountId] || 0) + m.views;
      return acc;
    }, {} as Record<string, number>);

    let mostLucrativeId = null;
    let maxEarning = -1;
    for (const id in accountEarningsMap) {
      if (accountEarningsMap[id] > maxEarning) {
        maxEarning = accountEarningsMap[id];
        mostLucrativeId = id;
      }
    }

    let mostViewedId = null;
    let maxViews = -1;
    for (const id in accountViewsMap) {
      if (accountViewsMap[id] > maxViews) {
        maxViews = accountViewsMap[id];
        mostViewedId = id;
      }
    }

    const mostLucrative = accounts.find(a => a.id === mostLucrativeId)?.name || 'N/A';
    const mostViewed = accounts.find(a => a.id === mostViewedId)?.name || 'N/A';

    return { totalViews, viewsThisMonth, totalEarnings, mostLucrative, mostViewed };
  }, [accounts, metrics, earnings]);

  const viewsTimelineData = useMemo(() => {
    const days: Record<string, number> = {};
    metrics.forEach(m => {
      const date = m.date;
      days[date] = (days[date] || 0) + m.views;
    });

    return Object.entries(days)
      .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
      .slice(-15)
      .map(([date, amount]) => ({
        date: new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        views: amount
      }));
  }, [metrics]);

  const earningsTimelineData = useMemo(() => {
    const days: Record<string, number> = {};
    earnings.forEach(e => {
      const date = e.date;
      days[date] = (days[date] || 0) + e.amount;
    });

    return Object.entries(days)
      .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
      .slice(-15)
      .map(([date, amount]) => ({
        date: new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        ganhos: amount
      }));
  }, [earnings]);

  const platformData = useMemo(() => {
    const data = [
      { name: 'TikTok', views: 0, color: '#000000' },
      { name: 'Instagram', views: 0, color: '#E1306C' },
      { name: 'YouTube Shorts', views: 0, color: '#FF0000' }
    ];

    metrics.forEach(m => {
      if (m.platform === Platform.TIKTOK) data[0].views += m.views;
      else if (m.platform === Platform.INSTAGRAM) data[1].views += m.views;
      else if (m.platform === Platform.YOUTUBE_SHORTS) data[2].views += m.views;
    });

    return data;
  }, [metrics]);

  return (
    <div className="space-y-6 animate-fadeIn pb-10">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Dashboard Estratégico</h2>
          <p className="text-gray-500">Métricas consolidadas e atalhos de Hot List.</p>
        </div>
        <div className="text-right hidden sm:block">
          <p className="text-xs font-bold text-gray-400 uppercase">Mês Atual</p>
          <p className="text-lg font-bold text-indigo-600">
            {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
          </p>
        </div>
      </header>

      {/* HOT LIST SHORTCUTS */}
      {hotAccounts.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 p-4 rounded-2xl">
          <p className="text-[10px] font-black text-orange-600 uppercase mb-3 flex items-center gap-1">
            🔥 Atalhos Hot List
          </p>
          <div className="flex flex-wrap gap-3">
            {hotAccounts.map(acc => (
              <a 
                key={acc.id}
                href={acc.profileUrl || '#'}
                target={acc.profileUrl ? "_blank" : "_self"}
                rel="noopener noreferrer"
                className="bg-white border border-orange-300 px-4 py-2 rounded-xl text-sm font-bold text-gray-700 shadow-sm hover:shadow-md hover:bg-orange-100 transition-all flex items-center gap-2"
              >
                {acc.name} 🔗
              </a>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Views (Mês)" value={stats.viewsThisMonth.toLocaleString()} subValue={`Total: ${stats.totalViews.toLocaleString()}`} icon="📅" color="bg-indigo-600" />
        <StatCard title="Ganhos Totais" value={`R$ ${stats.totalEarnings.toFixed(2)}`} icon="💰" color="bg-emerald-500" />
        <StatCard title="Melhor Conta" value={stats.mostLucrative} icon="🏆" color="bg-amber-500" />
        <StatCard title="Mais Viral" value={stats.mostViewed} icon="🚀" color="bg-rose-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-700 mb-6">Evolução Diária de Views</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={viewsTimelineData}>
                <defs>
                  <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                <Area type="monotone" dataKey="views" name="Visualizações" stroke="#6366f1" fillOpacity={1} fill="url(#colorViews)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-700 mb-6">Visualizações por Rede</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={platformData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip cursor={{fill: '#f8fafc'}} />
                <Bar dataKey="views" radius={[8, 8, 0, 0]} barSize={50}>
                  {platformData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ title: string; value: string; subValue?: string; icon: string; color: string }> = ({ title, value, subValue, icon, color }) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 hover:border-indigo-100 transition-all hover:shadow-md group">
    <div className={`w-14 h-14 ${color} text-white rounded-2xl flex items-center justify-center text-3xl shadow-lg group-hover:scale-110 transition-transform`}>
      {icon}
    </div>
    <div>
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{title}</p>
      <p className="text-2xl font-black text-gray-900 leading-tight">{value}</p>
      {subValue && <p className="text-xs font-medium text-gray-400 mt-0.5">{subValue}</p>}
    </div>
  </div>
);

export default Dashboard;
