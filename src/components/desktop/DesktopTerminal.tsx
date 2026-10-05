import React from 'react';
import { DesktopSidebar } from './DesktopSidebar';
import { WithdrawalQueueView } from './WithdrawalQueueView';
import { BotRiskControlView } from './BotRiskControlView';
import { FiveTierLedgerView } from './FiveTierLedgerView';
import { DesktopNav, ViewMode } from '../../types';

interface DesktopTerminalProps {
  currentNav: DesktopNav;
  onSelectNav: (nav: DesktopNav) => void;
  onToggleViewMode: (mode: ViewMode) => void;
  showToast: (msg: string, isError?: boolean) => void;
}

export const DesktopTerminal: React.FC<DesktopTerminalProps> = ({
  currentNav,
  onSelectNav,
  onToggleViewMode,
  showToast
}) => {
  return (
    <div className="bg-[#0d1320] text-[#dde2f5] min-h-screen font-body-md text-body-md antialiased selection:bg-[#0ea5e9] selection:text-[#003751]">
      {/* Sidebar */}
      <DesktopSidebar currentNav={currentNav} onSelectNav={onSelectNav} />

      {/* Main Content Area */}
      <div className="pl-64">
        {/* Fixed Topbar for Desktop */}
        <header className="fixed top-0 left-64 right-0 h-16 bg-[#080e1b]/90 backdrop-blur-md border-b border-[#3e4850]/30 z-40 px-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-[#161b29] px-2.5 py-1 rounded border border-[#3e4850]/40">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#4fdbc8] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#4fdbc8]"></span>
              </span>
              <span className="font-label-caps text-label-caps text-[#dde2f5] uppercase tracking-wider font-bold">
                All Relays Normal
              </span>
              <span className="font-data-mono-sm text-xs text-[#3e4850]">|</span>
              <span className="font-data-mono-sm text-xs text-[#4fdbc8] font-bold">1.42ms</span>
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#161b29] border border-[#3e4850]/40">
              <span className="material-symbols-outlined text-[16px] text-[#89ceff]">timer</span>
              <span className="font-label-caps text-[10px] text-[#88929b] uppercase font-bold">24H SLA RISK:</span>
              <span className="font-data-mono-sm text-xs text-[#4fdbc8] font-bold">0.00%</span>
              <span className="font-data-mono-sm text-xs text-[#bec8d2] font-mono">(0 Def)</span>
            </div>

            <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#161b29] border border-[#3e4850]/40">
              <span className="material-symbols-outlined text-[16px] text-[#4cd7f6]">shield_lock</span>
              <span className="font-label-caps text-[10px] text-[#88929b] uppercase font-bold">SEC LVL:</span>
              <span className="font-label-caps text-[10px] text-[#4cd7f6] font-bold tracking-wider">
                AIR-GAP 4/4
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Switch to Mobile View button */}
            <button
              onClick={() => onToggleViewMode('mobile')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0ea5e9]/15 hover:bg-[#0ea5e9]/25 text-[#89ceff] border border-[#0ea5e9]/40 text-xs font-bold transition-all active:scale-95"
              title="Switch to Mobile Companion App"
            >
              <span className="material-symbols-outlined text-[16px]">smartphone</span>
              <span>Trader Mobile App</span>
            </button>

            <div className="flex items-center gap-2 text-right hidden sm:flex">
              <div className="flex flex-col">
                <span className="font-body-sm text-xs text-[#dde2f5] font-bold leading-tight">Super Admin</span>
                <span className="font-data-mono-sm text-[10px] text-[#88929b] font-mono leading-none">Finance Desk #01</span>
              </div>
            </div>

            <div className="w-8 h-8 rounded-full bg-[#89ceff] flex items-center justify-center text-[#00344d] font-bold">
              <span className="material-symbols-outlined text-[18px]">person</span>
            </div>
          </div>
        </header>

        {/* View Router */}
        <main className="relative pt-16 bg-[#0d1320] min-h-screen">
          {currentNav === 'withdrawal-queue' && (
            <WithdrawalQueueView showToast={showToast} />
          )}

          {currentNav === 'bot-risk-control' && (
            <BotRiskControlView showToast={showToast} />
          )}

          {currentNav === '5-tier-ledger' && (
            <FiveTierLedgerView showToast={showToast} />
          )}

          {currentNav === 'dashboard' && (
            <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
              {/* Dashboard Overview */}
              <div className="bg-[#161b29] rounded-xl p-5 shadow-sm border border-[#3e4850]/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-headline-lg text-headline-lg font-bold text-[#dde2f5]">
                      Quantitative Desk Operations Overview
                    </h2>
                    <p className="text-xs text-[#bec8d2]">
                      High-frequency cross-venue liquidity routing, risk exposure, and sub-tick consensus.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onSelectNav('withdrawal-queue')}
                      className="px-3 py-1.5 rounded bg-[#0ea5e9] text-[#003751] font-bold text-xs"
                    >
                      Withdrawal Queue (4)
                    </button>
                    <button
                      onClick={() => onSelectNav('bot-risk-control')}
                      className="px-3 py-1.5 rounded bg-[#242a38] text-[#dde2f5] font-semibold text-xs hover:bg-[#333948]"
                    >
                      Bot & Risk Control
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-2">
                  <div className="bg-[#080e1b] p-3.5 rounded-lg border border-[#3e4850]/20">
                    <span className="text-[10px] text-[#88929b] uppercase font-bold block">Aggregated 24h Volume</span>
                    <span className="font-data-mono-lg text-lg text-[#dde2f5] font-bold">$18.42M USDT</span>
                    <span className="text-[11px] text-[#4fdbc8] block mt-1">+8.4% vs 7D average</span>
                  </div>
                  <div className="bg-[#080e1b] p-3.5 rounded-lg border border-[#3e4850]/20">
                    <span className="text-[10px] text-[#88929b] uppercase font-bold block">Active Triangular Nodes</span>
                    <span className="font-data-mono-lg text-lg text-[#4fdbc8] font-bold">1,248 / 1,420</span>
                    <span className="text-[11px] text-[#89ceff] block mt-1">98.2% fill reliability</span>
                  </div>
                  <div className="bg-[#080e1b] p-3.5 rounded-lg border border-[#3e4850]/20">
                    <span className="text-[10px] text-[#88929b] uppercase font-bold block">Net Platform Retention</span>
                    <span className="font-data-mono-lg text-lg text-[#89ceff] font-bold">$22,720.00 USDT</span>
                    <span className="text-[11px] text-[#4fdbc8] block mt-1">9.00% Net Fee Pool</span>
                  </div>
                  <div className="bg-[#080e1b] p-3.5 rounded-lg border border-[#3e4850]/20">
                    <span className="text-[10px] text-[#88929b] uppercase font-bold block">Consensus Latency RTT</span>
                    <span className="font-data-mono-lg text-lg text-[#4cd7f6] font-bold">1.42 ms</span>
                    <span className="text-[11px] text-[#4fdbc8] block mt-1">Air-Gap 4/4 Guard</span>
                  </div>
                </div>
              </div>

              {/* Bot Risk Control Preview */}
              <BotRiskControlView showToast={showToast} />
            </div>
          )}

          {currentNav === 'exchange-connectors' && (
            <div className="p-6 space-y-4 max-w-[1600px] mx-auto">
              <div className="bg-[#161b29] rounded-xl p-5 border border-[#3e4850]/30 space-y-2">
                <h2 className="font-headline-lg text-headline-lg font-bold text-[#dde2f5]">
                  Institutional Exchange Gateways & API Relays
                </h2>
                <p className="text-xs text-[#bec8d2]">
                  Manage encrypted API keys, static server IP whitelisting (198.51.100.44, 198.51.100.45, 203.0.113.12), and zero-withdrawal locks.
                </p>
              </div>
              <BotRiskControlView showToast={showToast} />
            </div>
          )}

          {currentNav === 'wallet-liabilities' && (
            <div className="p-6 space-y-4 max-w-[1600px] mx-auto">
              <div className="bg-[#161b29] rounded-xl p-5 border border-[#3e4850]/30 space-y-2">
                <h2 className="font-headline-lg text-headline-lg font-bold text-[#dde2f5]">
                  Platform Wallet Liabilities & Reserve Proofs
                </h2>
                <p className="text-xs text-[#bec8d2]">
                  Real-time segregated hot float balances ($342,850.00 USDT) versus user exchange sub-accounts ($4.18M non-custodial capital).
                </p>
              </div>
              <WithdrawalQueueView showToast={showToast} />
            </div>
          )}

          {currentNav === 'support-crm' && (
            <div className="p-6 space-y-4 max-w-[1600px] mx-auto">
              <div className="bg-[#161b29] rounded-xl p-5 border border-[#3e4850]/30 space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="font-headline-lg text-headline-lg font-bold text-[#dde2f5]">
                    Support CRM Desk (12 Pending Tickets)
                  </h2>
                  <span className="font-data-mono-sm text-xs text-[#89ceff] bg-[#89ceff]/10 px-2.5 py-1 rounded font-bold">
                    Avg Response: 4.2m
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="p-3 rounded-lg bg-[#080e1b] flex items-center justify-between border border-[#3e4850]/20">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-[#ffb4ab]">error</span>
                      <div>
                        <div className="font-semibold text-sm text-[#dde2f5]">#TKT-9912 • AS-882941: Bybit Session Token Refresh</div>
                        <div className="text-xs text-[#bec8d2]">API rate limit approached threshold 88%. Token renewed successfully.</div>
                      </div>
                    </div>
                    <button
                      onClick={() => showToast('Ticket #TKT-9912 marked resolved.')}
                      className="px-3 py-1 rounded bg-[#242a38] hover:bg-[#333948] text-xs font-bold"
                    >
                      Resolve
                    </button>
                  </div>

                  <div className="p-3 rounded-lg bg-[#080e1b] flex items-center justify-between border border-[#3e4850]/20">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-[#4fdbc8]">check_circle</span>
                      <div>
                        <div className="font-semibold text-sm text-[#dde2f5]">#TKT-9908 • AS-104922: 24h SLA Urgent Withdrawal Co-sign</div>
                        <div className="text-xs text-[#bec8d2]">SuperAdmin review required for &gt;$1K threshold. Pending 2nd checker.</div>
                      </div>
                    </div>
                    <button
                      onClick={() => onSelectNav('withdrawal-queue')}
                      className="px-3 py-1 rounded bg-[#0ea5e9] text-[#003751] text-xs font-bold"
                    >
                      Open Queue
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentNav === 'staff-roles' && (
            <div className="p-6 space-y-4 max-w-[1600px] mx-auto">
              <div className="bg-[#161b29] rounded-xl p-5 border border-[#3e4850]/30 space-y-3">
                <h2 className="font-headline-lg text-headline-lg font-bold text-[#dde2f5]">
                  Staff & Maker-Checker Security Roles
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                  <div className="bg-[#080e1b] p-3.5 rounded-lg border border-[#3e4850]/20">
                    <div className="font-bold text-[#dde2f5]">Super Admin (Desk #01)</div>
                    <div className="text-xs text-[#4fdbc8] font-mono">Role: SUPER_ADMIN_L4</div>
                    <div className="text-xs text-[#bec8d2] mt-1">Air-Gapped YubiKey 5C NFC • Active</div>
                  </div>
                  <div className="bg-[#080e1b] p-3.5 rounded-lg border border-[#3e4850]/20">
                    <div className="font-bold text-[#dde2f5]">Security Officer #04</div>
                    <div className="text-xs text-[#89ceff] font-mono">Role: ENCLAVE_CHECKER</div>
                    <div className="text-xs text-[#bec8d2] mt-1">Multisig Quorum 2/3 Validated</div>
                  </div>
                  <div className="bg-[#080e1b] p-3.5 rounded-lg border border-[#3e4850]/20">
                    <div className="font-bold text-[#dde2f5]">Risk Officer L3</div>
                    <div className="text-xs text-[#4cd7f6] font-mono">Role: QUANT_RISK_L3</div>
                    <div className="text-xs text-[#bec8d2] mt-1">Circuit Breakers & Kill-Switch Authorized</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentNav === 'immutable-audit-logs' && (
            <div className="p-6 space-y-4 max-w-[1600px] mx-auto">
              <FiveTierLedgerView showToast={showToast} />
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
