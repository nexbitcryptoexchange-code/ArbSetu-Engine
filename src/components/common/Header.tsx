import React, { useState } from 'react';
import { BRAND_LOGO_URL } from '../../data/mockData';
import { MobileTab, ViewMode } from '../../types';

interface HeaderProps {
  currentTab: MobileTab;
  onNavigate: (tab: MobileTab) => void;
  viewMode: ViewMode;
  onToggleViewMode: (mode: ViewMode) => void;
  onShowNotifications?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onNavigate,
  viewMode,
  onToggleViewMode,
  onShowNotifications
}) => {
  const [showMenu, setShowMenu] = useState(false);

  const getTitleAndSubtitle = () => {
    switch (currentTab) {
      case 'connect-key':
        return { title: 'Connect Api Key', subtitle: 'ArbSetu Core', isBack: true };
      case 'radar':
        return { title: 'ArbSetu', subtitle: 'Home Dashboard', isBack: false };
      case 'trades':
        return { title: 'ArbSetu', subtitle: 'Trades Execution', isBack: false };
      case 'wallet':
        return { title: 'ArbSetu', subtitle: 'Wallet Balances', isBack: false };
      case 'network':
        return { title: 'ArbSetu', subtitle: 'Referrals Network', isBack: false };
      case 'profile':
        return { title: 'ArbSetu', subtitle: 'User Profile & Security', isBack: false };
      default:
        return { title: 'ArbSetu', subtitle: 'Core Engine', isBack: false };
    }
  };

  const { title, subtitle, isBack } = getTitleAndSubtitle();

  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-[#0d1320]/85 backdrop-blur-xl pt-safe shadow-[0_1px_8px_rgba(0,0,0,0.4)] border-b border-[#1e293b]/40">
      <div className="h-16 px-4 flex items-center justify-between max-w-7xl mx-auto w-full">
        {/* Left Section */}
        <div className="flex items-center gap-2">
          {isBack ? (
            <button
              aria-label="Go Back"
              className="min-w-[40px] min-h-[40px] flex items-center justify-center -ml-2 rounded-full text-[#dde2f5] hover:text-[#89ceff] hover:bg-[#1a1f2d] transition-colors"
              onClick={() => onNavigate('radar')}
            >
              <span className="material-symbols-outlined text-[24px]">arrow_back</span>
            </button>
          ) : null}

          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => onNavigate('radar')}
          >
            <img
              alt="ArbSetu Institutional Brand Mark"
              className="h-8 w-auto object-contain"
              src={BRAND_LOGO_URL}
            />
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-headline-md text-headline-md tracking-tight text-[#dde2f5] font-bold">
                  {title}
                </span>
                {!isBack && (
                  <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-[#242a38]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#4fdbc8] animate-pulse"></span>
                    <span className="font-data-mono-sm text-[10px] text-[#4fdbc8] uppercase font-bold">
                      LIVE
                    </span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1">
                <span className="font-label-caps text-label-caps text-[#bec8d2] uppercase truncate max-w-[130px]">
                  {subtitle}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2">
          {/* Switch to Terminal CRM button */}
          <button
            onClick={() => onToggleViewMode('desktop')}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#161b29] hover:bg-[#242a38] text-[#89ceff] border border-[#3e4850]/40 text-xs font-semibold tracking-wide transition-all shadow-sm active:scale-95"
            title="Switch to Full Terminal CRM Desk"
          >
            <span className="material-symbols-outlined text-[16px]">terminal</span>
            <span>Terminal CRM</span>
          </button>

          {/* Connect API Key Shortcut pill */}
          {currentTab !== 'connect-key' && (
            <button
              onClick={() => onNavigate('connect-key')}
              className="flex items-center gap-1 px-2 py-1 rounded bg-[#0ea5e9]/15 hover:bg-[#0ea5e9]/25 text-[#89ceff] text-xs font-medium transition-all"
              title="API Keys & Gateways"
            >
              <span className="material-symbols-outlined text-[15px]">key</span>
              <span className="hidden md:inline">Connect API</span>
            </button>
          )}

          {/* Notifications Button */}
          <button
            aria-label="Notifications"
            onClick={onShowNotifications}
            className="min-w-[40px] min-h-[40px] flex items-center justify-center relative rounded-full text-[#bec8d2] hover:text-[#89ceff] hover:bg-[#1a1f2d] transition-colors"
          >
            <span className="material-symbols-outlined text-[22px]">notifications</span>
            <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-[#0ea5e9] ring-2 ring-[#0d1320]"></span>
          </button>

          {/* Profile / Menu Avatar */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="w-8 h-8 rounded-full bg-[#89ceff] hover:brightness-110 flex items-center justify-center transition-transform active:scale-95 shadow-sm"
              title="User Account Menu"
            >
              <span className="material-symbols-outlined text-[#00344d] text-[18px]">person</span>
            </button>

            {showMenu && (
              <div className="absolute right-0 top-10 w-56 rounded-xl bg-[#1a1f2d] border border-[#3e4850]/50 shadow-2xl p-2 z-50 animate-in fade-in duration-100 text-sm">
                <div className="px-3 py-2 border-b border-[#3e4850]/30 mb-1">
                  <div className="font-semibold text-[#dde2f5] font-data-mono-sm">AS-882941</div>
                  <div className="text-[11px] text-[#4fdbc8]">Tier 2 KYC • Sovereign</div>
                </div>
                <button
                  onClick={() => {
                    onNavigate('connect-key');
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#242a38] text-[#dde2f5] text-left transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px] text-[#89ceff]">add_link</span>
                  <span>Connect API Key</span>
                </button>
                <button
                  onClick={() => {
                    onNavigate('profile');
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#242a38] text-[#dde2f5] text-left transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px] text-[#89ceff]">manage_accounts</span>
                  <span>User Profile & Security</span>
                </button>
                <button
                  onClick={() => {
                    onToggleViewMode('desktop');
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#242a38] text-[#4fdbc8] text-left transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">computer</span>
                  <span>Open Institutional CRM</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
