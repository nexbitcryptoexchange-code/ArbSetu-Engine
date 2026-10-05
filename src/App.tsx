import { useState } from 'react';
import { Header } from './components/common/Header';
import { Navbar } from './components/common/Navbar';
import { RadarScreen } from './components/mobile/RadarScreen';
import { ConnectApiKeyScreen } from './components/mobile/ConnectApiKeyScreen';
import { WalletScreen } from './components/mobile/WalletScreen';
import { NetworkScreen } from './components/mobile/NetworkScreen';
import { TradesScreen } from './components/mobile/TradesScreen';
import { ProfileScreen } from './components/mobile/ProfileScreen';
import { DesktopTerminal } from './components/desktop/DesktopTerminal';
import { MobileTab, DesktopNav, ViewMode } from './types';

export default function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('mobile');
  const [mobileTab, setMobileTab] = useState<MobileTab>('radar');
  const [desktopNav, setDesktopNav] = useState<DesktopNav>('withdrawal-queue');

  // Interactive Toast State
  const [toast, setToast] = useState<{ message: string; isError: boolean; visible: boolean }>({
    message: '',
    isError: false,
    visible: false
  });

  const showToast = (message: string, isError = false) => {
    setToast({ message, isError, visible: true });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, 3200);
  };

  return (
    <div className="min-h-screen bg-[#0d1320] text-[#dde2f5] font-body-md select-none">
      {/* Universal Floating Toast Notification */}
      <div
        className={`fixed top-20 left-1/2 -translate-x-1/2 z-[999] pointer-events-none transition-all duration-300 flex items-center gap-2 px-4 py-2 rounded-full shadow-2xl border ${
          toast.visible
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 -translate-y-3 pointer-events-none'
        } ${
          toast.isError
            ? 'bg-[#93000a] text-[#ffdad6] border-[#ffb4ab]/40'
            : 'bg-[#04b4a2] text-[#003731] border-[#4fdbc8]/40'
        }`}
      >
        <span className="material-symbols-outlined text-[18px]">
          {toast.isError ? 'warning' : 'verified_user'}
        </span>
        <span className="font-body-sm text-xs font-bold font-sans">
          {toast.message}
        </span>
      </div>

      {/* Screen Selector Toolbar for Instant Demo & Review */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 z-[60] pt-1">
        <div className="bg-[#080e1b]/95 backdrop-blur-md px-3 py-1 rounded-full border border-[#3e4850]/50 shadow-2xl flex items-center gap-1.5 text-[11px] font-sans">
          <span className="text-[#88929b] font-bold uppercase tracking-wider text-[9px] mr-1 hidden md:inline">
            Screen:
          </span>

          <button
            onClick={() => {
              setViewMode('mobile');
              setMobileTab('radar');
            }}
            className={`px-2 py-0.5 rounded-full font-bold transition-all ${
              viewMode === 'mobile' && mobileTab === 'radar'
                ? 'bg-[#89ceff] text-[#00344d]'
                : 'text-[#bec8d2] hover:text-[#dde2f5]'
            }`}
          >
            Radar (Home)
          </button>

          <button
            onClick={() => {
              setViewMode('mobile');
              setMobileTab('connect-key');
            }}
            className={`px-2 py-0.5 rounded-full font-bold transition-all ${
              viewMode === 'mobile' && mobileTab === 'connect-key'
                ? 'bg-[#89ceff] text-[#00344d]'
                : 'text-[#bec8d2] hover:text-[#dde2f5]'
            }`}
          >
            Connect API
          </button>

          <button
            onClick={() => {
              setViewMode('mobile');
              setMobileTab('network');
            }}
            className={`px-2 py-0.5 rounded-full font-bold transition-all ${
              viewMode === 'mobile' && mobileTab === 'network'
                ? 'bg-[#89ceff] text-[#00344d]'
                : 'text-[#bec8d2] hover:text-[#dde2f5]'
            }`}
          >
            5-Tier Network
          </button>

          <button
            onClick={() => {
              setViewMode('mobile');
              setMobileTab('wallet');
            }}
            className={`px-2 py-0.5 rounded-full font-bold transition-all ${
              viewMode === 'mobile' && mobileTab === 'wallet'
                ? 'bg-[#89ceff] text-[#00344d]'
                : 'text-[#bec8d2] hover:text-[#dde2f5]'
            }`}
          >
            Wallet Balances
          </button>

          <span className="text-[#3e4850] mx-0.5">|</span>

          <button
            onClick={() => {
              setViewMode('desktop');
              setDesktopNav('withdrawal-queue');
            }}
            className={`px-2 py-0.5 rounded-full font-bold transition-all flex items-center gap-1 ${
              viewMode === 'desktop' && desktopNav === 'withdrawal-queue'
                ? 'bg-[#4fdbc8] text-[#003731]'
                : 'text-[#4fdbc8] hover:bg-[#1a1f2d]'
            }`}
          >
            <span>Maker-Checker</span>
          </button>

          <button
            onClick={() => {
              setViewMode('desktop');
              setDesktopNav('bot-risk-control');
            }}
            className={`px-2 py-0.5 rounded-full font-bold transition-all flex items-center gap-1 ${
              viewMode === 'desktop' && desktopNav === 'bot-risk-control'
                ? 'bg-[#4fdbc8] text-[#003731]'
                : 'text-[#4fdbc8] hover:bg-[#1a1f2d]'
            }`}
          >
            <span>Risk Controls</span>
          </button>

          <button
            onClick={() => {
              setViewMode('desktop');
              setDesktopNav('5-tier-ledger');
            }}
            className={`px-2 py-0.5 rounded-full font-bold transition-all flex items-center gap-1 ${
              viewMode === 'desktop' && desktopNav === '5-tier-ledger'
                ? 'bg-[#4fdbc8] text-[#003731]'
                : 'text-[#4fdbc8] hover:bg-[#1a1f2d]'
            }`}
          >
            <span>5-Tier Ledger</span>
          </button>
        </div>
      </div>

      {/* Main View Display */}
      {viewMode === 'mobile' ? (
        <div className="relative min-h-screen flex flex-col bg-[#0d1320]">
          {/* Top Header */}
          <Header
            currentTab={mobileTab}
            onNavigate={(tab) => setMobileTab(tab)}
            viewMode={viewMode}
            onToggleViewMode={setViewMode}
            onShowNotifications={() => showToast('3 recent arbitrage fills reconciled on-chain.')}
          />

          {/* Screen Body */}
          <main className="flex-1 w-full">
            {mobileTab === 'radar' && (
              <RadarScreen
                showToast={showToast}
                onNavigateToTrades={() => setMobileTab('trades')}
              />
            )}

            {mobileTab === 'connect-key' && (
              <ConnectApiKeyScreen
                showToast={showToast}
                onBack={() => setMobileTab('radar')}
              />
            )}

            {mobileTab === 'wallet' && (
              <WalletScreen
                showToast={showToast}
                onNavigateToNetwork={() => setMobileTab('network')}
              />
            )}

            {mobileTab === 'network' && (
              <NetworkScreen showToast={showToast} />
            )}

            {mobileTab === 'trades' && (
              <TradesScreen showToast={showToast} />
            )}

            {mobileTab === 'profile' && (
              <ProfileScreen
                onNavigateToConnectKey={() => setMobileTab('connect-key')}
                onToggleViewMode={setViewMode}
                showToast={showToast}
              />
            )}
          </main>

          {/* Bottom Dock Navigation */}
          {mobileTab !== 'connect-key' && (
            <Navbar activeTab={mobileTab} onTabChange={(tab) => setMobileTab(tab)} />
          )}
        </div>
      ) : (
        /* Institutional Terminal Desktop View */
        <DesktopTerminal
          currentNav={desktopNav}
          onSelectNav={setDesktopNav}
          onToggleViewMode={setViewMode}
          showToast={showToast}
        />
      )}
    </div>
  );
}
