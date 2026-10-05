import React from 'react';
import { BRAND_LOGO_ALT } from '../../data/mockData';
import { DesktopNav } from '../../types';

interface DesktopSidebarProps {
  currentNav: DesktopNav;
  onSelectNav: (nav: DesktopNav) => void;
  pendingCount?: number;
}

export const DesktopSidebar: React.FC<DesktopSidebarProps> = ({
  currentNav,
  onSelectNav,
  pendingCount = 4
}) => {
  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-[#080e1b] border-r border-[#3e4850]/30 z-50 flex flex-col justify-between select-none">
      <div className="flex flex-col h-full">
        {/* Brand Header */}
        <div className="h-16 px-4 border-b border-[#3e4850]/30 flex items-center justify-between bg-[#080e1b]">
          <div className="flex items-center gap-2">
            <img
              alt="ArbSetu Brand Logo"
              className="h-7 w-auto object-contain"
              src={BRAND_LOGO_ALT}
            />
            <div className="flex flex-col">
              <span className="font-headline-md text-headline-md leading-none text-[#dde2f5] tracking-tight font-bold">
                ArbSetu
              </span>
              <span className="font-data-mono-sm text-[10px] text-[#89ceff] tracking-wider uppercase font-semibold">
                Terminal CRM
              </span>
            </div>
          </div>
          <span className="font-label-caps text-label-caps px-1.5 py-0.5 rounded bg-[#242a38] text-[#bec8d2] font-mono font-bold">
            PROD
          </span>
        </div>

        {/* Navigation Sections */}
        <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
          {/* Operations */}
          <div className="space-y-1">
            <div className="px-3 py-1 font-label-caps text-[10px] text-[#88929b] uppercase tracking-wider font-semibold">
              Operations
            </div>
            <nav className="space-y-0.5">
              <button
                onClick={() => onSelectNav('dashboard')}
                className={`w-full flex items-center gap-2 px-3 py-1.5 rounded text-left transition-all font-body-sm text-body-sm ${
                  currentNav === 'dashboard'
                    ? 'bg-[#242a38] text-[#89ceff] border-l-2 border-[#89ceff] font-semibold'
                    : 'text-[#bec8d2] hover:bg-[#1a1f2d] hover:text-[#dde2f5]'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">dashboard</span>
                <span>Dashboard</span>
              </button>

              <button
                onClick={() => onSelectNav('withdrawal-queue')}
                className={`w-full flex items-center justify-between px-3 py-1.5 rounded text-left transition-all font-body-sm text-body-sm ${
                  currentNav === 'withdrawal-queue'
                    ? 'bg-[#242a38] text-[#89ceff] border-l-2 border-[#89ceff] font-semibold'
                    : 'text-[#bec8d2] hover:bg-[#1a1f2d] hover:text-[#dde2f5]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">move_up</span>
                  <span>Withdrawal Queue</span>
                </div>
                <span className="font-data-mono-sm px-1.5 py-0.2 bg-[#93000a] text-[#ffdad6] rounded-sm font-bold text-[10px]">
                  {pendingCount}
                </span>
              </button>

              <button
                onClick={() => onSelectNav('bot-risk-control')}
                className={`w-full flex items-center gap-2 px-3 py-1.5 rounded text-left transition-all font-body-sm text-body-sm ${
                  currentNav === 'bot-risk-control'
                    ? 'bg-[#242a38] text-[#89ceff] border-l-2 border-[#89ceff] font-semibold'
                    : 'text-[#bec8d2] hover:bg-[#1a1f2d] hover:text-[#dde2f5]'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">smart_toy</span>
                <span>Bot & Risk Control</span>
              </button>
            </nav>
          </div>

          {/* Financials */}
          <div className="space-y-1">
            <div className="px-3 py-1 font-label-caps text-[10px] text-[#88929b] uppercase tracking-wider font-semibold">
              Financials
            </div>
            <nav className="space-y-0.5">
              <button
                onClick={() => onSelectNav('5-tier-ledger')}
                className={`w-full flex items-center gap-2 px-3 py-1.5 rounded text-left transition-all font-body-sm text-body-sm ${
                  currentNav === '5-tier-ledger'
                    ? 'bg-[#242a38] text-[#89ceff] border-l-2 border-[#89ceff] font-semibold'
                    : 'text-[#bec8d2] hover:bg-[#1a1f2d] hover:text-[#dde2f5]'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">account_balance</span>
                <span>5-Tier Ledger</span>
              </button>

              <button
                onClick={() => onSelectNav('wallet-liabilities')}
                className={`w-full flex items-center gap-2 px-3 py-1.5 rounded text-left transition-all font-body-sm text-body-sm ${
                  currentNav === 'wallet-liabilities'
                    ? 'bg-[#242a38] text-[#89ceff] border-l-2 border-[#89ceff] font-semibold'
                    : 'text-[#bec8d2] hover:bg-[#1a1f2d] hover:text-[#dde2f5]'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>
                <span>Wallet Liabilities</span>
              </button>
            </nav>
          </div>

          {/* Platform */}
          <div className="space-y-1">
            <div className="px-3 py-1 font-label-caps text-[10px] text-[#88929b] uppercase tracking-wider font-semibold">
              Platform
            </div>
            <nav className="space-y-0.5">
              <button
                onClick={() => onSelectNav('exchange-connectors')}
                className={`w-full flex items-center gap-2 px-3 py-1.5 rounded text-left transition-all font-body-sm text-body-sm ${
                  currentNav === 'exchange-connectors'
                    ? 'bg-[#242a38] text-[#89ceff] border-l-2 border-[#89ceff] font-semibold'
                    : 'text-[#bec8d2] hover:bg-[#1a1f2d] hover:text-[#dde2f5]'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">sync_alt</span>
                <span>Exchange Connectors</span>
              </button>

              <button
                onClick={() => onSelectNav('support-crm')}
                className={`w-full flex items-center justify-between px-3 py-1.5 rounded text-left transition-all font-body-sm text-body-sm ${
                  currentNav === 'support-crm'
                    ? 'bg-[#242a38] text-[#89ceff] border-l-2 border-[#89ceff] font-semibold'
                    : 'text-[#bec8d2] hover:bg-[#1a1f2d] hover:text-[#dde2f5]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">support_agent</span>
                  <span>Support CRM</span>
                </div>
                <span className="font-data-mono-sm px-1.5 py-0.2 bg-[#242a38] text-[#bec8d2] rounded-sm text-[10px]">
                  12
                </span>
              </button>
            </nav>
          </div>

          {/* System */}
          <div className="space-y-1">
            <div className="px-3 py-1 font-label-caps text-[10px] text-[#88929b] uppercase tracking-wider font-semibold">
              System
            </div>
            <nav className="space-y-0.5">
              <button
                onClick={() => onSelectNav('staff-roles')}
                className={`w-full flex items-center gap-2 px-3 py-1.5 rounded text-left transition-all font-body-sm text-body-sm ${
                  currentNav === 'staff-roles'
                    ? 'bg-[#242a38] text-[#89ceff] border-l-2 border-[#89ceff] font-semibold'
                    : 'text-[#bec8d2] hover:bg-[#1a1f2d] hover:text-[#dde2f5]'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">badge</span>
                <span>Staff & Roles</span>
              </button>

              <button
                onClick={() => onSelectNav('immutable-audit-logs')}
                className={`w-full flex items-center gap-2 px-3 py-1.5 rounded text-left transition-all font-body-sm text-body-sm ${
                  currentNav === 'immutable-audit-logs'
                    ? 'bg-[#242a38] text-[#89ceff] border-l-2 border-[#89ceff] font-semibold'
                    : 'text-[#bec8d2] hover:bg-[#1a1f2d] hover:text-[#dde2f5]'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">lock_clock</span>
                <span>Immutable Audit Logs</span>
              </button>
            </nav>
          </div>
        </div>

        {/* Pipeline Nodes Footer */}
        <div className="p-3 border-t border-[#3e4850]/30 bg-[#080e1b]/80 space-y-1">
          <div className="flex items-center justify-between px-1">
            <span className="font-label-caps text-label-caps text-[#88929b] uppercase">Pipeline Nodes</span>
            <span className="font-data-mono-sm text-data-mono-sm text-[#4fdbc8] font-bold">18/18 Synced</span>
          </div>
          <div className="w-full bg-[#242a38] h-1 rounded overflow-hidden">
            <div className="bg-[#4fdbc8] h-full w-full"></div>
          </div>
        </div>
      </div>
    </aside>
  );
};
