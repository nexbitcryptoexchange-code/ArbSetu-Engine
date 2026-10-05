import React, { useState } from 'react';
import { STATIC_IPS, INITIAL_EXCHANGES } from '../../data/mockData';
import { ExchangeConnector } from '../../types';

interface ConnectApiKeyScreenProps {
  onBack?: () => void;
  showToast: (msg: string) => void;
}

export const ConnectApiKeyScreen: React.FC<ConnectApiKeyScreenProps> = ({ showToast }) => {
  const [exchanges, setExchanges] = useState<ExchangeConnector[]>(INITIAL_EXCHANGES);
  const [targetExchange, setTargetExchange] = useState('binance');
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const [passphrase, setPassphrase] = useState('');
  const [withdrawalConfirmed, setWithdrawalConfirmed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationStage, setValidationStage] = useState<string | null>(null);

  const copyIps = () => {
    navigator.clipboard.writeText(STATIC_IPS).then(() => {
      showToast('Static IPs copied to clipboard');
    }).catch(() => {
      showToast('IPs selected');
    });
  };

  const simulateSync = (name: string) => {
    showToast(`Testing real-time WebSocket for ${name}... 18ms! Healthy.`);
  };

  const handleTogglePause = (id: string) => {
    setExchanges(prev => prev.map(ex => {
      if (ex.id === id) {
        const newStatus = ex.status === 'paused' ? 'healthy' : 'paused';
        showToast(`${ex.name} status updated: ${newStatus.toUpperCase()}`);
        return { ...ex, status: newStatus };
      }
      return ex;
    }));
  };

  const handleRevoke = (id: string, name: string) => {
    if (confirm(`Revoke and purge API credentials for ${name}?`)) {
      setExchanges(prev => prev.filter(ex => ex.id !== id));
      showToast(`Key revoked for ${name}. Liquidity unmounted.`);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!withdrawalConfirmed) {
      showToast('Please confirm that withdrawal permissions are turned OFF.');
      return;
    }

    setIsSubmitting(true);
    setValidationStage('1/3: Checking IP Whitelist...');

    setTimeout(() => {
      setValidationStage('2/3: Enforcing Zero-Withdrawal Lock...');
      setTimeout(() => {
        setValidationStage('3/3: Sub-50ms WebSocket Handshake...');
        setTimeout(() => {
          setIsSubmitting(false);
          setValidationStage(null);

          const exchangeLabels: Record<string, string> = {
            binance: 'Binance Pro',
            okx: 'OKX Broker',
            bybit: 'Bybit Spot/Perp',
            kucoin: 'KuCoin Institutional',
            gate: 'Gate.io Global',
            hyperliquid: 'Hyperliquid Arbitrage Desk'
          };

          const newConnector: ExchangeConnector = {
            id: targetExchange + '-' + Date.now(),
            name: exchangeLabels[targetExchange] || 'Institutional Gateway',
            shortCode: targetExchange.slice(0, 3).toUpperCase(),
            avatarColor: '#89ceff',
            status: 'healthy',
            ping: Math.floor(16 + Math.random() * 12),
            lastPingText: 'Just now',
            readData: true,
            spotTrade: true,
            noWithdraw: true,
            allocatedUsdt: 5000.00,
            spotAssetAmount: 0.0825,
            spotAssetSymbol: 'BTC',
            errorRate: '0.00%',
            rateLimitText: '12% (Normal)'
          };

          setExchanges(prev => [newConnector, ...prev]);
          setApiKey('');
          setApiSecret('');
          setPassphrase('');
          setWithdrawalConfirmed(false);
          showToast('Connector online! Withdrawal lock verified & pipeline active.');
        }, 800);
      }, 700);
    }, 700);
  };

  return (
    <div className="flex flex-col w-full pb-28 pt-20 px-4 max-w-xl mx-auto">
      <div className="flex flex-col gap-4">
        {/* Zero-Custody Security Guardrail Banner */}
        <section className="flex flex-col gap-3 bg-[#1a1f2d] rounded-xl p-4 shadow-md relative overflow-hidden border border-[#3e4850]/30">
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#89ceff]/10 rounded-full blur-2xl pointer-events-none"></div>
          
          <div className="flex items-start gap-3 relative z-10">
            <div className="w-9 h-9 rounded-lg bg-[#242a38] flex items-center justify-center shrink-0 text-[#89ceff]">
              <span className="material-symbols-outlined text-[20px]">shield_lock</span>
            </div>
            <div className="flex flex-col flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-headline-md text-headline-md text-[#dde2f5] font-semibold">
                  Zero-Custody Protocol
                </span>
                <span className="px-1.5 py-0.5 rounded bg-[#4fdbc8]/15 text-[#4fdbc8] font-label-caps text-label-caps tracking-wider uppercase font-bold">
                  Enforced
                </span>
              </div>
              <p className="font-body-sm text-body-sm text-[#bec8d2] mt-1 leading-snug">
                ArbSetu <span className="text-[#dde2f5] font-semibold">never requests withdrawal access</span>, exchange account passwords, or 2FA seeds. Only read-only and spot routing execution keys are accepted.
              </p>
            </div>
          </div>

          {/* IP Whitelist Block */}
          <div className="mt-1 bg-[#080e1b] rounded-lg p-3 flex flex-col gap-1.5 border border-[#3e4850]/20">
            <div className="flex items-center justify-between text-[#bec8d2]">
              <span className="font-label-caps text-label-caps uppercase text-[#88929b]">Dedicated Execution Server IPs</span>
              <span className="font-data-mono-sm text-data-mono-sm text-[#4fdbc8] font-semibold">3 Nodes Active</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <code className="font-data-mono-sm text-data-mono-sm text-[#89ceff] tracking-tight truncate select-all">
                {STATIC_IPS}
              </code>
              <button
                type="button"
                onClick={copyIps}
                className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded bg-[#1a1f2d] hover:bg-[#333948] text-[#dde2f5] active:scale-95 transition-all text-xs font-semibold"
              >
                <span className="material-symbols-outlined text-[15px] text-[#89ceff]">content_copy</span>
                <span>Copy</span>
              </button>
            </div>
          </div>
        </section>

        {/* Connectors Overview Stat Bar */}
        <section className="grid grid-cols-3 gap-2 bg-[#161b29] p-1.5 rounded-xl border border-[#3e4850]/20">
          <div className="flex flex-col items-center justify-center py-2 px-1 rounded-lg bg-[#1a1f2d]">
            <span className="font-data-mono-lg text-data-mono-lg text-[#4fdbc8] font-bold">2 / 4</span>
            <span className="font-label-caps text-label-caps text-[#88929b] uppercase mt-0.5">Live Pipes</span>
          </div>
          <div className="flex flex-col items-center justify-center py-2 px-1 rounded-lg bg-[#1a1f2d]">
            <span className="font-data-mono-lg text-data-mono-lg text-[#89ceff] font-bold">18ms</span>
            <span className="font-label-caps text-label-caps text-[#88929b] uppercase mt-0.5">Best Ping</span>
          </div>
          <div className="flex flex-col items-center justify-center py-2 px-1 rounded-lg bg-[#1a1f2d]">
            <span className="font-data-mono-lg text-data-mono-lg text-[#dde2f5] font-bold">$14,460</span>
            <span className="font-label-caps text-label-caps text-[#88929b] uppercase mt-0.5">Tracked Liq</span>
          </div>
        </section>

        {/* Exchange Connectors Header */}
        <div className="flex items-center justify-between mt-1">
          <div className="flex items-center gap-2">
            <span className="font-headline-md text-headline-md text-[#dde2f5] font-semibold">Integrated Gateways</span>
            <span className="w-2 h-2 rounded-full bg-[#4fdbc8] animate-pulse"></span>
          </div>
          <span className="font-data-mono-sm text-data-mono-sm text-[#bec8d2]">Cluster: ap-south-1</span>
        </div>

        {/* Connectors List */}
        <div className="flex flex-col gap-3">
          {exchanges.map((exchange) => {
            const isDegraded = exchange.status === 'degraded';
            const isMaint = exchange.status === 'maintenance';
            const isComingSoon = exchange.status === 'coming-soon';
            const isPaused = exchange.status === 'paused';

            if (isMaint) {
              return (
                <article key={exchange.id} className="flex flex-col bg-[#161b29] rounded-xl p-4 shadow-sm opacity-85 border border-[#3e4850]/20">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#242a38] flex items-center justify-center text-[#88929b] font-headline-md font-bold">
                        {exchange.shortCode.charAt(0)}
                      </div>
                      <div className="flex flex-col">
                        <h3 className="font-headline-md text-headline-md text-[#dde2f5] font-semibold">{exchange.name}</h3>
                        <span className="font-data-mono-sm text-data-mono-sm text-[#bec8d2]">{exchange.lastPingText}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#2f3543] text-[#bec8d2]">
                      <span className="w-2 h-2 rounded-full bg-[#88929b]"></span>
                      <span className="font-label-caps text-label-caps uppercase font-semibold">Maintenance</span>
                    </div>
                  </div>
                  <p className="font-body-sm text-body-sm text-[#bec8d2] mt-3 leading-snug">
                    {exchange.maintenanceNotice}
                  </p>
                </article>
              );
            }

            if (isComingSoon) {
              return (
                <article key={exchange.id} className="flex flex-col bg-[#080e1b] rounded-xl p-4 opacity-75 border border-[#3e4850]/20">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#1a1f2d] flex items-center justify-center text-[#88929b] font-headline-md font-bold">
                        {exchange.shortCode.charAt(0)}
                      </div>
                      <div className="flex flex-col">
                        <h3 className="font-headline-md text-headline-md text-[#dde2f5] font-semibold">{exchange.name}</h3>
                        <span className="font-data-mono-sm text-data-mono-sm text-[#bec8d2]">{exchange.lastPingText}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#242a38] text-[#88929b]">
                      <span className="font-label-caps text-label-caps uppercase font-semibold">Coming Soon</span>
                    </div>
                  </div>
                  <p className="font-body-sm text-body-sm text-[#88929b] mt-3 leading-snug">
                    {exchange.maintenanceNotice}
                  </p>
                </article>
              );
            }

            return (
              <article
                key={exchange.id}
                className={`flex flex-col bg-[#1a1f2d] rounded-xl p-4 shadow-md relative overflow-hidden transition-all border ${
                  isDegraded ? 'border-amber-500/40' : 'border-[#3e4850]/30'
                }`}
              >
                {isDegraded && (
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-amber-400/80 to-transparent"></div>
                )}

                <div className="flex items-start justify-between gap-2 pb-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl bg-[#2f3543] flex items-center justify-center font-headline-md font-bold ${
                      exchange.id.includes('binance') ? 'text-[#89ceff]' : exchange.id.includes('okx') ? 'text-[#4fdbc8]' : 'text-[#dde2f5]'
                    }`}>
                      {exchange.shortCode.charAt(0)}
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-headline-md text-headline-md text-[#dde2f5] font-semibold">{exchange.name}</h3>
                        <span className="material-symbols-outlined text-[16px] text-[#4fdbc8]">verified</span>
                      </div>
                      <span className="font-data-mono-sm text-data-mono-sm text-[#bec8d2]">{exchange.lastPingText}</span>
                    </div>
                  </div>

                  {/* Status Pill */}
                  {isDegraded ? (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400">
                      <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                      <span className="font-label-caps text-label-caps uppercase font-semibold">
                        {exchange.ping}ms • Degraded
                      </span>
                    </div>
                  ) : isPaused ? (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#242a38] text-[#88929b]">
                      <span className="w-2 h-2 rounded-full bg-[#88929b]"></span>
                      <span className="font-label-caps text-label-caps uppercase font-semibold">PAUSED</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#4fdbc8]/10 text-[#4fdbc8]">
                      <span className="w-2 h-2 rounded-full bg-[#4fdbc8] animate-pulse"></span>
                      <span className="font-label-caps text-label-caps uppercase font-semibold">
                        {exchange.ping}ms • Healthy
                      </span>
                    </div>
                  )}
                </div>

                {/* Warning note if degraded */}
                {exchange.note && (
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-[#080e1b] my-1 border border-amber-500/20">
                    <span className="material-symbols-outlined text-[18px] text-amber-400 shrink-0">speed</span>
                    <p className="font-body-sm text-body-sm text-amber-200/90 leading-tight">
                      {exchange.note}
                    </p>
                  </div>
                )}

                {/* Security Guardrail Checkers */}
                <div className="grid grid-cols-3 gap-1.5 my-1.5 p-1.5 rounded-lg bg-[#080e1b]">
                  <div className="flex items-center gap-1 text-[#dde2f5]">
                    <span className="material-symbols-outlined text-[14px] text-[#4fdbc8]">check_circle</span>
                    <span className="font-label-caps text-label-caps text-[#bec8d2] truncate">Read Data</span>
                  </div>
                  <div className="flex items-center gap-1 text-[#dde2f5]">
                    <span className="material-symbols-outlined text-[14px] text-[#4fdbc8]">check_circle</span>
                    <span className="font-label-caps text-label-caps text-[#bec8d2] truncate">Spot Trade</span>
                  </div>
                  <div className="flex items-center gap-1 text-[#ffb4ab]">
                    <span className="material-symbols-outlined text-[14px]">lock</span>
                    <span className="font-label-caps text-label-caps truncate font-semibold">No Withdraw</span>
                  </div>
                </div>

                {/* Balances Grid */}
                <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-[#242a38] my-1">
                  <div className="flex flex-col">
                    <span className="font-label-caps text-label-caps text-[#88929b] uppercase">Allocated USDT</span>
                    <span className="font-data-mono-md text-data-mono-md text-[#dde2f5] font-semibold">
                      {exchange.allocatedUsdt.toLocaleString('en-US', { minimumFractionDigits: 2 })} <span className="text-[#bec8d2] text-xs font-normal">USDT</span>
                    </span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="font-label-caps text-label-caps text-[#88929b] uppercase">Spot Asset</span>
                    <span className="font-data-mono-md text-data-mono-md text-[#dde2f5] font-semibold">
                      {exchange.spotAssetAmount.toFixed(8)} <span className="text-[#bec8d2] text-xs font-normal">{exchange.spotAssetSymbol}</span>
                    </span>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="flex items-center gap-2 mt-2 pt-1">
                  {isDegraded ? (
                    <>
                      <button
                        onClick={() => showToast('Renewing Bybit session token... Complete!')}
                        className="flex-1 min-h-[40px] px-3 py-2 rounded-lg bg-[#0ea5e9] hover:bg-[#89ceff] text-[#00344d] font-semibold flex items-center justify-center gap-1.5 active:scale-95 transition-all text-sm"
                      >
                        <span className="material-symbols-outlined text-[16px]">refresh</span>
                        <span>Renew Credentials</span>
                      </button>
                      <button
                        onClick={() => handleTogglePause(exchange.id)}
                        className="min-h-[40px] px-3 py-2 rounded-lg bg-[#242a38] hover:bg-[#333948] text-[#dde2f5] flex items-center justify-center gap-1.5 active:scale-95 transition-all text-sm"
                      >
                        <span className="material-symbols-outlined text-[16px]">pause</span>
                        <span>Halt Feed</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => simulateSync(exchange.name)}
                        className="flex-1 min-h-[40px] px-3 py-2 rounded-lg bg-[#242a38] hover:bg-[#333948] text-[#dde2f5] flex items-center justify-center gap-1.5 active:scale-95 transition-all text-sm font-medium"
                      >
                        <span className="material-symbols-outlined text-[16px] text-[#89ceff]">sync</span>
                        <span>Test Sync</span>
                      </button>
                      <button
                        onClick={() => handleTogglePause(exchange.id)}
                        className="min-h-[40px] px-3 py-2 rounded-lg bg-[#242a38] hover:bg-[#333948] text-[#dde2f5] flex items-center justify-center gap-1.5 active:scale-95 transition-all text-sm font-medium"
                      >
                        <span className="material-symbols-outlined text-[16px]">
                          {isPaused ? 'play_arrow' : 'pause_circle'}
                        </span>
                        <span>{isPaused ? 'Resume' : 'Pause'}</span>
                      </button>
                      <button
                        onClick={() => handleRevoke(exchange.id, exchange.name)}
                        className="w-10 min-h-[40px] rounded-lg bg-[#93000a]/20 text-[#ffb4ab] hover:bg-[#93000a]/40 flex items-center justify-center active:scale-95 transition-all"
                        title="Revoke Key"
                      >
                        <span className="material-symbols-outlined text-[18px]">key_off</span>
                      </button>
                    </>
                  )}
                </div>
              </article>
            );
          })}
        </div>

        {/* Onboarding / New Connector Integration Form */}
        <section className="flex flex-col gap-3 bg-[#1a1f2d] rounded-xl p-4 shadow-xl border border-[#3e4850]/40 my-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#89ceff]/10 flex items-center justify-center text-[#89ceff]">
                <span className="material-symbols-outlined text-[18px]">add_link</span>
              </div>
              <h2 className="font-headline-md text-headline-md text-[#dde2f5] font-semibold">Link Institutional Key</h2>
            </div>
            <span className="font-label-caps text-label-caps uppercase text-[#4fdbc8] bg-[#4fdbc8]/10 px-2 py-0.5 rounded font-bold">
              AES-256 GCM
            </span>
          </div>

          <form onSubmit={handleFormSubmit} className="flex flex-col gap-3">
            {/* Target Exchange */}
            <div className="flex flex-col gap-1">
              <label className="font-label-caps text-label-caps uppercase text-[#bec8d2]" htmlFor="exchange-select">
                Target Exchange
              </label>
              <div className="relative flex items-center">
                <select
                  id="exchange-select"
                  value={targetExchange}
                  onChange={(e) => setTargetExchange(e.target.value)}
                  className="w-full h-11 bg-[#080e1b] text-[#dde2f5] font-body-md text-body-md rounded-lg px-3 appearance-none focus:outline-none focus:ring-1 focus:ring-[#89ceff] border border-[#3e4850]/40"
                >
                  <option value="binance">Binance Pro</option>
                  <option value="okx">OKX Broker</option>
                  <option value="bybit">Bybit Derivatives/Spot</option>
                  <option value="kucoin">KuCoin Institutional</option>
                  <option value="gate">Gate.io Global</option>
                  <option value="hyperliquid">Hyperliquid Arbitrage Desk</option>
                </select>
                <span className="material-symbols-outlined absolute right-3 pointer-events-none text-[#bec8d2] text-[20px]">
                  expand_more
                </span>
              </div>
            </div>

            {/* API Key */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <label className="font-label-caps text-label-caps uppercase text-[#bec8d2]" htmlFor="api-key">
                  API Key / Access ID
                </label>
                <span className="font-data-mono-sm text-data-mono-sm text-[#88929b]">Public Identifier</span>
              </div>
              <input
                id="api-key"
                type="text"
                required
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="e.g. vm4K9L...481Q"
                className="w-full h-11 bg-[#080e1b] text-[#dde2f5] font-data-mono-md text-data-mono-md rounded-lg px-3 placeholder:text-[#3e4850] focus:outline-none focus:ring-1 focus:ring-[#89ceff] border border-[#3e4850]/40"
              />
            </div>

            {/* API Secret */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <label className="font-label-caps text-label-caps uppercase text-[#bec8d2]" htmlFor="api-secret">
                  API Secret
                </label>
                <span className="font-label-caps text-label-caps text-[#88929b]">Encrypted in HSM</span>
              </div>
              <div className="relative flex items-center">
                <input
                  id="api-secret"
                  type={showSecret ? 'text' : 'password'}
                  required
                  value={apiSecret}
                  onChange={(e) => setApiSecret(e.target.value)}
                  placeholder="Paste exchange signature secret"
                  className="w-full h-11 bg-[#080e1b] text-[#dde2f5] font-data-mono-md text-data-mono-md rounded-lg px-3 pr-10 placeholder:text-[#3e4850] focus:outline-none focus:ring-1 focus:ring-[#89ceff] border border-[#3e4850]/40"
                />
                <button
                  type="button"
                  onClick={() => setShowSecret(!showSecret)}
                  className="absolute right-2.5 text-[#bec8d2] hover:text-[#dde2f5] p-1"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {showSecret ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            {/* Passphrase (OKX / KuCoin) */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <label className="font-label-caps text-label-caps uppercase text-[#bec8d2]" htmlFor="api-passphrase">
                  Passphrase (OKX / KuCoin)
                </label>
                <span className="font-label-caps text-label-caps text-[#88929b]">Optional</span>
              </div>
              <input
                id="api-passphrase"
                type="password"
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                placeholder="Custom API passphrase if set"
                className="w-full h-11 bg-[#080e1b] text-[#dde2f5] font-data-mono-md text-data-mono-md rounded-lg px-3 placeholder:text-[#3e4850] focus:outline-none focus:ring-1 focus:ring-[#89ceff] border border-[#3e4850]/40"
              />
            </div>

            {/* Withdrawal Lock Checkbox */}
            <div className="flex items-start gap-3 p-3 rounded-lg bg-[#242a38] border border-[#3e4850]/30">
              <input
                id="withdraw-confirm"
                type="checkbox"
                required
                checked={withdrawalConfirmed}
                onChange={(e) => setWithdrawalConfirmed(e.target.checked)}
                className="mt-1 w-4 h-4 rounded text-[#0ea5e9] bg-[#080e1b] border-0 focus:ring-0 cursor-pointer"
              />
              <label htmlFor="withdraw-confirm" className="font-body-sm text-body-sm text-[#bec8d2] cursor-pointer select-none leading-relaxed">
                I confirm that <strong className="text-[#dde2f5]">Withdrawal Permissions are turned OFF</strong> on my exchange console. ArbSetu will reject keys with funds-transfer capabilities.
              </label>
            </div>

            {/* Verification Pipeline Checklist */}
            <div className="flex flex-col gap-1.5 bg-[#080e1b] p-3 rounded-lg border border-[#3e4850]/20">
              <span className="font-label-caps text-label-caps uppercase text-[#88929b]">Verification Pipeline:</span>
              <div className="flex items-center gap-2 text-[#bec8d2]">
                <span className="material-symbols-outlined text-[16px] text-[#4fdbc8]">radio_button_checked</span>
                <span className="font-body-sm text-body-sm">Static Server IP Whitelist verification</span>
              </div>
              <div className="flex items-center gap-2 text-[#bec8d2]">
                <span className="material-symbols-outlined text-[16px] text-[#4fdbc8]">radio_button_checked</span>
                <span className="font-body-sm text-body-sm">Zero-Withdrawal restriction check</span>
              </div>
              <div className="flex items-center gap-2 text-[#bec8d2]">
                <span className="material-symbols-outlined text-[16px] text-[#4fdbc8]">radio_button_checked</span>
                <span className="font-body-sm text-body-sm">Sub-50ms latency WebSocket handshake</span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full min-h-[48px] rounded-lg bg-[#0ea5e9] text-[#003751] font-headline-md text-headline-md font-bold flex items-center justify-center gap-2 shadow-lg active:scale-98 transition-all hover:bg-[#89ceff] ${
                isSubmitting ? 'opacity-80 cursor-wait' : ''
              }`}
            >
              {isSubmitting ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
                  <span>{validationStage || 'Validating...'}</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[20px]">bolt</span>
                  <span>Authenticate & Verify Pipeline</span>
                </>
              )}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
};
