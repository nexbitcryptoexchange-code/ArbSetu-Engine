import React, { useState, useRef } from 'react';

interface WalletScreenProps {
  showToast: (msg: string) => void;
  onNavigateToNetwork?: () => void;
}

export const WalletScreen: React.FC<WalletScreenProps> = ({ showToast, onNavigateToNetwork }) => {
  const [recipientUid, setRecipientUid] = useState('AS-773190');
  const [recipientVerified, setRecipientVerified] = useState(true);
  const [recipientName, setRecipientName] = useState('R*** K*** (Verified VIP)');
  const [transferAmount, setTransferAmount] = useState('50.00');
  const [debitSource, setDebitSource] = useState<'referral' | 'service'>('referral');
  const [isTransferring, setIsTransferring] = useState(false);
  const [showTopupModal, setShowTopupModal] = useState(false);

  // Balances state
  const [serviceBalance, setServiceBalance] = useState(64.80);
  const [referralBalance, setReferralBalance] = useState(184.50);

  const transferSectionRef = useRef<HTMLDivElement>(null);

  const scrollToTransfer = () => {
    transferSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handleVerifyUid = () => {
    if (!recipientUid) {
      showToast('Enter recipient ArbSetu UID');
      return;
    }
    setRecipientVerified(true);
    if (recipientUid.toUpperCase() === 'AS-773190') {
      setRecipientName('R*** K*** (Verified VIP)');
    } else {
      setRecipientName('S*** M*** (Verified Arbitrageur)');
    }
    showToast(`UID Verified: ${recipientName}`);
  };

  const handleMaxAmount = () => {
    setTransferAmount(debitSource === 'referral' ? referralBalance.toFixed(2) : serviceBalance.toFixed(2));
  };

  const handleAuthorizeTransfer = () => {
    const amt = parseFloat(transferAmount);
    if (isNaN(amt) || amt <= 0) {
      showToast('Enter a valid transfer amount');
      return;
    }

    const available = debitSource === 'referral' ? referralBalance : serviceBalance;
    if (amt > available) {
      showToast(`Insufficient balance in ${debitSource === 'referral' ? 'Referral Wallet' : 'Service Credit'}`);
      return;
    }

    setIsTransferring(true);
    showToast('Validating 2FA token & broadcasting to off-chain ledger...');

    setTimeout(() => {
      setIsTransferring(false);
      if (debitSource === 'referral') {
        setReferralBalance(prev => prev - amt);
      } else {
        setServiceBalance(prev => prev - amt);
      }
      showToast(`P2P Transfer of $${amt.toFixed(2)} USDT to ${recipientUid} Settled! 0% Fees.`);
    }, 1200);
  };

  return (
    <div className="flex flex-col w-full pb-28 pt-16 bg-[#0d1320] min-h-screen">
      <div className="flex flex-col w-full px-4 space-y-3 max-w-xl mx-auto">
        {/* Overview Context Strip */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-[#89ceff]">account_balance</span>
            <span className="font-label-caps text-label-caps uppercase text-[#bec8d2] tracking-wider font-semibold">
              Triple-Sovereign Ledger
            </span>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#242a38]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#4fdbc8]"></span>
            <span className="font-data-mono-sm text-data-mono-sm text-[#4fdbc8] font-bold">
              Zero-Custody Active
            </span>
          </div>
        </div>

        {/* Wallet Breakdown Cards */}
        <div className="flex flex-col space-y-3">
          {/* Card 1: Non-Custodial Exchange Balances */}
          <div className="bg-[#161b29] rounded-xl p-4 relative overflow-hidden shadow-sm border border-[#3e4850]/30">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#2f3543] flex items-center justify-center text-[#dde2f5]">
                  <span className="material-symbols-outlined text-[20px]">hub</span>
                </div>
                <div>
                  <h3 className="font-headline-md text-headline-md text-[#dde2f5] font-semibold">
                    Exchange Trading Balances
                  </h3>
                  <span className="font-label-caps text-label-caps uppercase text-[#88929b]">
                    Non-Custodial Architecture
                  </span>
                </div>
              </div>
              <span className="font-data-mono-sm text-data-mono-sm text-[#89ceff] bg-[#242a38] px-2 py-0.5 rounded-full font-bold">
                3 Connected
              </span>
            </div>

            <div className="mt-3">
              <div className="flex items-baseline gap-1.5">
                <span className="font-headline-xl-mobile text-headline-xl-mobile text-[#dde2f5] tracking-tight font-extrabold">
                  $14,460.00
                </span>
                <span className="font-data-mono-sm text-data-mono-sm text-[#bec8d2]">USDT Total</span>
              </div>
            </div>

            {/* Micro exchange route indicators */}
            <div className="grid grid-cols-3 gap-1.5 mt-2 bg-[#080e1b] p-2 rounded-lg border border-[#3e4850]/20">
              <div className="flex flex-col">
                <span className="font-label-caps text-[10px] text-[#88929b] uppercase">Binance</span>
                <span className="font-data-mono-sm text-data-mono-sm text-[#dde2f5] font-semibold">$7,820.00</span>
              </div>
              <div className="flex flex-col">
                <span className="font-label-caps text-[10px] text-[#88929b] uppercase">Bybit</span>
                <span className="font-data-mono-sm text-data-mono-sm text-[#dde2f5] font-semibold">$4,140.00</span>
              </div>
              <div className="flex flex-col">
                <span className="font-label-caps text-[10px] text-[#88929b] uppercase">Hyperliquid</span>
                <span className="font-data-mono-sm text-data-mono-sm text-[#dde2f5] font-semibold">$2,500.00</span>
              </div>
            </div>

            <div className="mt-2.5 flex items-center gap-1.5 text-[#bec8d2]">
              <span className="material-symbols-outlined text-[16px] text-[#4fdbc8]">verified_user</span>
              <p className="font-body-sm text-body-sm leading-snug">
                Capital stays directly inside your exchange accounts. ArbSetu cannot withdraw these funds.
              </p>
            </div>
          </div>

          {/* Card 2: Prepaid Service Wallet (9% Deduction Pool) */}
          <div className="bg-[#161b29] rounded-xl p-4 relative overflow-hidden shadow-sm border border-[#3e4850]/30">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#04b4a2]/20 flex items-center justify-center text-[#4fdbc8]">
                  <span className="material-symbols-outlined text-[20px]">speed</span>
                </div>
                <div>
                  <h3 className="font-headline-md text-headline-md text-[#dde2f5] font-semibold">
                    Prepaid Service Wallet
                  </h3>
                  <span className="font-label-caps text-label-caps uppercase text-[#4fdbc8] font-bold">
                    9% Deduction Pool
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1 bg-[#04b4a2]/20 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-[#4fdbc8] animate-pulse"></span>
                <span className="font-data-mono-sm text-[10px] text-[#4fdbc8] font-semibold">
                  Healthy (~48 Trades)
                </span>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="bg-[#080e1b] p-2.5 rounded-lg flex flex-col border border-[#3e4850]/20">
                <span className="font-label-caps text-[10px] text-[#bec8d2] uppercase">Available Balance</span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="font-data-mono-lg text-data-mono-lg text-[#4fdbc8] font-bold">
                    ${serviceBalance.toFixed(2)}
                  </span>
                  <span className="font-data-mono-sm text-[11px] text-[#bec8d2]">USDT</span>
                </div>
              </div>
              <div className="bg-[#080e1b] p-2.5 rounded-lg flex flex-col border border-[#3e4850]/20">
                <span className="font-label-caps text-[10px] text-[#bec8d2] uppercase">Reserved In-Flight</span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="font-data-mono-lg text-data-mono-lg text-[#bec8d2] font-semibold">
                    $12.50
                  </span>
                  <span className="font-data-mono-sm text-[11px] text-[#bec8d2]">USDT</span>
                </div>
              </div>
            </div>

            <p className="font-body-sm text-body-sm text-[#bec8d2] mt-2.5 leading-snug">
              When the bot settles a profitable execution, your 9% platform & referral fee is debited here. Trading proceeds remain 100% on your exchanges.
            </p>

            <button
              onClick={() => setShowTopupModal(true)}
              className="w-full mt-3 min-h-[44px] bg-[#04b4a2] hover:bg-[#4fdbc8] text-[#003731] font-headline-md text-[14px] font-bold rounded-lg flex items-center justify-center gap-2 transition-colors active:scale-[0.99] shadow-sm"
            >
              <span className="material-symbols-outlined text-[18px]">add_circle</span>
              <span>Top-Up Service Credit (USDT-TRC20/BEP20)</span>
            </button>
          </div>

          {/* Card 3: Referral Earnings Wallet (5-Tier Rewards) */}
          <div className="bg-[#161b29] rounded-xl p-4 relative overflow-hidden shadow-sm border border-[#3e4850]/30">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#89ceff]/10 flex items-center justify-center text-[#89ceff]">
                  <span className="material-symbols-outlined text-[20px]">stars</span>
                </div>
                <div>
                  <h3 className="font-headline-md text-headline-md text-[#dde2f5] font-semibold">
                    Referral Earnings Wallet
                  </h3>
                  <span className="font-label-caps text-label-caps uppercase text-[#89ceff] font-bold">
                    5-Tier Network Yield
                  </span>
                </div>
              </div>
              <span className="font-label-caps text-[10px] text-[#89ceff] bg-[#89ceff]/15 px-2 py-0.5 rounded-full font-bold">
                Eligible (&gt;$50 Met)
              </span>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="bg-[#080e1b] p-2.5 rounded-lg flex flex-col border border-[#3e4850]/20">
                <span className="font-label-caps text-[10px] text-[#bec8d2] uppercase">Settled Earnings</span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="font-data-mono-lg text-data-mono-lg text-[#89ceff] font-bold">
                    ${referralBalance.toFixed(2)}
                  </span>
                  <span className="font-data-mono-sm text-[11px] text-[#bec8d2]">USDT</span>
                </div>
              </div>
              <div className="bg-[#080e1b] p-2.5 rounded-lg flex flex-col border border-[#3e4850]/20">
                <span className="font-label-caps text-[10px] text-[#bec8d2] uppercase">Reconciliation Pending</span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="font-data-mono-lg text-data-mono-lg text-[#88929b] font-semibold">
                    $32.00
                  </span>
                  <span className="font-data-mono-sm text-[11px] text-[#bec8d2]">USDT</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-3">
              <button
                onClick={onNavigateToNetwork}
                className="min-h-[44px] bg-[#89ceff] hover:bg-[#c9e6ff] text-[#00344d] font-headline-md text-[13px] font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors active:scale-[0.99] shadow-sm"
              >
                <span className="material-symbols-outlined text-[18px]">payments</span>
                <span>Request Payout</span>
              </button>
              <button
                onClick={scrollToTransfer}
                className="min-h-[44px] bg-[#242a38] text-[#dde2f5] font-headline-md text-[13px] font-semibold rounded-lg flex items-center justify-center gap-1.5 hover:bg-[#2f3543] transition-colors active:scale-[0.99]"
              >
                <span className="material-symbols-outlined text-[18px]">sync_alt</span>
                <span>UID Transfer</span>
              </button>
            </div>
          </div>
        </div>

        {/* Low Balance Safeguard Callout */}
        <div className="bg-[#242a38] rounded-xl p-3.5 flex items-start gap-3 shadow-sm border border-[#3e4850]/40">
          <div className="w-8 h-8 rounded-full bg-[#080e1b] shrink-0 flex items-center justify-center text-[#89ceff]">
            <span className="material-symbols-outlined text-[20px]">shield</span>
          </div>
          <div className="flex flex-col space-y-0.5">
            <span className="font-label-caps text-label-caps text-[#89ceff] uppercase font-bold">
              Reserve Threshold Safeguard
            </span>
            <p className="font-body-sm text-body-sm text-[#bec8d2] leading-relaxed">
              If Service Wallet falls below <span className="text-[#dde2f5] font-data-mono-sm font-bold">$10.00 USDT</span>, new bot scans auto-pause immediately to prevent negative balances. In-progress triangular loops always finalize safely.
            </p>
          </div>
        </div>

        {/* Internal UID Transfer Card */}
        <div ref={transferSectionRef} className="bg-[#161b29] rounded-xl p-4 space-y-3 shadow-sm border border-[#3e4850]/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#89ceff] text-[20px]">send_money</span>
              <h3 className="font-headline-md text-headline-md text-[#dde2f5] font-semibold">
                P2P Internal UID Ledger Transfer
              </h3>
            </div>
            <span className="font-data-mono-sm text-[10px] text-[#4fdbc8] bg-[#4fdbc8]/10 px-2 py-0.5 rounded-full font-bold">
              0% Slippage
            </span>
          </div>

          <div className="bg-[#080e1b] p-2.5 rounded-lg flex items-center justify-between text-[#bec8d2] border border-[#3e4850]/20">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px] text-[#89ceff]">lock_clock</span>
              <span className="font-label-caps text-[10px] tracking-wide">
                Instant Settlement • Zero Fees • Off-Chain Ledger
              </span>
            </div>
          </div>

          {/* Recipient UID Lookup Form */}
          <div className="space-y-1.5">
            <label className="font-label-caps text-label-caps uppercase text-[#bec8d2] block">
              Recipient ArbSetu UID
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={recipientUid}
                  onChange={(e) => {
                    setRecipientUid(e.target.value.toUpperCase());
                    setRecipientVerified(false);
                  }}
                  placeholder="e.g. AS-XXXXXX"
                  className="w-full h-11 bg-[#080e1b] text-[#dde2f5] font-data-mono-md text-data-mono-md px-3 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#89ceff] uppercase placeholder:text-[#88929b] border border-[#3e4850]/30"
                />
              </div>
              <button
                type="button"
                onClick={handleVerifyUid}
                className="h-11 px-4 bg-[#242a38] hover:bg-[#2f3543] text-[#dde2f5] font-headline-md text-[13px] font-semibold rounded-lg transition-colors flex items-center gap-1 active:scale-[0.98]"
              >
                <span className="material-symbols-outlined text-[18px]">search</span>
                <span>Verify</span>
              </button>
            </div>

            {/* Verified badge */}
            {recipientVerified && (
              <div className="bg-[#080e1b]/80 px-3 py-2 rounded-lg flex items-center justify-between border border-[#4fdbc8]/30">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-[#4fdbc8]">check_circle</span>
                  <span className="font-body-sm text-body-sm text-[#dde2f5]">
                    Owner: <span className="font-data-mono-sm text-[#4fdbc8] font-bold">{recipientName}</span>
                  </span>
                </div>
                <span className="font-data-mono-sm text-[11px] text-[#88929b]">Tier 2 Network</span>
              </div>
            )}
          </div>

          {/* Transfer Amount and Source */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="font-label-caps text-label-caps uppercase text-[#bec8d2]">
                Transfer Amount
              </label>
              <span className="font-data-mono-sm text-[11px] text-[#bec8d2]">
                Available:{' '}
                <span className="text-[#89ceff] font-bold">
                  ${(debitSource === 'referral' ? referralBalance : serviceBalance).toFixed(2)}
                </span>
              </span>
            </div>
            <div className="relative flex items-center">
              <input
                type="number"
                step="0.01"
                value={transferAmount}
                onChange={(e) => setTransferAmount(e.target.value)}
                className="w-full h-11 bg-[#080e1b] text-[#dde2f5] font-data-mono-md text-data-mono-md pl-3 pr-20 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#89ceff] placeholder:text-[#88929b] border border-[#3e4850]/30"
              />
              <div className="absolute right-2 flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleMaxAmount}
                  className="px-2 py-1 bg-[#242a38] hover:bg-[#2f3543] text-[#89ceff] font-data-mono-sm text-[11px] font-bold rounded transition-colors"
                >
                  MAX
                </button>
                <span className="font-data-mono-sm text-data-mono-sm text-[#bec8d2] pr-1">USDT</span>
              </div>
            </div>
          </div>

          {/* From Wallet Picker */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setDebitSource('referral')}
              className={`p-2.5 rounded-lg text-left flex flex-col border transition-all ${
                debitSource === 'referral'
                  ? 'bg-[#2f3543] border-[#89ceff]/60'
                  : 'bg-[#080e1b] border-[#3e4850]/20 opacity-60'
              }`}
            >
              <span className="font-label-caps text-[10px] text-[#89ceff] uppercase font-bold">Debit Source</span>
              <span className="font-data-mono-sm text-data-mono-sm text-[#dde2f5] font-semibold">Referral Wallet</span>
            </button>
            <button
              type="button"
              onClick={() => setDebitSource('service')}
              className={`p-2.5 rounded-lg text-left flex flex-col border transition-all ${
                debitSource === 'service'
                  ? 'bg-[#2f3543] border-[#4fdbc8]/60'
                  : 'bg-[#080e1b] border-[#3e4850]/20 opacity-60'
              }`}
            >
              <span className="font-label-caps text-[10px] text-[#4fdbc8] uppercase font-bold">Or Service Credit</span>
              <span className="font-data-mono-sm text-data-mono-sm text-[#dde2f5] font-semibold">Pool Balance</span>
            </button>
          </div>

          <button
            type="button"
            disabled={isTransferring}
            onClick={handleAuthorizeTransfer}
            className="w-full min-h-[44px] bg-[#89ceff] hover:bg-[#c9e6ff] text-[#00344d] font-headline-md text-headline-md font-bold rounded-lg flex items-center justify-center gap-2 transition-colors active:scale-[0.99] shadow-md disabled:opacity-50"
          >
            {isTransferring ? (
              <>
                <span className="material-symbols-outlined text-[18px] animate-spin">refresh</span>
                <span>Transmitting Off-Chain Ledger...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[18px]">verified</span>
                <span>Authorize Transfer with 2FA</span>
              </>
            )}
          </button>
        </div>

        {/* Real-time Ledger Double-Entry Feed */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-[#88929b]">receipt_long</span>
              <h3 className="font-headline-md text-headline-md text-[#dde2f5] font-semibold">
                Audited Ledger Feed
              </h3>
            </div>
            <span className="font-label-caps text-label-caps uppercase text-[#88929b]">Live Broadcast</span>
          </div>

          <div className="bg-[#161b29] rounded-xl overflow-hidden shadow-sm border border-[#3e4850]/30 divide-y divide-[#3e4850]/20">
            {/* Ledger Entry 1 */}
            <div className="p-3.5 hover:bg-[#1a1f2d] transition-colors flex items-start justify-between">
              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded bg-[#04b4a2]/20 flex items-center justify-center text-[#4fdbc8] mt-0.5">
                  <span className="material-symbols-outlined text-[16px]">trending_down</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-headline-md text-[13px] text-[#dde2f5] font-semibold">
                    Trade Profit Fee Deduction
                  </span>
                  <span className="font-data-mono-sm text-[11px] text-[#88929b]">
                    ARB-90214 • Service Wallet Pool
                  </span>
                  <span className="font-body-sm text-[10px] text-[#bec8d2] mt-0.5">
                    Binance → Hyperliquid Spread Gain $14.22
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <span className="font-data-mono-md text-data-mono-md text-[#4fdbc8] font-bold">
                  -1.2800 USDT
                </span>
                <span className="font-data-mono-sm text-[10px] text-[#88929b]">14:02:18 UTC</span>
              </div>
            </div>

            {/* Ledger Entry 2 */}
            <div className="p-3.5 hover:bg-[#1a1f2d] transition-colors flex items-start justify-between">
              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded bg-[#89ceff]/10 flex items-center justify-center text-[#89ceff] mt-0.5">
                  <span className="material-symbols-outlined text-[16px]">group_add</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-headline-md text-[13px] text-[#dde2f5] font-semibold">
                    Level 1 Referral Commission
                  </span>
                  <span className="font-data-mono-sm text-[11px] text-[#88929b]">
                    From AS-492104 • Tier 1 Network
                  </span>
                  <span className="font-body-sm text-[10px] text-[#bec8d2] mt-0.5">
                    Direct 30% Share of 9% Pool Margin
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <span className="font-data-mono-md text-data-mono-md text-[#89ceff] font-bold">
                  +4.1200 USDT
                </span>
                <span className="font-data-mono-sm text-[10px] text-[#88929b]">13:48:02 UTC</span>
              </div>
            </div>

            {/* Ledger Entry 3 */}
            <div className="p-3.5 hover:bg-[#1a1f2d] transition-colors flex items-start justify-between">
              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded bg-[#4fdbc8]/15 flex items-center justify-center text-[#4fdbc8] mt-0.5">
                  <span className="material-symbols-outlined text-[16px]">download_done</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-headline-md text-[13px] text-[#dde2f5] font-semibold">
                    Service Wallet Top-up
                  </span>
                  <span className="font-data-mono-sm text-[11px] text-[#88929b]">
                    TxID: 0x9f1a...b32 • TRC-20
                  </span>
                  <span className="font-body-sm text-[10px] text-[#4fdbc8] mt-0.5 font-medium">
                    27/27 Block Confirmations
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <span className="font-data-mono-md text-data-mono-md text-[#4fdbc8] font-bold">
                  +100.0000 USDT
                </span>
                <span className="font-data-mono-sm text-[10px] text-[#88929b]">10:12:44 UTC</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Topup Modal Dialog */}
      {showTopupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl bg-[#242a38] p-4 shadow-2xl border border-[#3e4850]/50 space-y-3">
            <div className="flex items-center justify-between pb-1 border-b border-[#3e4850]/30">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#4fdbc8]">qr_code_2</span>
                <h4 className="font-headline-md text-headline-md text-[#dde2f5] font-semibold">
                  Deposit Service Credit
                </h4>
              </div>
              <button
                onClick={() => setShowTopupModal(false)}
                className="text-[#bec8d2] hover:text-[#dde2f5]"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="bg-[#080e1b] p-3 rounded-lg text-center space-y-2 border border-[#3e4850]/20">
              <span className="font-label-caps text-label-caps text-[#88929b] uppercase block">
                Dedicated TRC20 Deposit Gateway
              </span>
              <div className="font-data-mono-sm text-[11px] text-[#4fdbc8] break-all bg-[#0d1320] p-2.5 rounded select-all font-mono">
                TYhK98mZv3pQ2R4s8Lw119XaBcE772NkqU
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText('TYhK98mZv3pQ2R4s8Lw119XaBcE772NkqU');
                  showToast('Deposit address copied to clipboard');
                }}
                className="w-full py-2 bg-[#1a1f2d] hover:bg-[#333948] text-[#89ceff] font-label-caps uppercase rounded text-xs font-semibold flex items-center justify-center gap-1"
              >
                <span className="material-symbols-outlined text-[16px]">content_copy</span>
                <span>Copy Address</span>
              </button>
              <span className="font-body-sm text-[11px] text-[#bec8d2] block leading-tight pt-1">
                Minimum: 10 USDT • Automated Ledger Credit within 1 minute
              </span>
            </div>

            <button
              onClick={() => {
                setServiceBalance(prev => prev + 50);
                setShowTopupModal(false);
                showToast('Simulated deposit of +$50.00 USDT added to Service Wallet!');
              }}
              className="w-full py-2 rounded-lg bg-[#0ea5e9] text-[#003751] font-bold text-xs uppercase tracking-wide"
            >
              Simulate Test Top-Up (+50 USDT)
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
