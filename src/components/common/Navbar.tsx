import React from 'react';
import { MobileTab } from '../../types';

interface NavbarProps {
  activeTab: MobileTab;
  onTabChange: (tab: MobileTab) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'radar', label: 'Radar', icon: 'grid_view' },
    { id: 'trades', label: 'Trades', icon: 'swap_calls' },
    { id: 'wallet', label: 'Wallet', icon: 'account_balance_wallet' },
    { id: 'network', label: 'Network', icon: 'groups_2' },
    { id: 'profile', label: 'Profile', icon: 'manage_accounts' }
  ] as const;

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 pb-safe bg-[#080e1b]/95 backdrop-blur-xl border-t border-[#1e293b]/60 shadow-[0_-4px_16px_rgba(0,0,0,0.5)]">
      <div className="grid grid-cols-5 items-center h-16 px-1 max-w-lg mx-auto">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`min-h-[48px] flex flex-col items-center justify-center gap-1 transition-all group ${
                isActive
                  ? 'text-[#89ceff]'
                  : 'text-[#bec8d2] hover:text-[#dde2f5]'
              }`}
            >
              <div
                className={`w-10 h-7 rounded-full flex items-center justify-center transition-colors ${
                  isActive ? 'bg-[#89ceff]/15 text-[#89ceff]' : 'text-inherit group-hover:bg-[#1a1f2d]'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">{tab.icon}</span>
              </div>
              <span className="font-label-caps text-label-caps tracking-wide font-medium">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
