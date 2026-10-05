import React, { useState } from 'react';
import { INITIAL_WITHDRAWALS } from '../../data/mockData';
import { WithdrawalRequest } from '../../types';

interface WithdrawalQueueViewProps {
  showToast: (msg: string, isError?: boolean) => void;
}

export const WithdrawalQueueView: React.FC<WithdrawalQueueViewProps> = ({ showToast }) => {
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>(INITIAL_WITHDRAWALS);
  const [activeFilter, setActiveFilter] = useState<'all' | 'sla-urgent' | 'awaiting-checker' | 'flagged' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [selectedRequest, setSelectedRequest] = useState<WithdrawalRequest | null>(null);
  const [hsmPin, setHsmPin] = useState('');
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  const filteredWithdrawals = withdrawals.filter((item) => {
    if (activeFilter === 'sla-urgent' && !item.isUrgentSla) return false;
    if (activeFilter === 'awaiting-checker' && item.status !== 'awaiting-checker') return false;
    if (activeFilter === 'flagged' && !item.riskFlag && item.status !== 'held') return false;
    if (activeFilter === 'completed' && item.status !== 'completed' && item.status !== 'tx-enclave-signed') return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        item.id.toLowerCase().includes(q) ||
        item.userUid.toLowerCase().includes(q) ||
        item.destinationAddress.toLowerCase().includes(q) ||
        item.netPayoutUsdt.toString().includes(q)
      );
    }
    return true;
  });

  const handleOpenCosignModal = (req: WithdrawalRequest) => {
    setSelectedRequest(req);
    setHsmPin('');
  };

  const handleConfirmCosign = () => {
    if (!hsmPin.trim()) {
      showToast('Security Passcode or YubiKey tap verification required!', true);
      return;
    }

    if (!selectedRequest) return;
    setIsBroadcasting(true);

    setTimeout(() => {
      setIsBroadcasting(false);
      const reqId = selectedRequest.id;
      setWithdrawals((prev) =>
        prev.map((w) =>
          w.id === reqId
            ? { ...w, status: 'tx-enclave-signed', checkerName: 'sec_admin_01 (YubiKey Signed)' }
            : w
        )
      );
      setSelectedRequest(null);
      showToast(`Checker signature confirmed for #${reqId}. Dispatched to Tron/BSC relayer nodes.`);
    }, 1000);
  };

  const handleMakerApprove = (id: string) => {
    setWithdrawals((prev) =>
      prev.map((w) =>
        w.id === id
          ? { ...w, status: 'awaiting-checker', makerName: 'fin_analyst_2 (Approved)' }
          : w
      )
    );
    showToast(`Maker signature attached for #${id}. Awaiting Checker co-sign.`);
  };

  const handleHold = (id: string) => {
    setWithdrawals((prev) =>
      prev.map((w) =>
        w.id === id ? { ...w, status: 'held' } : w
      )
    );
    showToast(`Payout #${id} flagged on Administrative Hold. SLA clock frozen.`, false);
  };

  const handleReject = (id: string) => {
    if (confirm(`Confirm rejection of payout #${id}? Unclaimed liability funds will return to affiliate balances.`)) {
      setWithdrawals((prev) =>
        prev.map((w) =>
          w.id === id ? { ...w, status: 'rejected' } : w
        )
      );
      showToast(`Payout #${id} rejected. Capital re-credited to internal ledger.`, true);
    }
  };

  return (
    <div className="flex flex-col w-full bg-[#0d1320] min-h-screen text-[#dde2f5]">
      <div className="w-full px-6 py-6 space-y-6 max-w-[1600px] mx-auto">
        {/* Banner: Dual-Custody Vault Gate */}
        <div className="relative overflow-hidden rounded-xl bg-[#161b29] shadow-sm border border-[#3e4850]/30">
          <div className="absolute -right-16 -top-16 w-96 h-96 rounded-full bg-[#0ea5e9]/5 blur-3xl pointer-events-none"></div>
          <div className="absolute left-1/3 -bottom-20 w-80 h-80 rounded-full bg-[#04b4a2]/5 blur-3xl pointer-events-none"></div>

          <div className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-label-caps text-label-caps px-2 py-0.5 rounded bg-[#0ea5e9]/20 text-[#89ceff] uppercase font-bold tracking-wider">
                  Dual-Custody Vault Gate
                </span>
                <span className="font-data-mono-sm text-xs text-[#bec8d2] font-mono">
                  ENCLAVE-HSM::EU-WEST-1
                </span>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#4fdbc8]/10 text-[#4fdbc8] text-[10px] font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#4fdbc8] animate-pulse"></span>
                  QUORUM: 2 OF 3 REQUIRED
                </span>
              </div>
              <div className="flex items-baseline gap-3">
                <h1 className="font-headline-lg text-headline-lg text-[#dde2f5] tracking-tight font-bold">
                  Maker-Checker Operations Hub
                </h1>
                <span className="font-data-mono-sm text-xs text-[#88929b] font-mono">
                  admin.arbsetu.example
                </span>
              </div>
              <p className="font-body-sm text-body-sm text-[#bec8d2] max-w-3xl leading-relaxed">
                Real-time multisig withdrawal authorization queue with automated SLA countdown enforcement, non-custodial capital isolation monitoring, and dual-officer cryptographic sign-off routines.
              </p>
            </div>

            <div className="flex items-center gap-2 self-start lg:self-center">
              <button
                onClick={() => showToast('Generating encrypted CSV & cryptographic Merkle balance snapshot...')}
                className="flex items-center gap-1.5 px-3 py-2 rounded bg-[#242a38] text-[#dde2f5] hover:bg-[#2f3543] transition-colors text-xs font-semibold shadow-sm"
              >
                <span className="material-symbols-outlined text-[16px] text-[#bec8d2]">download</span>
                <span>Ledger Snapshot</span>
              </button>
              <button
                onClick={() => {
                  if (confirm('EMERGENCY ACTION: Pause all automated settlement relay broadcast nodes?')) {
                    showToast('RELAYERS HALTED: Zero new transactions will broadcast until manual reset.', true);
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded bg-[#93000a] text-[#ffdad6] hover:bg-[#690005] transition-all text-xs font-bold shadow-sm"
              >
                <span className="material-symbols-outlined text-[16px]">pause_circle</span>
                <span>Pause Queue Broadcast</span>
              </button>
            </div>
          </div>

          <div className="px-5 py-2.5 bg-[#080e1b]/80 flex flex-wrap items-center justify-between gap-4 text-xs font-data-mono-sm border-t border-[#3e4850]/20">
            <div className="flex items-center gap-2 text-[#dde2f5]">
              <span className="material-symbols-outlined text-[#89ceff] text-[18px]">verified_user</span>
              <span className="text-[#bec8d2]">Active Signing Desk:</span>
              <span className="text-[#dde2f5] font-semibold">Security Officer #04 (Air-Gapped YubiKey 5C NFC)</span>
            </div>
            <div className="flex items-center gap-4 text-[#bec8d2]">
              <span>TX Pipeline Latency: <strong className="text-[#4fdbc8] font-mono">1.18s</strong></span>
              <span>RPC Relays: <strong className="text-[#dde2f5] font-mono">TRON-Grid #09 | BSC-Archive #02</strong></span>
              <span className="text-[#4fdbc8] font-semibold">Pki-Signed HSM Valid</span>
            </div>
          </div>
        </div>

        {/* 4 KPI Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {/* Card 1 */}
          <div className="rounded-xl bg-[#161b29] p-4 shadow-sm relative overflow-hidden border border-[#3e4850]/30">
            <div className="flex items-start justify-between">
              <span className="font-label-caps text-[10px] text-[#88929b] uppercase font-bold">Platform Liabilities</span>
              <span className="material-symbols-outlined text-[20px] text-[#89ceff]">account_balance</span>
            </div>
            <div className="mt-2 space-y-1">
              <div className="font-headline-lg text-headline-lg text-[#dde2f5] font-bold tracking-tight">
                $342,850.00 <span className="font-data-mono-sm text-xs text-[#88929b] font-normal">USDT</span>
              </div>
              <div className="flex items-center justify-between text-xs pt-1 font-data-mono-sm">
                <span className="text-[#bec8d2]">Service Wallets:</span>
                <span className="text-[#dde2f5] font-semibold">$84,200.00</span>
              </div>
              <div className="flex items-center justify-between text-xs font-data-mono-sm">
                <span className="text-[#bec8d2]">Unpaid Affiliate Yield:</span>
                <span className="text-[#4fdbc8] font-bold">$258,650.00</span>
              </div>
            </div>
            <div className="mt-3 p-2 rounded bg-[#080e1b] text-[11px] text-[#88929b] leading-tight border border-[#3e4850]/20">
              <strong className="text-[#89ceff] font-semibold">Isolated Ring-Fence:</strong> $4.18M non-custodial capital on user exchange sub-accounts is cryptographically segregated & zero-recourse.
            </div>
          </div>

          {/* Card 2 */}
          <div className="rounded-xl bg-[#161b29] p-4 shadow-sm relative overflow-hidden border border-[#3e4850]/30">
            <div className="flex items-start justify-between">
              <span className="font-label-caps text-[10px] text-[#88929b] uppercase font-bold">24H SLA Withdrawal Velocity</span>
              <span className="material-symbols-outlined text-[20px] text-[#4cd7f6]">pace</span>
            </div>
            <div className="mt-2 space-y-1">
              <div className="font-headline-lg text-headline-lg text-[#dde2f5] font-bold tracking-tight">
                14 <span className="font-body-md text-sm text-[#bec8d2] font-normal">Queued</span> <span className="font-data-mono-sm text-xs text-[#4cd7f6]">($18,420 USDT)</span>
              </div>
              <div className="flex items-center justify-between text-xs pt-1 font-data-mono-sm">
                <span className="text-[#bec8d2]">Approaching Deadline:</span>
                <span className="text-[#ffb4ab] font-bold px-1.5 py-0.5 rounded bg-[#93000a]/40">2 Critical (&lt;3h)</span>
              </div>
              <div className="flex items-center justify-between text-xs font-data-mono-sm">
                <span className="text-[#bec8d2]">Breached 24h SLA:</span>
                <span className="text-[#4fdbc8] font-bold">0 Breaches (100.0% ON-TIME)</span>
              </div>
            </div>
            <div className="mt-3 w-full bg-[#080e1b] rounded h-1.5 overflow-hidden flex">
              <div className="bg-[#ffb4ab] h-full" style={{ width: '14%' }}></div>
              <div className="bg-[#0ea5e9] h-full" style={{ width: '86%' }}></div>
            </div>
          </div>

          {/* Card 3 */}
          <div className="rounded-xl bg-[#161b29] p-4 shadow-sm relative overflow-hidden border border-[#3e4850]/30">
            <div className="flex items-start justify-between">
              <span className="font-label-caps text-[10px] text-[#88929b] uppercase font-bold">Net Platform Revenue (9% Fee)</span>
              <span className="material-symbols-outlined text-[20px] text-[#4fdbc8]">payments</span>
            </div>
            <div className="mt-2 space-y-1">
              <div className="font-headline-lg text-headline-lg text-[#4fdbc8] font-bold tracking-tight">
                $22,720.00 <span className="font-data-mono-sm text-xs text-[#88929b] font-normal">USDT</span>
              </div>
              <div className="flex items-center justify-between text-xs pt-1 font-data-mono-sm">
                <span className="text-[#bec8d2]">Base Admin Retained (1%):</span>
                <span className="text-[#dde2f5] font-semibold">$14,290.00</span>
              </div>
              <div className="flex items-center justify-between text-xs font-data-mono-sm">
                <span className="text-[#bec8d2]">Retained Missing Tiers:</span>
                <span className="text-[#dde2f5] font-semibold">$8,430.00</span>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between text-[11px] text-[#bec8d2] p-2 rounded bg-[#080e1b] border border-[#3e4850]/20">
              <span>Fee Margin: <strong className="text-[#4fdbc8] font-mono">9.00% Net</strong></span>
              <span className="text-[#89ceff] font-mono font-bold">Reconciled MTD</span>
            </div>
          </div>

          {/* Card 4 */}
          <div className="rounded-xl bg-[#161b29] p-4 shadow-sm relative overflow-hidden border border-[#3e4850]/30">
            <div className="flex items-start justify-between">
              <span className="font-label-caps text-[10px] text-[#88929b] uppercase font-bold">Bot Fleet Operations</span>
              <span className="material-symbols-outlined text-[20px] text-[#89ceff]">smart_toy</span>
            </div>
            <div className="mt-2 space-y-1">
              <div className="font-headline-lg text-headline-lg text-[#dde2f5] font-bold tracking-tight">
                1,420 <span className="font-body-md text-sm text-[#4fdbc8] font-normal">Active Executions</span>
              </div>
              <div className="flex items-center justify-between text-xs pt-1 font-data-mono-sm">
                <span className="text-[#bec8d2]">Paused / Slipped:</span>
                <span className="text-[#dde2f5] font-semibold">86 Bots</span>
              </div>
              <div className="flex items-center justify-between text-xs font-data-mono-sm">
                <span className="text-[#bec8d2]">Circuit Breakers:</span>
                <span className="text-[#4fdbc8] font-bold">0 Invocations</span>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2 text-[11px] text-[#bec8d2] p-2 rounded bg-[#080e1b] border border-[#3e4850]/20">
              <span className="w-2 h-2 rounded-full bg-[#4fdbc8]"></span>
              <span>Binance • Bybit • Hyperliquid • OKX Live</span>
            </div>
          </div>
        </div>

        {/* Zero-Ghost Broadcast Policy Banner */}
        <div className="p-4 rounded-xl bg-[#242a38] shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-[#3e4850]/40">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#0ea5e9] text-[#003751] flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[20px]">shield_with_heart</span>
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <h2 className="font-headline-md text-headline-md text-[#dde2f5] font-semibold">Strict Zero-Ghost Broadcast Policy</h2>
                <span className="font-label-caps text-label-caps px-2 py-0.5 rounded bg-[#4fdbc8]/15 text-[#4fdbc8] uppercase font-bold">
                  Mandatory Protocol
                </span>
              </div>
              <p className="font-body-sm text-body-sm text-[#bec8d2] leading-snug">
                Co-Signing or Maker approval marks state as <span className="text-[#89ceff] font-mono font-bold">TX_ENCLAVE_SIGNED</span> only. Under no circumstances is an item labeled "Completed" or "Paid" until confirmed by the consensus relayer with an immutable on-chain TXID hash ≥ 12 confirmations.
              </p>
            </div>
          </div>
          <div className="shrink-0 flex items-center gap-3">
            <span className="font-data-mono-sm text-xs text-[#88929b] font-mono">Consensus Oracle: 100% In-Sync</span>
            <button
              onClick={() => showToast('Filter rules: All active threshold criteria enforced.')}
              className="px-3 py-1.5 rounded bg-[#1a1f2d] text-[#89ceff] hover:bg-[#2f3543] transition-colors text-xs font-semibold border border-[#3e4850]/30"
            >
              Toggle Filter Rules
            </button>
          </div>
        </div>

        {/* Main Table Container */}
        <div className="rounded-xl bg-[#161b29] shadow-sm flex flex-col overflow-hidden border border-[#3e4850]/30">
          {/* Header & Filter bar */}
          <div className="p-4 bg-[#1a1f2d] flex flex-wrap items-center justify-between gap-4 border-b border-[#3e4850]/30">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setActiveFilter('all')}
                className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${
                  activeFilter === 'all'
                    ? 'bg-[#0ea5e9] text-[#003751]'
                    : 'bg-[#242a38] text-[#bec8d2] hover:text-[#dde2f5]'
                }`}
              >
                All Pending ({withdrawals.length})
              </button>
              <button
                onClick={() => setActiveFilter('sla-urgent')}
                className={`px-3 py-1.5 rounded text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeFilter === 'sla-urgent'
                    ? 'bg-[#0ea5e9] text-[#003751]'
                    : 'bg-[#242a38] text-[#bec8d2] hover:text-[#dde2f5]'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-[#ffb4ab] animate-ping"></span>
                Approaching SLA (&lt;4h) (1)
              </button>
              <button
                onClick={() => setActiveFilter('awaiting-checker')}
                className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${
                  activeFilter === 'awaiting-checker'
                    ? 'bg-[#0ea5e9] text-[#003751]'
                    : 'bg-[#242a38] text-[#bec8d2] hover:text-[#dde2f5]'
                }`}
              >
                Awaiting Second Signer (3)
              </button>
              <button
                onClick={() => setActiveFilter('flagged')}
                className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${
                  activeFilter === 'flagged'
                    ? 'bg-[#0ea5e9] text-[#003751]'
                    : 'bg-[#242a38] text-[#bec8d2] hover:text-[#dde2f5]'
                }`}
              >
                Flagged / Held (1)
              </button>
              <button
                onClick={() => setActiveFilter('completed')}
                className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${
                  activeFilter === 'completed'
                    ? 'bg-[#0ea5e9] text-[#003751]'
                    : 'bg-[#242a38] text-[#bec8d2] hover:text-[#dde2f5]'
                }`}
              >
                Completed (128)
              </button>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-[16px] text-[#88929b]">
                  search
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search UID, Hash, Address..."
                  className="pl-8 pr-3 py-1.5 rounded bg-[#242a38] text-[#dde2f5] placeholder:text-[#88929b] font-data-mono-sm text-xs focus:outline-none focus:ring-1 focus:ring-[#89ceff] w-64 border border-[#3e4850]/40"
                />
              </div>
              <button
                onClick={() => showToast('Mempool & relayer queues synchronized.')}
                className="p-1.5 rounded bg-[#242a38] text-[#dde2f5] hover:text-[#89ceff] transition-colors border border-[#3e4850]/40"
                title="Sync Mempool"
              >
                <span className="material-symbols-outlined text-[18px]">sync</span>
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#080e1b] text-[#88929b] font-label-caps text-[10px] uppercase tracking-wider select-none border-b border-[#3e4850]/20">
                  <th className="py-3 px-4">Request ID & Time</th>
                  <th className="py-3 px-4">User & Tier</th>
                  <th className="py-3 px-4">Gross USDT</th>
                  <th className="py-3 px-4">Fee & Gas</th>
                  <th className="py-3 px-4">Net Payout</th>
                  <th className="py-3 px-4">Chain / Destination</th>
                  <th className="py-3 px-4">SLA Window</th>
                  <th className="py-3 px-4">Risk Telemetry</th>
                  <th className="py-3 px-4">Maker / Checker State</th>
                  <th className="py-3 px-4 text-right">Operational Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#3e4850]/20 font-body-sm text-xs">
                {filteredWithdrawals.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-[#1a1f2d] transition-colors group"
                  >
                    {/* ID */}
                    <td className="py-3 px-4 font-data-mono-sm">
                      <div className="text-[#89ceff] font-bold">#{item.id}</div>
                      <div className="text-[#88929b] text-[10px]">{item.timestamp}</div>
                    </td>

                    {/* User & Tier */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 font-data-mono-sm">
                        <span className="text-[#dde2f5] font-semibold">{item.userUid}</span>
                        <span className="px-1.5 py-0.2 rounded bg-[#242a38] text-[#4cd7f6] text-[10px] font-bold">
                          {item.tier}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#bec8d2]">{item.kycNote}</div>
                    </td>

                    {/* Gross */}
                    <td className="py-3 px-4 font-data-mono-md text-[#dde2f5] font-bold">
                      ${item.grossUsdt.toFixed(2)}
                    </td>

                    {/* Fee & Gas */}
                    <td className="py-3 px-4 font-data-mono-sm">
                      <div className="text-[#ffb4ab] font-medium">
                        -${item.adminFeeUsdt.toFixed(2)} <span className="text-[#88929b] text-[10px]">(3% Admin)</span>
                      </div>
                      <div className="text-[#88929b] text-[10px]">Gas: {item.gasUsdt.toFixed(2)} USDT ({item.chain})</div>
                    </td>

                    {/* Net */}
                    <td className="py-3 px-4 font-data-mono-md text-[#4fdbc8] font-bold">
                      ${item.netPayoutUsdt.toFixed(2)} USDT
                    </td>

                    {/* Chain & Destination */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className={`px-1.5 py-0.2 rounded font-data-mono-sm text-[10px] font-bold ${
                          item.chain === 'TRC-20' ? 'bg-[#93000a]/30 text-[#ffb4ab]' : 'bg-[#4fdbc8]/20 text-[#4fdbc8]'
                        }`}>
                          {item.chain}
                        </span>
                        <span className="font-data-mono-sm text-[#dde2f5] font-semibold">{item.destinationAddress}</span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(item.fullAddress);
                            showToast('Address copied to clipboard');
                          }}
                          className="text-[#88929b] hover:text-[#89ceff]"
                          title="Copy Address"
                        >
                          <span className="material-symbols-outlined text-[14px]">content_copy</span>
                        </button>
                      </div>
                      <div className="text-[10px] text-[#88929b]">{item.accountNote}</div>
                    </td>

                    {/* SLA Window */}
                    <td className="py-3 px-4 font-data-mono-sm">
                      {item.isUrgentSla ? (
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#93000a] text-[#ffdad6] font-bold animate-pulse">
                          <span className="material-symbols-outlined text-[14px]">timer</span>
                          <span>{item.slaRemainingText}</span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1 text-[#4fdbc8] font-semibold">
                          <span className="material-symbols-outlined text-[14px]">schedule</span>
                          <span>{item.slaRemainingText}</span>
                        </div>
                      )}
                      <div className="text-[10px] text-[#88929b] mt-0.5">{item.slaDeadline}</div>
                    </td>

                    {/* Risk Telemetry */}
                    <td className="py-3 px-4">
                      {item.riskFlag ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#93000a]/40 text-[#ffb4ab] font-bold text-[10px]">
                          {item.riskFlag}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#4fdbc8]/10 text-[#4fdbc8] font-bold text-[10px]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#4fdbc8]"></span>
                          CLEAN SCORE ({item.riskScore}/100)
                        </span>
                      )}
                      <div className="text-[10px] text-[#88929b] mt-0.5">{item.riskNote}</div>
                    </td>

                    {/* Maker/Checker State */}
                    <td className="py-3 px-4 font-data-mono-sm">
                      <div className="text-[#dde2f5]">Maker: <span className="text-[#89ceff] font-bold">{item.makerName}</span></div>
                      {item.status === 'tx-enclave-signed' ? (
                        <div className="text-[#4fdbc8] text-[11px] font-bold flex items-center gap-1">
                          <span className="material-symbols-outlined text-[13px]">verified</span>
                          Signed & Queued
                        </div>
                      ) : item.status === 'awaiting-maker' ? (
                        <div className="text-[#88929b] text-[11px] flex items-center gap-1">
                          <span className="material-symbols-outlined text-[13px]">radio_button_unchecked</span>
                          First Approval Pending
                        </div>
                      ) : (
                        <div className="text-[#4cd7f6] text-[11px] font-semibold flex items-center gap-1">
                          <span className="material-symbols-outlined text-[13px]">hourglass_top</span>
                          Checker Co-Sign Required
                        </div>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {item.status === 'awaiting-maker' ? (
                          <button
                            onClick={() => handleMakerApprove(item.id)}
                            className="px-2.5 py-1.5 rounded bg-[#242a38] text-[#dde2f5] hover:bg-[#89ceff] hover:text-[#00344d] font-semibold transition-all shadow-sm"
                          >
                            Approve Maker
                          </button>
                        ) : item.status === 'tx-enclave-signed' ? (
                          <span className="px-2 py-1 rounded bg-[#4fdbc8]/15 text-[#4fdbc8] font-bold font-mono text-[10px]">
                            BROADCASTING
                          </span>
                        ) : item.isUrgentSla ? (
                          <button
                            onClick={() => handleOpenCosignModal(item)}
                            className="px-2.5 py-1.5 rounded bg-[#93000a] text-[#ffdad6] hover:brightness-110 font-bold transition-all shadow-sm flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-[16px]">verified</span>
                            <span>SuperAdmin Co-Sign</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleOpenCosignModal(item)}
                            className="px-2.5 py-1.5 rounded bg-[#89ceff] text-[#00344d] hover:bg-[#c9e6ff] font-bold transition-all shadow-sm flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-[16px]">draw</span>
                            <span>Review & Co-Sign</span>
                          </button>
                        )}

                        <button
                          onClick={() => handleHold(item.id)}
                          className="p-1.5 rounded bg-[#242a38] text-[#bec8d2] hover:text-[#ffb4ab] transition-colors"
                          title="Hold Payout"
                        >
                          <span className="material-symbols-outlined text-[16px]">pause</span>
                        </button>
                        <button
                          onClick={() => handleReject(item.id)}
                          className="p-1.5 rounded bg-[#242a38] text-[#bec8d2] hover:text-[#ffb4ab] transition-colors"
                          title="Reject"
                        >
                          <span className="material-symbols-outlined text-[16px]">close</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          <div className="p-4 bg-[#080e1b]/80 flex flex-wrap items-center justify-between gap-4 font-data-mono-sm text-xs border-t border-[#3e4850]/20">
            <div className="flex items-center gap-3 text-[#88929b]">
              <span>Showing {filteredWithdrawals.length} of {withdrawals.length} active queued payouts</span>
              <span>•</span>
              <span className="text-[#dde2f5]">Maker Quorum: <strong className="text-[#4fdbc8] font-mono">1/1 Verified</strong></span>
              <span>•</span>
              <span className="text-[#dde2f5]">Enclave Checker Pool: <strong className="text-[#89ceff] font-mono">3 Officers Online</strong></span>
            </div>
            <div className="flex items-center gap-1">
              <button disabled className="px-2.5 py-1 rounded bg-[#242a38] text-[#88929b] disabled:opacity-40">Previous</button>
              <span className="px-2 py-1 rounded bg-[#0ea5e9] text-[#003751] font-bold">1</span>
              <button className="px-2 py-1 rounded bg-[#242a38] text-[#dde2f5] hover:bg-[#333948]">2</button>
              <button className="px-2.5 py-1 rounded bg-[#242a38] text-[#dde2f5] hover:bg-[#333948]">Next</button>
            </div>
          </div>
        </div>

        {/* Bottom 3 Bento Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Card 1: 5-Tier Split Settlement Engine */}
          <div className="rounded-xl bg-[#161b29] p-4 shadow-sm space-y-3 flex flex-col justify-between border border-[#3e4850]/30">
            <div>
              <div className="flex items-center justify-between">
                <h3 className="font-headline-md text-headline-md text-[#dde2f5] font-semibold">
                  5-Tier Split Settlement Engine
                </h3>
                <span className="font-label-caps text-label-caps px-2 py-0.5 rounded bg-[#4fdbc8]/10 text-[#4fdbc8] uppercase font-bold">
                  Live Flow
                </span>
              </div>
              <p className="font-body-sm text-body-sm text-[#bec8d2] mt-1">
                Visual breakdown of the automatic 9% platform execution deduct and downstream network distributions.
              </p>

              <div className="mt-3 space-y-2">
                <div className="p-2.5 rounded bg-[#1a1f2d] flex items-center justify-between text-xs">
                  <span className="text-[#dde2f5] font-medium">Platform Base Operational Fee (1%)</span>
                  <span className="font-data-mono-sm text-[#4fdbc8] font-bold">$14,290.00 USDT</span>
                </div>
                <div className="p-2.5 rounded bg-[#1a1f2d] flex items-center justify-between text-xs">
                  <span className="text-[#dde2f5] font-medium">Direct Sponsor Affiliate (Tier 1 - 4%)</span>
                  <span className="font-data-mono-sm text-[#89ceff] font-bold">$57,160.00 USDT</span>
                </div>
                <div className="p-2.5 rounded bg-[#1a1f2d] flex items-center justify-between text-xs">
                  <span className="text-[#dde2f5] font-medium">Secondary Network Yield (Tier 2 - 2%)</span>
                  <span className="font-data-mono-sm text-[#89ceff] font-bold">$28,580.00 USDT</span>
                </div>
                <div className="p-2.5 rounded bg-[#1a1f2d] flex items-center justify-between text-xs">
                  <span className="text-[#dde2f5] font-medium">Territory Node Leaders (Tier 3-5 - 2%)</span>
                  <span className="font-data-mono-sm text-[#89ceff] font-bold">$20,150.00 USDT</span>
                </div>
                <div className="p-2.5 rounded bg-[#242a38] flex items-center justify-between text-xs">
                  <span className="text-[#dde2f5] font-medium">Retained Breakage (Unqualified Tiers)</span>
                  <span className="font-data-mono-sm text-[#4fdbc8] font-bold">+$8,430.00 USDT</span>
                </div>
              </div>
            </div>

            <div className="p-2.5 rounded bg-[#080e1b] text-xs font-data-mono-sm text-[#88929b] flex items-center justify-between border border-[#3e4850]/20">
              <span>Total Commission Pool Reconciled:</span>
              <span className="text-[#dde2f5] font-bold font-mono">$128,610.00 USDT</span>
            </div>
          </div>

          {/* Card 2: Hot Wallet Balances & Reserves */}
          <div className="rounded-xl bg-[#161b29] p-4 shadow-sm space-y-3 flex flex-col justify-between border border-[#3e4850]/30">
            <div>
              <div className="flex items-center justify-between">
                <h3 className="font-headline-md text-headline-md text-[#dde2f5] font-semibold">
                  Hot Wallet Balances & Reserves
                </h3>
                <span className="material-symbols-outlined text-[#4fdbc8] text-[20px]">account_balance_wallet</span>
              </div>
              <p className="font-body-sm text-body-sm text-[#bec8d2] mt-1">
                Real-time multi-chain automated dispersal float levels vs. pending liabilities.
              </p>

              <div className="mt-3 space-y-3">
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-[#dde2f5]">TRON Hot Node (TRC-20 USDT)</span>
                    <span className="font-data-mono-sm text-[#dde2f5] font-semibold">$52,410.00 / $100k target</span>
                  </div>
                  <div className="w-full bg-[#1a1f2d] h-2 rounded overflow-hidden">
                    <div className="bg-[#0ea5e9] h-full rounded" style={{ width: '52.4%' }}></div>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-[#dde2f5]">BNB Chain Hot Node (BEP-20 USDT)</span>
                    <span className="font-data-mono-sm text-[#dde2f5] font-semibold">$68,900.00 / $80k target</span>
                  </div>
                  <div className="w-full bg-[#1a1f2d] h-2 rounded overflow-hidden">
                    <div className="bg-[#4fdbc8] h-full rounded" style={{ width: '86.1%' }}></div>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-[#dde2f5]">Gas Refuel Reserve (TRX & BNB)</span>
                    <span className="font-data-mono-sm text-[#4fdbc8] font-bold">100% HEALTHY</span>
                  </div>
                  <div className="w-full bg-[#1a1f2d] h-2 rounded overflow-hidden">
                    <div className="bg-[#4fdbc8] h-full rounded" style={{ width: '98%' }}></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-2.5 rounded bg-[#242a38] flex items-center justify-between text-xs border border-[#3e4850]/20">
              <span className="text-[#bec8d2]">Cold Storage Sweep Cadence:</span>
              <span className="font-data-mono-sm text-[#89ceff] font-bold">Every 6 Hours (Next: 01h 14m)</span>
            </div>
          </div>

          {/* Card 3: Immutable HSM Audit Stream */}
          <div className="rounded-xl bg-[#161b29] p-4 shadow-sm space-y-3 flex flex-col justify-between border border-[#3e4850]/30">
            <div>
              <div className="flex items-center justify-between">
                <h3 className="font-headline-md text-headline-md text-[#dde2f5] font-semibold">
                  Immutable HSM Audit Stream
                </h3>
                <span className="material-symbols-outlined text-[#89ceff] text-[20px]">lock_clock</span>
              </div>
              <p className="font-body-sm text-body-sm text-[#bec8d2] mt-1">
                SHA-256 signed operational logs synchronized across all distributed sentinel pods.
              </p>

              <div className="mt-3 space-y-2 font-data-mono-sm text-[11px]">
                <div className="p-2 rounded bg-[#1a1f2d] flex items-start gap-2 border border-[#3e4850]/20">
                  <span className="text-[#4fdbc8] font-bold">11:18:02</span>
                  <div className="text-[#dde2f5]">
                    <strong>SUPERADMIN_LOGIN</strong>: IP 185.220.101.4 YubiKey verified for <span className="text-[#89ceff] font-semibold">sec_admin_01</span>.
                  </div>
                </div>
                <div className="p-2 rounded bg-[#1a1f2d] flex items-start gap-2 border border-[#3e4850]/20">
                  <span className="text-[#4fdbc8] font-bold">11:15:39</span>
                  <div className="text-[#dde2f5]">
                    <strong>MAKER_SIGNED</strong>: WD-2024-8841 approved by analyst_2. Forwarded to dual quorum.
                  </div>
                </div>
                <div className="p-2 rounded bg-[#1a1f2d] flex items-start gap-2 border border-[#3e4850]/20">
                  <span className="text-[#89ceff] font-bold">11:09:12</span>
                  <div className="text-[#dde2f5]">
                    <strong>ONCHAIN_CONFIRMED</strong>: TXID <span className="text-[#88929b]">0xfa89...11</span> 12/12 blocks validated. User marked PAID.
                  </div>
                </div>
                <div className="p-2 rounded bg-[#1a1f2d] flex items-start gap-2 border border-[#3e4850]/20">
                  <span className="text-[#ffb4ab] font-bold">10:55:04</span>
                  <div className="text-[#dde2f5]">
                    <strong>SLA_TRIGGER</strong>: WD-2024-8839 reached critical &lt;3h window. Auto-page dispatched.
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => showToast('Full cryptographic Merkle Audit Trail opened in secure enclave viewer.')}
              className="w-full py-2 rounded bg-[#242a38] text-[#dde2f5] hover:bg-[#2f3543] transition-colors text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm"
            >
              <span className="material-symbols-outlined text-[16px]">history</span>
              <span>View Complete Merkle Audit Trail</span>
            </button>
          </div>
        </div>
      </div>

      {/* Cryptographic Checker Co-Sign Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-xl bg-[#242a38] shadow-2xl p-6 space-y-4 relative border border-[#3e4850]/60 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#89ceff] text-[#00344d] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[22px]">draw</span>
                </div>
                <div>
                  <h3 className="font-headline-md text-headline-md text-[#dde2f5] font-semibold">
                    Cryptographic Checker Co-Sign
                  </h3>
                  <div className="font-data-mono-sm text-xs text-[#88929b]">
                    #{selectedRequest.id}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedRequest(null)}
                className="p-1 rounded bg-[#1a1f2d] text-[#88929b] hover:text-[#dde2f5]"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="p-3.5 rounded-lg bg-[#161b29] space-y-2 text-xs border border-[#3e4850]/20">
              <div className="flex justify-between">
                <span className="text-[#bec8d2]">Payout Destination:</span>
                <span className="font-data-mono-sm text-[#dde2f5] font-semibold">
                  {selectedRequest.destinationAddress} ({selectedRequest.chain})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#bec8d2]">Net Released Capital:</span>
                <span className="font-data-mono-md text-[#4fdbc8] font-bold text-sm">
                  ${selectedRequest.netPayoutUsdt.toFixed(2)} USDT
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#bec8d2]">Maker Approval Hash:</span>
                <span className="font-data-mono-sm text-[#89ceff] font-mono">
                  0x7F91..B14A ({selectedRequest.makerName})
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-label-caps text-label-caps text-[#88929b] uppercase font-semibold">
                Hardware Key / 2FA Security Token
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={hsmPin}
                  onChange={(e) => setHsmPin(e.target.value)}
                  placeholder="Enter 6-digit Sentinel Passcode or Tap Key"
                  className="w-full pl-3 pr-28 py-2.5 rounded bg-[#1a1f2d] text-[#dde2f5] placeholder:text-[#88929b] font-data-mono-md text-sm focus:outline-none focus:ring-1 focus:ring-[#89ceff] border border-[#3e4850]/40"
                />
                <button
                  type="button"
                  onClick={() => setHsmPin('984102')}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded bg-[#0ea5e9] text-[#003751] font-label-caps text-[10px] uppercase font-bold"
                >
                  AirGap NFC
                </button>
              </div>
              <p className="text-[11px] text-[#bec8d2]">
                Co-signing will execute an Enclave HSM broadcast instruction. The transaction will queue for gas dispatch.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setSelectedRequest(null)}
                className="px-4 py-2 rounded bg-[#1a1f2d] text-[#dde2f5] hover:bg-[#2f3543] text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                disabled={isBroadcasting}
                onClick={handleConfirmCosign}
                className="px-4 py-2 rounded bg-[#89ceff] hover:bg-[#c9e6ff] text-[#00344d] text-xs font-bold shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                {isBroadcasting ? (
                  <>
                    <span className="material-symbols-outlined text-[16px] animate-spin">refresh</span>
                    <span>Broadcasting to Enclave...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">lock_open</span>
                    <span>Broadcast Co-Signature</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
