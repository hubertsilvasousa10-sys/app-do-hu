
import React, { useMemo } from 'react';
import { Account, EarningEntry } from '../types';

interface FinancialsProps {
  accounts: Account[];
  earnings: EarningEntry[];
}

const Financials: React.FC<FinancialsProps> = ({ accounts, earnings }) => {
  const sortedEarnings = useMemo(() => {
    return [...earnings].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [earnings]);

  const stats = useMemo(() => {
    const now = new Date();
    const startOfDay = new Date(now.setHours(0,0,0,0)).getTime();
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay())).getTime();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    return {
      total: earnings.reduce((acc, e) => acc + e.amount, 0),
      today: earnings.filter(e => new Date(e.date).getTime() >= startOfDay).reduce((acc, e) => acc + e.amount, 0),
      week: earnings.filter(e => new Date(e.date).getTime() >= startOfWeek).reduce((acc, e) => acc + e.amount, 0),
      month: earnings.filter(e => new Date(e.date).getTime() >= startOfMonth).reduce((acc, e) => acc + e.amount, 0),
    };
  }, [earnings]);

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl font-bold text-gray-800">Controle Financeiro</h2>
        <p className="text-gray-500">Acompanhe lucros consolidados por conta.</p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <PeriodCard title="Ganhos de Hoje" value={stats.today} color="border-indigo-500 text-indigo-700" />
        <PeriodCard title="Ganhos da Semana" value={stats.week} color="border-emerald-500 text-emerald-700" />
        <PeriodCard title="Ganhos do Mês" value={stats.month} color="border-sky-500 text-sky-700" />
        <PeriodCard title="Faturamento Total" value={stats.total} color="border-pink-500 text-pink-700" />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800">Histórico de Transações</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-semibold">Data</th>
                <th className="px-6 py-4 font-semibold">Conta</th>
                <th className="px-6 py-4 font-semibold">Valor</th>
                <th className="px-6 py-4 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sortedEarnings.map(e => {
                const acc = accounts.find(a => a.id === e.accountId);
                return (
                  <tr key={e.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-600">{new Date(e.date).toLocaleDateString('pt-BR')}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{acc?.name || 'Conta Removida'}</td>
                    <td className="px-6 py-4 text-sm font-bold text-green-600">R$ {e.amount.toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 text-[10px] font-bold bg-green-100 text-green-700 rounded-full uppercase tracking-tighter">Recebido</span>
                    </td>
                  </tr>
                )
              })}
              {sortedEarnings.length === 0 && (
                <tr><td colSpan={4} className="px-6 py-10 text-center text-gray-400 font-medium">Nenhum registro encontrado.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const PeriodCard: React.FC<{ title: string; value: number; color: string }> = ({ title, value, color }) => (
  <div className={`bg-white p-6 rounded-xl shadow-sm border-l-4 ${color}`}>
    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">{title}</p>
    <p className="text-2xl font-bold">R$ {value.toFixed(2)}</p>
  </div>
);

export default Financials;
