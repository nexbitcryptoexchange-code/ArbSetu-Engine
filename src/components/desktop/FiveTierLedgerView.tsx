import React, { useState } from 'react';
import { INITIAL_LEDGER_ENTRIES } from '../../data/mockData';
import { LedgerEntry } from '../../types';

interface FiveTierLedgerViewProps {
  showToast: (msg: string, isError?: boolean) => void;
}

export const FiveTierLedgerView: React.FC<FiveTierLedgerViewProps> = ({ showToast }) => {
  const [searchQuery, setSearchQuery] = useState('AS-882941');
  const [ledgerEntries] = useState<LedgerEntry[]>(INITIAL_LEDGER_ENTRIES);

  // Modals
  const [activeActionModal, setActiveActionModal] = useState<{
    title: string;
    actionCode: string;
    desc: string;
  } | null>(null);
  const [auditReason, setAuditReason] = useState('');
  const [inspectingHash, setInspectingHash] = useState<string | null>(null);

  const handleOpenAction = (title: string, actionCode: string, desc: string) => {
    setActiveActionModal({ title, actionCode, desc });
    setAuditReason('');
  };

  const handleSubmitAction = () => {
    if (!auditReason.trim()) {
      showToast('Mandatory justification reason is required for compliance audit logging.', true);
      return;
    }

    const action = activeActionModal ? activeActionModal.title : 'Action';
    showToast(`[HSM ENCLAVE SUCCESS] Action "${action}" signed by Super Admin. Receipt written to Merkle stream.`);
    setActiveActionModal(null);
  };

  return (
    <div className="flex flex-col w-full bg-[#0d1320] min-h-screen text-[#dde2f5]">
      <div className="p-6 space-y-6 max-w-[1600px] mx-auto w-full">
        {/* TOP SECTION: CONTEXT BAR & AUDIT SEARCH */}
        <div className="flex flex-col gap-3">
          {/* Upper Telemetry Row */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="font-label-caps text-label-caps uppercase px-2 py-0.5 rounded bg-[#242a38] text-[#89ceff] tracking-widest font-bold">
                Core Engine Ledger
              </span>
              <span className="font-data-mono-sm text-xs text-[#88929b]">/</span>
              <span className="font-data-mono-sm text-xs text-[#bec8d2] font-mono">
                SYS_EPOCH #4829-REV4
              </span>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#4fdbc8]/10 text-[#4fdbc8] text-xs font-data-mono-sm font-bold">
                <span className="h-1.5 w-1.5 rounded-full bg-[#4fdbc8] animate-pulse"></span>
                SHARD #02 SYNCED
              </span>
            </div>

            <div className="flex items-center gap-2 text-[#bec8d2]">
              <span className="font-label-caps text-label-caps uppercase text-[#88929b]">Merkle Root:</span>
              <span className="font-data-mono-sm text-xs font-mono text-[#4cd7f6] font-semibold">0x8f3c...b099</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText('0x8f3cb09941a87729fca1029487cbea89921041928471c08');
                  showToast('Merkle root hash copied to clipboard');
                }}
                className="p-1 rounded hover:bg-[#242a38] text-[#bec8d2] transition-colors"
                title="Copy Merkle State"
              >
                <span className="material-symbols-outlined text-[16px]">content_copy</span>
              </button>
            </div>
          </div>

          {/* Investigation Search Bar */}
          <div className="bg-[#161b29] rounded-xl p-2 shadow-md flex flex-col md:flex-row items-stretch md:items-center gap-2 border border-[#3e4850]/30">
            <div className="relative flex-1 flex items-center">
              <span className="material-symbols-outlined absolute left-3 text-[#88929b] text-[20px]">
                manage_search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by UID (e.g. AS-882941), Email, TRC20/BEP20 Address, or Trade ID..."
                className="w-full bg-[#1a1f2d] text-[#dde2f5] placeholder:text-[#88929b] font-data-mono-md text-sm pl-10 pr-24 py-2.5 rounded-lg focus:outline-none focus:bg-[#242a38] border border-[#3e4850]/30 transition-colors"
              />
              <span className="absolute right-3 font-data-mono-sm text-xs text-[#88929b] px-1.5 py-0.5 rounded bg-[#242a38]">
                ESC to clear
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => showToast('Displaying recent 14 ledger investigation logs.')}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-[#242a38] hover:bg-[#333948] text-[#dde2f5] font-body-sm text-xs font-semibold transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">history</span>
                <span>Recent (14)</span>
              </button>
              <button
                onClick={() => showToast(`Entities inspected for query: ${searchQuery}`)}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-[#0ea5e9] hover:bg-[#89ceff] text-[#003751] font-body-sm text-xs font-bold transition-colors shadow-sm"
              >
                <span className="material-symbols-outlined text-[18px]">travel_explore</span>
                <span>Inspect Entity</span>
              </button>
            </div>
          </div>
        </div>

        {/* ACTIVE PROFILE VIEW: DOSSIER & SECURITY INTERVENTION BAR */}
        <div className="bg-[#080e1b] rounded-xl p-5 shadow-md space-y-4 border border-[#3e4850]/30">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Left: Verified ID & Lineage */}
            <div className="flex items-start sm:items-center gap-4">
              <div className="h-14 w-14 rounded-xl bg-[#242a38] flex items-center justify-center text-[#89ceff] shadow-inner shrink-0 border border-[#3e4850]/30">
                <span className="material-symbols-outlined text-[32px]">shield_person</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-headline-lg text-headline-lg font-bold text-[#dde2f5] tracking-tight">
                    AS-882941
                  </span>
                  <span className="px-2 py-0.5 rounded bg-[#4fdbc8]/15 text-[#4fdbc8] font-label-caps text-[10px] uppercase font-bold flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">verified</span>
                    Verified Tier 2 KYC
                  </span>
                  <span className="px-2 py-0.5 rounded bg-[#242a38] text-[#bec8d2] font-data-mono-sm text-xs">
                    j.vander**@quantmatrix.io
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-data-mono-sm text-xs text-[#88929b]">
                  <div className="flex items-center gap-1">
                    <span className="text-[#bec8d2]">Sponsor Lineage:</span>
                    <span className="text-[#4cd7f6] font-bold flex items-center gap-0.5">
                      <span className="material-symbols-outlined text-[14px] text-[#4cd7f6]">lock</span>
                      AS-104922
                    </span>
                    <span className="text-[10px] text-[#88929b] px-1 rounded bg-[#1a1f2d]">(Immutable Level 1)</span>
                  </div>
                  <span className="text-[#3e4850]">•</span>
                  <div>24h Arbitrage Turnover: <span className="text-[#dde2f5] font-semibold">$184,920.00 USDT</span></div>
                  <span className="text-[#3e4850]">•</span>
                  <div>Prepaid Fuel Balance: <span className="text-[#4fdbc8] font-semibold">$382.41 USDT</span></div>
                </div>
              </div>
            </div>

            {/* Right: Risk & Anomaly Score */}
            <div className="flex items-center gap-4 bg-[#161b29] px-4 py-2 rounded-lg border border-[#3e4850]/30">
              <div className="flex flex-col text-right">
                <span className="font-label-caps text-[10px] text-[#88929b] uppercase">Arbitrage Slip Delta</span>
                <span className="font-data-mono-md text-data-mono-md text-[#4fdbc8] font-bold">0.014% (Optimal)</span>
              </div>
              <div className="h-8 w-px bg-[#242a38]"></div>
              <div className="flex flex-col text-right">
                <span className="font-label-caps text-[10px] text-[#88929b] uppercase">Risk Vector Score</span>
                <span className="font-data-mono-md text-data-mono-md text-[#89ceff] font-bold">12 / 100</span>
              </div>
            </div>
          </div>

          {/* Account Controls Toolbar */}
          <div className="pt-2 flex flex-wrap items-center justify-between gap-2 bg-[#161b29]/60 p-2.5 rounded-lg border border-[#3e4850]/20">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#88929b] text-[18px]">gavel</span>
              <span className="font-label-caps text-label-caps uppercase text-[#88929b] tracking-wider font-semibold">
                Operational Interventions:
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => handleOpenAction('Disable Login', 'USER_ACCESS_REVOCATION', 'Suspends authentication provider tokens & locks direct session entry.')}
                className="px-3 py-1.5 rounded bg-[#242a38] hover:bg-[#93000a] hover:text-[#ffdad6] text-[#dde2f5] font-body-sm text-xs font-semibold transition-all flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">no_accounts</span>
                <span>Disable Login</span>
              </button>
              <button
                onClick={() => handleOpenAction('Pause Trading Bot', 'BOT_KILL_SIGNAL', 'Signals hyper-liquid execution engine to unmount active triangular loops immediately.')}
                className="px-3 py-1.5 rounded bg-[#242a38] hover:bg-[#333948] text-[#dde2f5] font-body-sm text-xs font-semibold transition-all flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px] text-[#4cd7f6]">pause_circle</span>
                <span>Pause Trading Bot</span>
              </button>
              <button
                onClick={() => handleOpenAction('Freeze Referral Withdrawals', 'AFFILIATE_WITHDRAWAL_LOCK', 'Freezes pending Ledger credits and marks withdrawal queues to admin audit.')}
                className="px-3 py-1.5 rounded bg-[#242a38] hover:bg-[#333948] text-[#dde2f5] font-body-sm text-xs font-semibold transition-all flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px] text-[#ffb4ab]">lock_reset</span>
                <span>Freeze Referral Withdrawals</span>
              </button>
              <button
                onClick={() => handleOpenAction('Revoke All Sessions', 'TOKEN_TERMINATE_ALL', 'Invalidates Redis bearer tokens and flushes hardware keys across 12 node relays.')}
                className="px-3 py-1.5 rounded bg-[#242a38] hover:bg-[#333948] text-[#dde2f5] font-body-sm text-xs font-semibold transition-all flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">logout</span>
                <span>Revoke All Sessions</span>
              </button>
              <button
                onClick={() => handleOpenAction('Require 2FA Reset', 'SEC_RESET_CHALLENGE', 'Forces hardware TOTP and biometrics re-enrollment at next administrative handoff.')}
                className="px-3 py-1.5 rounded bg-[#0ea5e9]/20 text-[#89ceff] hover:bg-[#0ea5e9] hover:text-[#003751] font-body-sm text-xs font-semibold transition-all flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">phonelink_lock</span>
                <span>Require 2FA Reset</span>
              </button>
            </div>
          </div>
        </div>

        {/* MAIN BENTO: 5-TIER ATTRIBUTION BREAKDOWN & SETTLEMENT ENGINE */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          {/* Left 7 Cols: 5-Tier Allocation Matrix & Split Visualizer */}
          <div className="xl:col-span-7 bg-[#080e1b] rounded-xl p-5 shadow-md flex flex-col justify-between space-y-4 border border-[#3e4850]/30">
            <div>
              <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-headline-md text-headline-md text-[#dde2f5] font-bold">
                      Attribution Breakdown
                    </span>
                    <span className="px-2 py-0.5 rounded bg-[#242a38] font-data-mono-sm text-xs text-[#89ceff] font-bold">
                      #ARB-90214
                    </span>
                  </div>
                  <p className="font-body-sm text-body-sm text-[#88929b] mt-0.5">
                    Real-time split verification on taker-reconciled cross-venue execution.
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-label-caps text-label-caps uppercase text-[#88929b] block">
                    Gross Arbitrage Yield
                  </span>
                  <span className="font-data-mono-lg text-data-mono-lg text-[#4fdbc8] font-bold">
                    +$15.80000000 USDT
                  </span>
                </div>
              </div>

              {/* Top-level 91% vs 9% Visual Split Bar */}
              <div className="bg-[#161b29] rounded-lg p-3 space-y-2 mb-4 border border-[#3e4850]/20">
                <div className="flex items-center justify-between text-xs font-medium">
                  <span className="text-[#dde2f5] flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-[#89ceff]"></span>
                    Trading User Retained (91.0%): <strong className="text-[#dde2f5] font-mono">$14.3820 USDT</strong>
                  </span>
                  <span className="text-[#4cd7f6] flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-[#4cd7f6]"></span>
                    Service Wallet Cut (9.0%): <strong className="font-mono">$1.4180 USDT</strong>
                  </span>
                </div>

                <div className="w-full h-3 rounded bg-[#242a38] flex overflow-hidden">
                  <div className="bg-[#89ceff] h-full" style={{ width: '91%' }}></div>
                  <div className="bg-[#4cd7f6] h-full" style={{ width: '9%' }}></div>
                </div>

                <div className="flex justify-between font-data-mono-sm text-[11px] text-[#88929b] pt-0.5">
                  <span>Kept in user balance (Binance Spot / OKX Perp API)</span>
                  <span>Settled from Prepaid Gas Ledger</span>
                </div>
              </div>

              {/* Tier Breakdown Cards List */}
              <div className="space-y-1.5">
                <div className="px-2 pb-1 flex items-center justify-between font-label-caps text-[10px] uppercase text-[#88929b]">
                  <span>Attribution Tier & Node Target</span>
                  <span>Rate / Net Allocation</span>
                  <span>Accounting Status</span>
                </div>

                {/* Level 1 */}
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#161b29] hover:bg-[#1a1f2d] transition-colors border border-[#3e4850]/20">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded bg-[#89ceff]/20 text-[#89ceff] flex items-center justify-center font-data-mono-sm text-xs font-bold">
                      L1
                    </div>
                    <div>
                      <div className="font-data-mono-md text-xs text-[#dde2f5] font-bold flex items-center gap-1.5">
                        <span>AS-104922</span>
                        <span className="text-[10px] text-[#88929b] font-normal">Direct Sponsor</span>
                      </div>
                      <div className="font-data-mono-sm text-[11px] text-[#88929b]">BEP-20 • KYC Passed</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-data-mono-md text-xs text-[#dde2f5] font-bold">4.0%  ($0.6320 USDT)</div>
                    <div className="font-data-mono-sm text-[10px] text-[#88929b]">28.57% of 9% Pool</div>
                  </div>
                  <div>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#4fdbc8]/10 text-[#4fdbc8] font-label-caps text-[10px] uppercase font-bold">
                      <span className="material-symbols-outlined text-[14px]">done_all</span>
                      Credited
                    </span>
                  </div>
                </div>

                {/* Level 2 */}
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#161b29] hover:bg-[#1a1f2d] transition-colors border border-[#3e4850]/20">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded bg-[#89ceff]/20 text-[#89ceff] flex items-center justify-center font-data-mono-sm text-xs font-bold">
                      L2
                    </div>
                    <div>
                      <div className="font-data-mono-md text-xs text-[#dde2f5] font-bold flex items-center gap-1.5">
                        <span>AS-091421</span>
                        <span className="text-[10px] text-[#88929b] font-normal">Secondary Upline</span>
                      </div>
                      <div className="font-data-mono-sm text-[11px] text-[#88929b]">TRC-20 • KYC Passed</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-data-mono-md text-xs text-[#dde2f5] font-bold">2.0%  ($0.3160 USDT)</div>
                    <div className="font-data-mono-sm text-[10px] text-[#88929b]">14.28% of 9% Pool</div>
                  </div>
                  <div>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#4fdbc8]/10 text-[#4fdbc8] font-label-caps text-[10px] uppercase font-bold">
                      <span className="material-symbols-outlined text-[14px]">done_all</span>
                      Credited
                    </span>
                  </div>
                </div>

                {/* Level 3 (Unassigned) */}
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#161b29]/60 hover:bg-[#1a1f2d] transition-colors border border-[#3e4850]/20">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded bg-[#242a38] text-[#88929b] flex items-center justify-center font-data-mono-sm text-xs font-bold">
                      L3
                    </div>
                    <div>
                      <div className="font-data-mono-md text-xs text-[#bec8d2] font-semibold flex items-center gap-1.5">
                        <span>Unassigned Slot</span>
                        <span className="text-[10px] text-[#88929b] font-normal">Missing Sponsor Node</span>
                      </div>
                      <div className="font-data-mono-sm text-[11px] text-[#88929b]">Reversion Target: [ROOT_TREASURY_0]</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-data-mono-md text-xs text-[#bec8d2] font-medium">1.0%  ($0.1580 USDT)</div>
                    <div className="font-data-mono-sm text-[10px] text-[#88929b]">Auto-Sweep Trigger</div>
                  </div>
                  <div>
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-[#242a38] text-[#4cd7f6] font-label-caps text-[10px] uppercase font-bold">
                      <span className="material-symbols-outlined text-[14px]">turn_slight_right</span>
                      Admin Reverted
                    </span>
                  </div>
                </div>

                {/* Level 4 (Unassigned) */}
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#161b29]/60 hover:bg-[#1a1f2d] transition-colors border border-[#3e4850]/20">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded bg-[#242a38] text-[#88929b] flex items-center justify-center font-data-mono-sm text-xs font-bold">
                      L4
                    </div>
                    <div>
                      <div className="font-data-mono-md text-xs text-[#bec8d2] font-medium">Unassigned Slot</div>
                      <div className="font-data-mono-sm text-[11px] text-[#88929b]">Depth Null • Target: [ROOT_TREASURY_0]</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-data-mono-md text-xs text-[#bec8d2] font-medium">0.5%  ($0.0790 USDT)</div>
                    <div className="font-data-mono-sm text-[10px] text-[#88929b]">Auto-Sweep Trigger</div>
                  </div>
                  <div>
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-[#242a38] text-[#4cd7f6] font-label-caps text-[10px] uppercase font-bold">
                      <span className="material-symbols-outlined text-[14px]">turn_slight_right</span>
                      Admin Reverted
                    </span>
                  </div>
                </div>

                {/* Level 5 (Unassigned) */}
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#161b29]/60 hover:bg-[#1a1f2d] transition-colors border border-[#3e4850]/20">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded bg-[#242a38] text-[#88929b] flex items-center justify-center font-data-mono-sm text-xs font-bold">
                      L5
                    </div>
                    <div>
                      <div className="font-data-mono-md text-xs text-[#bec8d2] font-medium">Unassigned Slot</div>
                      <div className="font-data-mono-sm text-[11px] text-[#88929b]">Depth Null • Target: [ROOT_TREASURY_0]</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-data-mono-md text-xs text-[#bec8d2] font-medium">0.5%  ($0.0790 USDT)</div>
                    <div className="font-data-mono-sm text-[10px] text-[#88929b]">Auto-Sweep Trigger</div>
                  </div>
                  <div>
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-[#242a38] text-[#4cd7f6] font-label-caps text-[10px] uppercase font-bold">
                      <span className="material-symbols-outlined text-[14px]">turn_slight_right</span>
                      Admin Reverted
                    </span>
                  </div>
                </div>

                {/* Company Protocol Base */}
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#1a1f2d] border border-[#3e4850]/30">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded bg-[#00aac6]/30 text-[#4cd7f6] flex items-center justify-center font-data-mono-sm text-xs font-bold">
                      PF
                    </div>
                    <div>
                      <div className="font-data-mono-md text-xs text-[#89ceff] font-bold">Company Protocol Base</div>
                      <div className="font-data-mono-sm text-[11px] text-[#88929b]">Fixed Platform Spread Retainer</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-data-mono-md text-xs text-[#89ceff] font-bold">1.0%  ($0.1580 USDT)</div>
                    <div className="font-data-mono-sm text-[10px] text-[#88929b]">Guaranteed Floor</div>
                  </div>
                  <div>
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-[#89ceff]/10 text-[#89ceff] font-label-caps text-[10px] uppercase font-bold">
                      <span className="material-symbols-outlined text-[14px]">shield</span>
                      Fixed Revenue
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Zero Dynamic Compression Notice */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-[#161b29] text-[#bec8d2] font-data-mono-sm text-xs border border-[#3e4850]/20">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-[#4fdbc8]">verified_user</span>
                <span>Zero Dynamic Compression Policy Enforced. Level 6+ receives 0.00%. Unallocated pools revert to root.</span>
              </div>
              <span className="text-[#88929b] font-mono">NON-MUTABLE-V2</span>
            </div>
          </div>

          {/* Right 5 Cols: Company Retention & Reserve Visual Ledger */}
          <div className="xl:col-span-5 flex flex-col gap-4">
            {/* Net Retention Summary Card */}
            <div className="bg-[#080e1b] rounded-xl p-5 shadow-md space-y-4 border border-[#3e4850]/30">
              <div className="flex items-center justify-between">
                <span className="font-label-caps text-label-caps uppercase text-[#88929b] font-semibold">
                  Total Admin Retention (Order #ARB-90214)
                </span>
                <span className="material-symbols-outlined text-[#89ceff] text-[20px]">account_balance</span>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="font-headline-xl text-headline-xl text-[#dde2f5] font-extrabold">$0.4740</span>
                <span className="font-data-mono-md text-data-mono-md text-[#4fdbc8] font-bold">
                  USDT (33.42% of 9% Fee)
                </span>
              </div>

              {/* Formulaic Breakdown */}
              <div className="space-y-1 font-data-mono-sm text-xs">
                <div className="flex justify-between py-1.5 px-2.5 rounded bg-[#161b29] text-[#bec8d2]">
                  <span>Base Protocol Revenue (1.0%):</span>
                  <span className="text-[#dde2f5] font-bold">+$0.1580 USDT</span>
                </div>
                <div className="flex justify-between py-1.5 px-2.5 rounded bg-[#161b29] text-[#bec8d2]">
                  <span>Auto-Reverted Unassigned Tiers (L3+L4+L5):</span>
                  <span className="text-[#4cd7f6] font-bold">+$0.3160 USDT</span>
                </div>
                <div className="flex justify-between py-1.5 px-2.5 rounded bg-[#1a1f2d] text-[#dde2f5] font-semibold">
                  <span>Direct Outflow to Affiliates (L1+L2):</span>
                  <span className="text-[#4fdbc8] font-bold">-$0.9480 USDT</span>
                </div>
              </div>

              {/* SVG Donut Chart representing Allocation of the 9% Fee */}
              <div className="bg-[#161b29] p-4 rounded-lg flex items-center justify-around gap-4 border border-[#3e4850]/20">
                <div className="relative w-28 h-28 shrink-0">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    {/* Background */}
                    <path
                      className="text-[#242a38]"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="4.5"
                    />
                    {/* L1 (44.4%) */}
                    <path
                      className="text-[#4fdbc8]"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="currentColor"
                      strokeDasharray="44.4, 100"
                      strokeWidth="4.5"
                    />
                    {/* L2 (22.2%) offset 44.4 */}
                    <path
                      className="text-[#4fdbc8]/60"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="currentColor"
                      strokeDasharray="22.2, 100"
                      strokeDashoffset="-44.4"
                      strokeWidth="4.5"
                    />
                    {/* Admin Reverted (22.2%) offset 66.6 */}
                    <path
                      className="text-[#4cd7f6]"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="currentColor"
                      strokeDasharray="22.2, 100"
                      strokeDashoffset="-66.6"
                      strokeWidth="4.5"
                    />
                    {/* Protocol Base (11.2%) offset 88.8 */}
                    <path
                      className="text-[#89ceff]"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="currentColor"
                      strokeDasharray="11.2, 100"
                      strokeDashoffset="-88.8"
                      strokeWidth="4.5"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="font-data-mono-sm text-xs font-bold text-[#dde2f5]">$1.42</span>
                    <span className="text-[9px] uppercase tracking-wider text-[#88929b]">9% Fee</span>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 font-data-mono-sm text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#4fdbc8]"></span>
                    <span className="text-[#bec8d2]">L1 Affiliate: 44.4%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#4fdbc8]/60"></span>
                    <span className="text-[#bec8d2]">L2 Affiliate: 22.2%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#4cd7f6]"></span>
                    <span className="text-[#bec8d2]">Admin Revert: 22.2%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#89ceff]"></span>
                    <span className="text-[#bec8d2]">Base Retainer: 11.2%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Accounting Sanity Check */}
            <div className="bg-[#080e1b] rounded-xl p-5 shadow-md space-y-3 flex-1 flex flex-col justify-between border border-[#3e4850]/30">
              <div className="flex items-center justify-between">
                <span className="font-label-caps text-label-caps uppercase text-[#88929b] font-semibold">
                  Accounting Sanity Check
                </span>
                <span className="px-2 py-0.5 rounded bg-[#4fdbc8]/15 text-[#4fdbc8] font-label-caps text-[10px] font-bold">
                  BALANCED 0.00000000 Δ
                </span>
              </div>
              <p className="font-body-sm text-body-sm text-[#bec8d2] leading-snug">
                All credit vectors strictly mirror debit balance calls from User Prepaid Hot Reserve <code className="text-[#4cd7f6]">0x62a...82f</code>. No synthetic credit minting permitted under protocol consensus rules.
              </p>
              <div className="grid grid-cols-2 gap-2 pt-2">
                <div className="bg-[#161b29] p-2.5 rounded border border-[#3e4850]/20">
                  <span className="text-[10px] text-[#88929b] font-label-caps uppercase block">Debit Pool</span>
                  <span className="font-data-mono-md text-data-mono-md font-bold text-[#dde2f5]">-$1.4180 USDT</span>
                </div>
                <div className="bg-[#161b29] p-2.5 rounded border border-[#3e4850]/20">
                  <span className="text-[10px] text-[#88929b] font-label-caps uppercase block">Credit Sum</span>
                  <span className="font-data-mono-md text-data-mono-md font-bold text-[#4fdbc8]">+$1.4180 USDT</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* DOUBLE-ENTRY GENERAL LEDGER FEED */}
        <div className="bg-[#080e1b] rounded-xl shadow-md overflow-hidden flex flex-col border border-[#3e4850]/30">
          <div className="p-4 bg-[#161b29] flex flex-col md:flex-row items-start md:items-center justify-between gap-3 border-b border-[#3e4850]/30">
            <div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#89ceff] text-[22px]">receipt_long</span>
                <span className="font-headline-md text-headline-md font-bold text-[#dde2f5]">
                  Immutable General Ledger
                </span>
              </div>
              <p className="font-body-sm text-body-sm text-[#88929b]">
                Continuous append-only cryptographic event journal. Cryptographically signed by AWS CloudHSM / Staff enclave.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => showToast('Ledger filter applied: AS-882941')}
                className="px-3 py-1.5 rounded-lg bg-[#242a38] text-[#dde2f5] hover:bg-[#333948] font-data-mono-sm text-xs font-semibold flex items-center gap-1.5 transition-colors border border-[#3e4850]/30"
              >
                <span className="material-symbols-outlined text-[16px]">filter_list</span>
                <span>Filter: AS-882941</span>
              </button>
              <button
                onClick={() => showToast('Exporting encrypted CSV & Merkle signatures...')}
                className="px-3 py-1.5 rounded-lg bg-[#242a38] text-[#dde2f5] hover:bg-[#333948] font-data-mono-sm text-xs font-semibold flex items-center gap-1.5 transition-colors border border-[#3e4850]/30"
              >
                <span className="material-symbols-outlined text-[16px]">file_download</span>
                <span>Export CSV & Signatures</span>
              </button>
              <span className="h-6 w-px bg-[#3e4850]/40"></span>
              <button
                onClick={() => showToast('All 1,489 blocks cryptographically verified with 0 delta.')}
                className="px-3 py-1.5 rounded-lg bg-[#4fdbc8]/15 text-[#4fdbc8] hover:bg-[#4fdbc8]/25 font-data-mono-sm text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">verified</span>
                <span>Verify Proof Chain</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#080e1b] font-label-caps text-[10px] uppercase text-[#88929b] border-b border-[#3e4850]/20">
                  <th className="py-3 px-4">Entry ID</th>
                  <th className="py-3 px-4">Timestamp (UTC)</th>
                  <th className="py-3 px-4">Debit Account</th>
                  <th className="py-3 px-4">Credit Account</th>
                  <th className="py-3 px-4">Asset</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4">Reference Entity</th>
                  <th className="py-3 px-4">Signed By</th>
                  <th className="py-3 px-4 text-center">Hash Proof</th>
                </tr>
              </thead>
              <tbody className="font-data-mono-sm text-xs divide-y divide-[#3e4850]/20">
                {ledgerEntries.map((row) => (
                  <tr
                    key={row.id}
                    className="hover:bg-[#161b29] transition-colors group"
                  >
                    <td className="py-3 px-4 text-[#89ceff] font-bold">{row.id}</td>
                    <td className="py-3 px-4 text-[#bec8d2] font-mono">{row.timestamp}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-[#1a1f2d] text-[#dde2f5] font-semibold border border-[#3e4850]/20">
                        {row.debitAccount}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-[#1a1f2d] text-[#4cd7f6] font-semibold border border-[#3e4850]/20">
                        {row.creditAccount}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[#dde2f5] font-bold">{row.asset}</td>
                    <td className={`py-3 px-4 text-right font-bold ${row.amount > 0 ? 'text-[#4fdbc8]' : 'text-[#ffb4ab]'}`}>
                      {row.amount > 0 ? `+${row.amount.toFixed(8)}` : row.amount.toFixed(8)}
                    </td>
                    <td className="py-3 px-4 text-[#bec8d2]">{row.referenceEntity}</td>
                    <td className="py-3 px-4 text-[#88929b] flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px] text-[#4fdbc8]">memory</span>
                      <span>{row.signedBy}</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => setInspectingHash(row.fullHash)}
                        className="text-[#4cd7f6] hover:underline font-mono"
                      >
                        {row.hashProof}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-3 bg-[#161b29] flex flex-col sm:flex-row items-center justify-between gap-3 text-[#88929b] font-data-mono-sm text-xs border-t border-[#3e4850]/30">
            <div className="flex items-center gap-3">
              <span>Showing 6 of 1,489 Ledger Transactions</span>
              <span className="text-[#3e4850]">•</span>
              <span className="text-[#4fdbc8] flex items-center gap-1 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#4fdbc8]"></span>
                Ledger Hash Verified Up to Block #1,920,402
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button disabled className="px-2.5 py-1 rounded bg-[#242a38] text-[#88929b] disabled:opacity-40">Prev</button>
              <span className="px-2 py-0.5 rounded bg-[#0ea5e9] text-[#003751] font-bold">1</span>
              <button className="px-2.5 py-1 rounded bg-[#242a38] hover:bg-[#333948] text-[#dde2f5]">2</button>
              <button className="px-2.5 py-1 rounded bg-[#242a38] hover:bg-[#333948] text-[#dde2f5]">3</button>
              <span className="px-1 text-[#88929b]">...</span>
              <button className="px-2.5 py-1 rounded bg-[#242a38] hover:bg-[#333948] text-[#dde2f5]">248</button>
              <button className="px-2.5 py-1 rounded bg-[#242a38] hover:bg-[#333948] text-[#dde2f5]">Next</button>
            </div>
          </div>
        </div>
      </div>

      {/* Mandatory Audit Intervention Modal */}
      {activeActionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-[#1a1f2d] rounded-xl shadow-2xl w-full max-w-lg p-6 space-y-4 border border-[#3e4850]/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#ffb4ab] text-[24px]">gavel</span>
                <span className="font-headline-md text-headline-md font-bold text-[#dde2f5]">
                  {activeActionModal.title}
                </span>
              </div>
              <button
                onClick={() => setActiveActionModal(null)}
                className="p-1 rounded hover:bg-[#242a38] text-[#88929b] hover:text-[#dde2f5]"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="space-y-1.5">
              <p className="font-body-md text-body-md text-[#bec8d2]">
                {activeActionModal.desc}
              </p>
              <div className="p-2.5 rounded bg-[#161b29] font-data-mono-sm text-xs text-[#88929b] flex items-center justify-between border border-[#3e4850]/20">
                <span>Target Subject: <strong className="text-[#dde2f5]">AS-882941</strong></span>
                <span className="px-2 py-0.5 rounded bg-[#93000a] text-[#ffdad6] font-mono font-bold">
                  {activeActionModal.actionCode}
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block font-label-caps text-label-caps uppercase text-[#88929b] font-semibold">
                Mandatory Audit Justification / Ticket ID
              </label>
              <textarea
                value={auditReason}
                onChange={(e) => setAuditReason(e.target.value)}
                placeholder="E.g., Flagged by Risk Node 4 for anomalous spread velocity. Incident #SEC-9810..."
                rows={3}
                className="w-full bg-[#161b29] text-[#dde2f5] placeholder:text-[#88929b] font-body-sm text-xs p-3 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#89ceff] border border-[#3e4850]/30 resize-none"
              />
            </div>

            <div className="flex items-center justify-between pt-1 font-data-mono-sm text-xs text-[#88929b]">
              <span>Operator: <span className="text-[#dde2f5]">Super Admin (Desk #01)</span></span>
              <span>MFA Token: <strong className="text-[#4fdbc8]">READY</strong></span>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setActiveActionModal(null)}
                className="px-4 py-2 rounded-lg bg-[#242a38] text-[#dde2f5] hover:bg-[#333948] text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitAction}
                className="px-5 py-2 rounded-lg bg-[#93000a] hover:bg-[#690005] text-[#ffdad6] text-xs font-bold shadow-sm flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[18px]">verified</span>
                <span>Sign & Execute</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cryptographic Hash Inspector Modal */}
      {inspectingHash && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-[#1a1f2d] rounded-xl shadow-2xl w-full max-w-xl p-6 space-y-4 border border-[#3e4850]/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#4fdbc8] text-[24px]">lock</span>
                <span className="font-headline-md text-headline-md font-bold text-[#dde2f5]">
                  Cryptographic Proof Leaf
                </span>
              </div>
              <button
                onClick={() => setInspectingHash(null)}
                className="p-1 rounded hover:bg-[#242a38] text-[#88929b] hover:text-[#dde2f5]"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="space-y-3 font-data-mono-sm text-xs">
              <div className="space-y-1">
                <span className="font-label-caps text-label-caps uppercase text-[#88929b]">Blake3 State Hash</span>
                <div className="p-3 bg-[#161b29] rounded-lg text-[#4cd7f6] break-all select-all font-mono border border-[#3e4850]/20">
                  {inspectingHash}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[#bec8d2]">
                <div className="p-2.5 rounded bg-[#161b29] border border-[#3e4850]/20">
                  <span className="text-[10px] text-[#88929b] block uppercase">Merkle Proof Depth</span>
                  <span className="text-[#dde2f5] font-bold">14 Steps (Verified)</span>
                </div>
                <div className="p-2.5 rounded bg-[#161b29] border border-[#3e4850]/20">
                  <span className="text-[10px] text-[#88929b] block uppercase">HSM Certificate</span>
                  <span className="text-[#4fdbc8] font-bold">AWS_KMS_EU_WEST_1 #940</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setInspectingHash(null)}
                className="px-4 py-2 rounded-lg bg-[#242a38] text-[#dde2f5] hover:bg-[#333948] text-xs font-semibold"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
