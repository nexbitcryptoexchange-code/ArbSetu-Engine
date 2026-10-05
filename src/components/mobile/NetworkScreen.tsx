import React, { useState, useEffect } from 'react';
import { TIER_COMMISSIONS } from '../../data/mockData';

interface NetworkScreenProps {
  showToast: (msg: string) => void;
}

export const NetworkScreen: React.FC<NetworkScreenProps> = ({ showToast }) => {
  const [networkGas, setNetworkGas] = useState(1.00); // Default TRC-20
  const [selectedNetwork, setSelectedNetwork] = useState<'TRC20' | 'BEP20'>('TRC20');
  const [withdrawAmount, setWithdrawAmount] = useState('100.00');
  const [destinationAddress, setDestinationAddress] = useState('TJ9yXqWnQ5eTq4P2x9bN2J3mZk1A8dL4vR');
  const [showQrModal, setShowQrModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const adminFeePct = 0.03;
  const maxBalance = 256.50;
  const minThreshold = 50.00;

  // Live countdown timer for SLA
  const [countdownSeconds, setCountdownSeconds] = useState(18 * 3600 + 42 * 60 + 19);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdownSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatCountdown = (totalSec: number) => {
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return `${h}h ${m < 10 ? '0' : ''}${m}m ${s < 10 ? '0' : ''}${s}s`;
  };

  const parsedAmount = parseFloat(withdrawAmount) || 0;
  const isBelowMin = parsedAmount < minThreshold;
  const adminCut = parsedAmount * adminFeePct;
  const netPayout = Math.max(0, parsedAmount - adminCut - networkGas);

  const handleCopyCode = () => {
    navigator.clipboard.writeText('SETU-ALPHA-88').then(() => {
      showToast('Referral code SETU-ALPHA-88 copied to clipboard');
    });
  };

  const handleSelectNetwork = (net: 'TRC20' | 'BEP20') => {
    setSelectedNetwork(net);
    setNetworkGas(net === 'TRC20' ? 1.00 : 0.50);
  };

  const handleSubmitWithdrawal = (e: React.FormEvent) => {
    e.preventDefault();
    if (isBelowMin) {
      showToast('Minimum gross threshold is $50.00 USDT');
      return;
    }
    if (!destinationAddress) {
      showToast('Enter recipient payout vault address');
      return;
    }

    setIsSubmitting(true);
    showToast('Validating ledger limits and queuing 24h SLA settlement...');

    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitSuccess(true);
      showToast('Withdrawal queued! Assigned to Enclave Dual-Signoff Quorum.');
      setTimeout(() => {
        setSubmitSuccess(false);
      }, 4000);
    }, 1200);
  };

  return (
    <div className="flex flex-col w-full pb-28 pt-16 bg-[#0d1320] min-h-screen">
      <div className="flex flex-col gap-3 px-4 pb-6 max-w-xl mx-auto w-full">
        {/* Top Status Banner: Financial Identity & Direct Sponsor */}
        <div className="relative overflow-hidden rounded-xl bg-[#161b29] p-4 shadow-sm border border-[#3e4850]/30">
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#4fdbc8]"></span>
                <span className="font-label-caps text-label-caps text-[#bec8d2] uppercase tracking-wider font-semibold">
                  Affiliate Telemetry
                </span>
              </div>
              <span className="font-headline-md text-headline-md text-[#dde2f5] font-bold">
                UID: AS-882941
              </span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#242a38]">
              <span className="material-symbols-outlined text-[14px] text-[#4fdbc8]">verified_user</span>
              <span className="font-label-caps text-label-caps text-[#4fdbc8] uppercase font-bold">
                Tier 1 Sovereign
              </span>
            </div>
          </div>

          {/* Referral Link & Code Interactive Capsule */}
          <div className="flex flex-col gap-1.5 p-3 rounded-lg bg-[#080e1b] border border-[#3e4850]/20">
            <div className="flex items-center justify-between text-[#bec8d2]">
              <span className="font-label-caps text-label-caps uppercase text-[#88929b]">Universal Invite Hash</span>
              <span className="font-data-mono-sm text-data-mono-sm text-[#89ceff]">TRC20 / BEP20 Route</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="material-symbols-outlined text-[#89ceff] text-[18px]">key</span>
                <code className="font-data-mono-md text-data-mono-md text-[#dde2f5] font-bold tracking-wide">
                  SETU-ALPHA-88
                </code>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="min-h-[36px] px-3 py-1 rounded bg-[#1a1f2d] hover:bg-[#333948] active:bg-[#242a38] text-[#89ceff] flex items-center gap-1 transition-all text-xs font-bold"
                >
                  <span className="material-symbols-outlined text-[15px]">content_copy</span>
                  <span className="font-label-caps uppercase">Copy</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowQrModal(true)}
                  className="min-h-[36px] w-9 rounded bg-[#1a1f2d] hover:bg-[#333948] active:bg-[#242a38] text-[#dde2f5] flex items-center justify-center transition-all"
                  title="Show QR Code"
                >
                  <span className="material-symbols-outlined text-[18px]">qr_code_2</span>
                </button>
              </div>
            </div>
          </div>

          {/* Sponsor Lock Immutable Callout */}
          <div className="mt-3 pt-2 flex items-center justify-between border-t border-[#3e4850]/20">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="material-symbols-outlined text-[16px] text-[#88929b]">lock</span>
              <div className="flex flex-col min-w-0">
                <span className="font-body-sm text-body-sm text-[#bec8d2] truncate">
                  Sponsor: <span className="font-data-mono-sm text-[#dde2f5] font-semibold">AS-104922 (S**** M****)</span>
                </span>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-[#242a38] font-data-mono-sm text-[10px] text-[#88929b] uppercase tracking-wider shrink-0 font-bold">
              LOCKED
            </span>
          </div>
          <p className="font-body-sm text-[11px] text-[#88929b] mt-1 leading-tight">
            Sponsorship permanently established on registration to prevent circular multi-routing.
          </p>
        </div>

        {/* Active 24-Hour Processing Tracking Terminal */}
        <div className="relative overflow-hidden rounded-xl bg-[#1a1f2d] p-4 shadow-md border border-[#3e4850]/30">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="font-label-caps text-label-caps text-[#bec8d2] uppercase tracking-wider font-semibold">
                Settlement Queue
              </span>
              <span className="font-data-mono-sm text-data-mono-sm text-[#89ceff] font-bold">
                #WD-2024-8841
              </span>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#242a38]">
              <span className="w-2 h-2 rounded-full bg-[#04b4a2] animate-pulse"></span>
              <span className="font-label-caps text-label-caps text-[#4fdbc8] uppercase font-bold">
                Under Finance Review
              </span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-[#161b29] mb-3 flex flex-col gap-2 border border-[#3e4850]/20">
            <div className="flex items-center justify-between">
              <span className="font-body-sm text-body-sm text-[#bec8d2]">SLA Countdown</span>
              <div className="flex items-center gap-1 text-[#89ceff]">
                <span className="material-symbols-outlined text-[16px]">schedule</span>
                <span className="font-data-mono-md text-data-mono-md font-bold font-mono">
                  {formatCountdown(countdownSeconds)}
                </span>
              </div>
            </div>

            {/* SLA Progress Bar */}
            <div className="w-full h-1.5 bg-[#080e1b] rounded-full overflow-hidden">
              <div className="h-full bg-[#0ea5e9] rounded-full" style={{ width: '22.1%' }}></div>
            </div>

            <div className="flex items-center justify-between text-[#88929b] font-data-mono-sm text-[11px] pt-1">
              <span>Submitted: 2025-05-18 09:15 UTC</span>
              <span>Deadline: 2025-05-19 09:15 UTC</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="p-2.5 rounded bg-[#080e1b] flex flex-col border border-[#3e4850]/20">
              <span className="font-label-caps text-[10px] text-[#bec8d2] uppercase">Reserved Gross</span>
              <span className="font-data-mono-md text-data-mono-md text-[#dde2f5] font-semibold">$85.00 USDT</span>
            </div>
            <div className="p-2.5 rounded bg-[#080e1b] flex flex-col border border-[#3e4850]/20">
              <span className="font-label-caps text-[10px] text-[#bec8d2] uppercase">Settled Target Net</span>
              <span className="font-data-mono-md text-data-mono-md text-[#4fdbc8] font-bold">$81.45 USDT</span>
            </div>
          </div>

          <div className="flex items-start gap-1.5 text-[#bec8d2]">
            <span className="material-symbols-outlined text-[14px] text-[#89ceff] shrink-0 mt-0.5">info</span>
            <span className="font-body-sm text-[11px] leading-tight text-[#bec8d2]">
              Funds reserved immediately upon submission. Timer does not auto-complete; verified blockchain broadcast required.
            </span>
          </div>
        </div>

        {/* 5-Tier Reward Matrix (9% Net Profit Rule Breakdown) */}
        <div className="flex flex-col gap-3 rounded-xl bg-[#161b29] p-4 shadow-sm border border-[#3e4850]/30">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="font-headline-md text-headline-md text-[#dde2f5] font-semibold">
                5-Tier Commission Matrix
              </span>
              <span className="font-body-sm text-body-sm text-[#bec8d2]">
                Governed by the 9% Platform Arbitrage Net Share
              </span>
            </div>
            <span className="material-symbols-outlined text-[#89ceff] text-[24px]">account_tree</span>
          </div>

          {/* Top Ratio Card */}
          <div className="grid grid-cols-2 gap-2 p-3 rounded-lg bg-[#080e1b] border border-[#3e4850]/20">
            <div className="flex flex-col">
              <span className="font-label-caps text-label-caps text-[#bec8d2] uppercase">Arbitrageur Retains</span>
              <span className="font-headline-lg-mobile text-headline-lg-mobile text-[#4fdbc8] font-bold">
                91.00%
              </span>
              <span className="font-body-sm text-[11px] text-[#88929b]">Direct trade gain retainage</span>
            </div>
            <div className="flex flex-col">
              <span className="font-label-caps text-label-caps text-[#bec8d2] uppercase">Network Deduction</span>
              <span className="font-headline-lg-mobile text-headline-lg-mobile text-[#89ceff] font-bold">
                9.00%
              </span>
              <span className="font-body-sm text-[11px] text-[#88929b]">Distributed dynamically</span>
            </div>
          </div>

          {/* Tier List Rows */}
          <div className="flex flex-col gap-1.5">
            {TIER_COMMISSIONS.map((tier) => {
              if (tier.isFixedProtocol) {
                return (
                  <div
                    key="protocol-base"
                    className="flex items-center justify-between p-2.5 rounded bg-[#080e1b] opacity-80 border border-[#3e4850]/20"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-6 h-6 rounded-full bg-[#242a38] text-[#bec8d2] font-data-mono-sm text-center flex items-center justify-center font-bold text-xs shrink-0">
                        SYS
                      </span>
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-body-md text-body-md text-[#bec8d2] truncate">
                            {tier.label}
                          </span>
                          <span className="px-1.5 py-0.2 rounded bg-[#242a38] font-data-mono-sm text-[10px] text-[#88929b]">
                            {tier.ratePct}%
                          </span>
                        </div>
                        <span className="font-body-sm text-[11px] text-[#88929b]">
                          Automated Engine Liquidity Provision
                        </span>
                      </div>
                    </div>
                    <span className="font-data-mono-sm text-data-mono-sm text-[#88929b]">Fixed</span>
                  </div>
                );
              }

              return (
                <div
                  key={tier.level}
                  className="flex items-center justify-between p-2.5 rounded bg-[#1a1f2d] hover:bg-[#242a38] transition-colors border border-[#3e4850]/20"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-6 h-6 rounded-full bg-[#89ceff]/10 text-[#89ceff] font-data-mono-sm text-center flex items-center justify-center font-bold text-xs shrink-0">
                      L{tier.level}
                    </span>
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-body-md text-body-md text-[#dde2f5] font-medium truncate">
                          {tier.label}
                        </span>
                        <span className="px-1.5 py-0.2 rounded bg-[#2f3543] font-data-mono-sm text-[10px] text-[#89ceff] font-bold">
                          {tier.ratePct}%
                        </span>
                      </div>
                      <span className="font-body-sm text-body-sm text-[#bec8d2]">
                        {tier.activeCount} Active Arbitrageurs
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end shrink-0">
                    <span className="font-data-mono-md text-data-mono-md text-[#4fdbc8] font-bold">
                      +${tier.accruedUsdt.toFixed(2)}
                    </span>
                    <span className="font-label-caps text-[10px] text-[#88929b] uppercase">
                      Accrued USDT
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legal Subtext */}
          <div className="p-2.5 rounded bg-[#080e1b] text-[#bec8d2] text-[11px] leading-tight flex items-start gap-1.5 border border-[#3e4850]/20">
            <span className="material-symbols-outlined text-[15px] text-[#88929b] shrink-0 mt-0.5">verified</span>
            <span>
              Strict depth boundary: Level 6+ receives 0%. Missing sponsor allocations permanently revert to Company Admin. No dynamic tree compression.
            </span>
          </div>
        </div>

        {/* Settlement Withdrawal Terminal */}
        <div className="flex flex-col gap-3 rounded-xl bg-[#161b29] p-4 shadow-sm border border-[#3e4850]/30">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="font-headline-md text-headline-md text-[#dde2f5] font-semibold">
                Affiliate Settlement Terminal
              </span>
              <span className="font-body-sm text-body-sm text-[#bec8d2]">
                Immediate off-chain reserve to TRC20/BEP20
              </span>
            </div>
            <div className="w-9 h-9 rounded-full bg-[#4fdbc8]/10 flex items-center justify-center text-[#4fdbc8]">
              <span className="material-symbols-outlined text-[20px]">currency_exchange</span>
            </div>
          </div>

          {/* Settled Balance Box */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-[#080e1b] border border-[#3e4850]/20">
            <div className="flex flex-col">
              <span className="font-label-caps text-label-caps text-[#bec8d2] uppercase font-semibold">
                Settled Accrual Balance
              </span>
              <span className="font-headline-xl-mobile text-headline-xl-mobile text-[#dde2f5] font-extrabold">
                ${maxBalance.toFixed(2)}{' '}
                <span className="font-body-md text-[#bec8d2] font-normal">USDT</span>
              </span>
            </div>
            <button
              type="button"
              onClick={() => setWithdrawAmount(maxBalance.toFixed(2))}
              className="min-h-[36px] px-3 py-1 rounded bg-[#1a1f2d] hover:bg-[#333948] text-[#89ceff] font-label-caps text-label-caps uppercase font-bold transition-colors border border-[#3e4850]/30"
            >
              Max All
            </button>
          </div>

          {/* Spec Rules Container */}
          <div className="flex flex-col gap-1 p-3 rounded-lg bg-[#080e1b] border border-[#3e4850]/20">
            <div className="flex items-center justify-between text-body-sm text-[#bec8d2]">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#89ceff]"></span>Min. Gross Threshold:
              </span>
              <span className="font-data-mono-sm text-[#dde2f5] font-semibold">$50.00 USDT</span>
            </div>
            <div className="flex items-center justify-between text-body-sm text-[#bec8d2]">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#89ceff]"></span>Platform Admin Charge:
              </span>
              <span className="font-data-mono-sm text-[#dde2f5] font-semibold">3.00%</span>
            </div>
            <div className="flex items-center justify-between text-body-sm text-[#bec8d2]">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#89ceff]"></span>Network Fee ({selectedNetwork === 'TRC20' ? 'Tron TRC-20' : 'BNB BEP-20'}):
              </span>
              <span className="font-data-mono-sm text-[#dde2f5] font-semibold">${networkGas.toFixed(2)} USDT</span>
            </div>
            <div className="flex items-center justify-between text-body-sm text-[#bec8d2]">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#89ceff]"></span>SLA Verification Window:
              </span>
              <span className="font-data-mono-sm text-[#dde2f5] font-semibold">24 Hours Guaranteed</span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmitWithdrawal} className="flex flex-col gap-3">
            {/* Amount Field */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center">
                <label className="font-label-caps text-label-caps text-[#bec8d2] uppercase" htmlFor="withdrawAmount">
                  Gross Withdrawal Amount
                </label>
                {isBelowMin && (
                  <span className="font-body-sm text-[11px] text-[#ffb4ab]">
                    Must be at least $50.00 USDT
                  </span>
                )}
              </div>
              <div className="relative flex items-center">
                <input
                  id="withdrawAmount"
                  type="number"
                  step="0.01"
                  min="50"
                  max={maxBalance}
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="w-full h-12 bg-[#1a1f2d] rounded-lg px-3 pr-20 font-data-mono-md text-data-mono-md text-[#dde2f5] focus:outline-none focus:ring-1 focus:ring-[#89ceff] border border-[#3e4850]/30"
                />
                <div className="absolute right-3 flex items-center gap-1 pointer-events-none">
                  <span className="font-data-mono-sm text-[#89ceff] font-bold">USDT</span>
                </div>
              </div>
            </div>

            {/* Network Selector Radio Pills */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleSelectNetwork('TRC20')}
                className={`min-h-[44px] flex items-center justify-center gap-2 p-2 rounded-lg transition-all border ${
                  selectedNetwork === 'TRC20'
                    ? 'bg-[#242a38] text-[#89ceff] border-[#89ceff]/50'
                    : 'bg-[#1a1f2d] text-[#bec8d2] border-[#3e4850]/20 hover:text-[#dde2f5]'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">bolt</span>
                <div className="flex flex-col text-left">
                  <span className="font-label-caps text-label-caps uppercase font-bold">Tron TRC-20</span>
                  <span className="font-data-mono-sm text-[10px] text-[#bec8d2]">$1.00 Network Fee</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleSelectNetwork('BEP20')}
                className={`min-h-[44px] flex items-center justify-center gap-2 p-2 rounded-lg transition-all border ${
                  selectedNetwork === 'BEP20'
                    ? 'bg-[#242a38] text-[#89ceff] border-[#89ceff]/50'
                    : 'bg-[#1a1f2d] text-[#bec8d2] border-[#3e4850]/20 hover:text-[#dde2f5]'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">token</span>
                <div className="flex flex-col text-left">
                  <span className="font-label-caps text-label-caps uppercase font-bold">BNB BEP-20</span>
                  <span className="font-data-mono-sm text-[10px] text-[#88929b]">$0.50 Network Fee</span>
                </div>
              </button>
            </div>

            {/* Destination Address */}
            <div className="flex flex-col gap-1">
              <label className="font-label-caps text-label-caps text-[#bec8d2] uppercase" htmlFor="destinationAddress">
                Payout Vault Address
              </label>
              <div className="relative flex items-center">
                <input
                  id="destinationAddress"
                  type="text"
                  required
                  value={destinationAddress}
                  onChange={(e) => setDestinationAddress(e.target.value)}
                  placeholder="Paste recipient address"
                  className="w-full h-12 bg-[#1a1f2d] rounded-lg px-3 pr-10 font-data-mono-sm text-data-mono-sm text-[#dde2f5] focus:outline-none focus:ring-1 focus:ring-[#89ceff] border border-[#3e4850]/30"
                />
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.readText().then((txt) => {
                      if (txt) setDestinationAddress(txt);
                    });
                  }}
                  className="absolute right-2 p-1.5 text-[#bec8d2] hover:text-[#89ceff] transition-colors"
                  title="Paste Address"
                >
                  <span className="material-symbols-outlined text-[18px]">content_paste</span>
                </button>
              </div>
            </div>

            {/* Breakdown Calculations Ticket */}
            <div className="flex flex-col gap-1.5 p-3 rounded-lg bg-[#080e1b] border border-[#3e4850]/20">
              <div className="flex items-center justify-between font-body-sm text-body-sm text-[#bec8d2]">
                <span>Requested Gross Amount:</span>
                <span className="font-data-mono-sm text-[#dde2f5] font-semibold">
                  ${parsedAmount.toFixed(2)} USDT
                </span>
              </div>
              <div className="flex items-center justify-between font-body-sm text-body-sm text-[#bec8d2]">
                <span>Platform Admin Fee (3%):</span>
                <span className="font-data-mono-sm text-[#ffb4ab] font-semibold">
                  -${adminCut.toFixed(2)} USDT
                </span>
              </div>
              <div className="flex items-center justify-between font-body-sm text-body-sm text-[#bec8d2]">
                <span>Network Execution Gas:</span>
                <span className="font-data-mono-sm text-[#ffb4ab] font-semibold">
                  -${networkGas.toFixed(2)} USDT
                </span>
              </div>
              <div className="h-[1px] bg-[#2f3543] my-1"></div>
              <div className="flex items-center justify-between">
                <span className="font-body-md text-body-md text-[#dde2f5] font-bold">Net Payout to Wallet:</span>
                <span className="font-data-mono-lg text-data-mono-lg text-[#4fdbc8] font-extrabold">
                  ${netPayout.toFixed(2)} USDT
                </span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || isBelowMin}
              className={`w-full min-h-[48px] rounded-lg font-headline-md text-[16px] font-bold flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.99] ${
                submitSuccess
                  ? 'bg-[#04b4a2] text-[#003731]'
                  : isBelowMin
                  ? 'bg-[#242a38] text-[#88929b] cursor-not-allowed'
                  : 'bg-[#0ea5e9] hover:bg-[#89ceff] text-[#003751]'
              }`}
            >
              {isSubmitting ? (
                <>
                  <span className="material-symbols-outlined text-[20px] animate-spin">refresh</span>
                  <span>Transmitting Request...</span>
                </>
              ) : submitSuccess ? (
                <>
                  <span className="material-symbols-outlined text-[20px]">check_circle</span>
                  <span>Request Dispatched (24h SLA)</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[20px]">lock_clock</span>
                  <span>Submit 24h Withdrawal Request</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* QR Share Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl bg-[#1a1f2d] p-5 shadow-2xl border border-[#3e4850]/50 space-y-3 text-center">
            <div className="flex justify-between items-center">
              <h3 className="font-headline-md text-headline-md text-[#dde2f5]">Universal Invite Hash</h3>
              <button onClick={() => setShowQrModal(false)} className="text-[#bec8d2] hover:text-[#dde2f5]">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="p-4 bg-white rounded-lg inline-block mx-auto">
              {/* QR Code graphic representation */}
              <div className="w-48 h-48 bg-black p-2 flex flex-col justify-between rounded">
                <div className="flex justify-between">
                  <div className="w-12 h-12 border-4 border-white bg-black flex items-center justify-center">
                    <div className="w-6 h-6 bg-white"></div>
                  </div>
                  <div className="w-12 h-12 border-4 border-white bg-black flex items-center justify-center">
                    <div className="w-6 h-6 bg-white"></div>
                  </div>
                </div>
                <div className="text-[#0ea5e9] font-mono text-[10px] font-bold bg-white px-1 py-0.5 rounded">
                  ARBSETU:SETU-ALPHA-88
                </div>
                <div className="flex justify-between items-end">
                  <div className="w-12 h-12 border-4 border-white bg-black flex items-center justify-center">
                    <div className="w-6 h-6 bg-white"></div>
                  </div>
                  <div className="w-12 h-12 bg-white flex flex-wrap gap-1 p-1">
                    <div className="w-2 h-2 bg-black"></div>
                    <div className="w-2 h-2 bg-black"></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="font-data-mono-md text-data-mono-md text-[#89ceff] font-bold">
              SETU-ALPHA-88
            </div>
            <p className="font-body-sm text-xs text-[#bec8d2]">
              Share your link to bind downline arbitrageurs to your 5-tier perpetual matrix.
            </p>

            <button
              onClick={() => {
                handleCopyCode();
                setShowQrModal(false);
              }}
              className="w-full py-2.5 rounded-lg bg-[#0ea5e9] text-[#003751] font-bold text-xs uppercase"
            >
              Copy Hash & Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
