
import React from 'react';

interface SidebarProps {
  activeTab: 'dashboard' | 'accounts' | 'financials';
  setActiveTab: (tab: 'dashboard' | 'accounts' | 'financials') => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'accounts', label: 'Contas', icon: '📱' },
    { id: 'financials', label: 'Financeiro', icon: '💰' },
  ];

  return (
    <aside className="w-full md:w-64 bg-white border-r border-gray-200 h-auto md:h-screen sticky top-0 z-40">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-indigo-600 flex items-center gap-2">
          <span>Cantinho do hu</span>
        </h1>
      </div>
      <nav className="px-4 pb-4 md:pb-0 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id as any)}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
              activeTab === item.id
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <span className="text-xl">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
