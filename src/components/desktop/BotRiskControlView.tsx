import React, { useState, useEffect } from 'react';

interface BotRiskControlViewProps {
  showToast: (msg: string) => void;
}

export const BotRiskControlView: React.FC<BotRiskControlViewProps> = ({ showToast }) => {
  const [unlockFreeze, setUnlockFreeze] = useState(false);
  const [freezeActive, setFreezeActive] = useState(false);
  const [bybitThrottled, setBybitThrottled] = useState(true);
  const [binanceHalted, setBinanceHalted] = useState(false);
  const [okxHalted, setOkxHalted] = useState(false);

  // Live system clock
  const [currentTime, setCurrentTime] = useState('13:42:08.192 UTC');
  const [slaCountdownSec, setSlaCountdownSec] = useState(102);

  useEffect(() => {
    const clockTimer = setInterval(() => {
      const now = new Date();
      const hrs = String(now.getUTCHours()).padStart(2, '0');
      const mins = String(now.getUTCMinutes()).padStart(2, '0');
      const secs = String(now.getUTCSeconds()).padStart(2, '0');
      const ms = String(now.getUTCMilliseconds()).padStart(3, '0');
      setCurrentTime(`${hrs}:${mins}:${secs}.${ms} UTC`);
    }, 90);

    const slaTimer = setInterval(() => {
      setSlaCountdownSec((prev) => (prev > 0 ? prev - 1 : 120));
    }, 1000);

    return () => {
      clearInterval(clockTimer);
      clearInterval(slaTimer);
    };
  }, []);

  const formatSla = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `00:${mins < 10 ? '0' : ''}${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleExecuteGlobalFreeze = () => {
    if (!unlockFreeze) return;
    if (confirm('CRITICAL INTERVENTION: Execute GLOBAL NEW-TRADE FREEZE across all 1,248 bot workers?')) {
      setFreezeActive(true);
      showToast('GLOBAL FREEZE EXECUTED. In-flight trades will safely reconcile. No new executions permitted.');
    }
  };

  const handleMitigationAction = (type: 'force-fill' | 'liquidate' | 'escalate') => {
    if (type === 'force-fill') {
      showToast('EXECUTED: Force market sweep on OKX order book for remaining 0.15000000 BTC. Slippage locked to 0.15%.');
    } else if (type === 'liquidate') {
      if (confirm('Confirm immediate market dump of 0.25 BTC filled leg back to USDT on Binance?')) {
        showToast('POSITION LIQUIDATED. Resulting delta returned as USDT credit to user account.');
      }
    } else if (type === 'escalate') {
      showToast('Ticket #INC-9042 escalated to Quantitative Desk 1 (Pager alert dispatched to Senior Trader).');
    }
  };

  return (
    <div className="flex flex-col w-full bg-[#0d1320] min-h-screen text-[#dde2f5]">
      {/* Top Telemetry & Incident Severity Ribbon */}
      <div className="px-6 py-3 bg-[#080e1b] flex flex-wrap items-center justify-between gap-4 border-b border-[#3e4850]/30 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-[#93000a]/20 px-2.5 py-1 rounded border border-[#93000a]/40">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ffb4ab] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#ffb4ab]"></span>
            </span>
            <span className="font-label-caps text-label-caps text-[#ffb4ab] tracking-wider uppercase font-bold">
              1 In-Flight Desync Detected
            </span>
          </div>

          <div className="hidden md:flex items-center gap-2 font-data-mono-sm text-xs">
            <span className="font-label-caps uppercase text-[#88929b]">Active Bot Workers:</span>
            <span className="text-[#dde2f5] font-semibold">1,248 Nodes</span>
            <span className="text-[#3e4850]">|</span>
            <span className="font-label-caps uppercase text-[#88929b]">Aggregated Hedging Exposure:</span>
            <span className="text-[#4fdbc8] font-semibold">$9,642.80 USDT</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="font-data-mono-sm text-xs text-[#88929b]">Terminal Timestamp:</span>
          <span className="font-data-mono-sm text-xs text-[#89ceff] font-mono font-bold">
            {currentTime}
          </span>
          <span className="px-2 py-0.5 rounded bg-[#242a38] text-[#bec8d2] font-label-caps text-[10px] font-bold">
            ROLE: RISK_OFFICER_L3
          </span>
        </div>
      </div>

      <div className="p-6 space-y-6 max-w-[1600px] mx-auto w-full">
        {/* SECTION 1: MASTER EMERGENCY CONTROLS & KILL-SWITCH BANNER */}
        <section className="space-y-4">
          <div className="flex flex-col lg:flex-row gap-4 items-stretch">
            {/* Red Primary Kill-Switch Box */}
            <div className="lg:w-7/12 bg-[#161b29] rounded-xl p-5 flex flex-col justify-between shadow-md relative overflow-hidden border border-[#3e4850]/30">
              <div className="absolute -right-8 -top-8 w-48 h-48 bg-[#93000a]/10 rounded-full blur-2xl pointer-events-none"></div>

              <div className="space-y-2 relative z-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[#ffb4ab] text-[28px]">gavel</span>
                    <span className="font-headline-lg text-headline-lg text-[#dde2f5] font-bold tracking-tight">
                      Global New-Trade Freeze
                    </span>
                  </div>
                  <span className={`font-label-caps text-label-caps px-2 py-0.5 rounded font-mono tracking-widest uppercase font-bold ${
                    freezeActive ? 'bg-[#93000a] text-[#ffdad6]' : 'bg-[#93000a]/40 text-[#ffdad6]'
                  }`}>
                    {freezeActive ? 'FREEZE ENFORCED' : 'ARMED / READY'}
                  </span>
                </div>
                <p className="font-body-md text-body-md text-[#bec8d2] max-w-2xl leading-relaxed">
                  Halts all new triangular arbitrage executions across all user accounts immediately. Does <strong className="text-[#dde2f5] font-semibold">NOT</strong> cancel open hedging legs or disrupt in-flight reconciliation processes.
                </p>
              </div>

              <div className="mt-4 pt-3 bg-[#080e1b]/60 -mx-5 -mb-5 p-4 flex flex-wrap items-center justify-between gap-4 relative z-10 border-t border-[#3e4850]/20">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#88929b] text-[18px]">verified_user</span>
                  <span className="font-data-mono-sm text-xs text-[#88929b]">
                    Dual-Signoff Verified: 2FA Token Validated (RSA-4096)
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={unlockFreeze}
                      onChange={(e) => setUnlockFreeze(e.target.checked)}
                      className="w-4 h-4 rounded bg-[#242a38] border-0 accent-[#ffb4ab] cursor-pointer"
                    />
                    <span className="font-label-caps text-label-caps text-[#bec8d2] uppercase font-bold">
                      Unlock Switch
                    </span>
                  </label>
                  <button
                    disabled={!unlockFreeze}
                    onClick={handleExecuteGlobalFreeze}
                    className={`px-4 py-2 rounded font-label-caps text-label-caps tracking-wider uppercase font-bold flex items-center gap-2 transition-all duration-150 shadow-sm ${
                      unlockFreeze
                        ? 'bg-[#93000a] hover:bg-[#690005] text-[#ffdad6] cursor-pointer'
                        : 'bg-[#93000a]/40 text-[#ffdad6]/60 cursor-not-allowed'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">power_settings_new</span>
                    <span>{freezeActive ? 'GLOBAL FREEZE ACTIVE' : 'EXECUTE GLOBAL FREEZE'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Sub-Second Execution Health Card */}
            <div className="lg:w-5/12 bg-[#161b29] rounded-xl p-5 flex flex-col justify-between shadow-md border border-[#3e4850]/30">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-label-caps text-label-caps text-[#88929b] uppercase tracking-wider font-semibold">
                    Gateway Relays & Rate Allocations
                  </span>
                  <span className="font-data-mono-sm text-data-mono-sm text-[#4fdbc8] font-bold">
                    5 Connectors Linked
                  </span>
                </div>
                <div className="font-headline-md text-headline-md text-[#dde2f5] font-semibold">
                  Sub-Second Execution Health
                </div>
                <p className="font-body-sm text-body-sm text-[#bec8d2]">
                  Real-time WebSocket & FIX stream heartbeat. Auto-failover routes triggered when latency breaks &gt;120ms threshold.
                </p>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2 bg-[#080e1b] p-3 rounded-lg border border-[#3e4850]/20">
                <div className="flex flex-col">
                  <span className="font-label-caps text-[10px] text-[#88929b] uppercase">Min Relay RTT</span>
                  <span className="font-data-mono-lg text-data-mono-lg text-[#4fdbc8] font-bold">18ms</span>
                  <span className="font-data-mono-sm text-[11px] text-[#88929b]">Binance Spot</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-label-caps text-[10px] text-[#88929b] uppercase">Max Relay RTT</span>
                  <span className="font-data-mono-lg text-data-mono-lg text-[#ffb4ab] font-bold">142ms</span>
                  <span className="font-data-mono-sm text-[11px] text-[#ffb4ab] font-medium">Bybit Main</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-label-caps text-[10px] text-[#88929b] uppercase">24h Slippage</span>
                  <span className="font-data-mono-lg text-data-mono-lg text-[#dde2f5] font-bold">0.038%</span>
                  <span className="font-data-mono-sm text-[11px] text-[#4fdbc8] font-medium">Within Safety Band</span>
                </div>
              </div>
            </div>
          </div>

          {/* Selective Exchange Circuit Breakers Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Binance Spot Card */}
            <div className="bg-[#1a1f2d] rounded-lg p-3.5 flex flex-col justify-between space-y-3 shadow-sm border border-[#3e4850]/30">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-headline-md text-headline-md text-[#dde2f5] font-semibold">Binance</span>
                  <span className="font-label-caps text-label-caps px-2 py-0.5 rounded bg-[#4fdbc8]/15 text-[#4fdbc8] flex items-center gap-1 font-bold">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#4fdbc8]"></span> ONLINE
                  </span>
                </div>
                <div className="font-label-caps text-[10px] text-[#88929b] uppercase">Spot Liquidity Pool</div>
              </div>

              <div className="space-y-1 bg-[#080e1b] p-2 rounded border border-[#3e4850]/20 font-data-mono-sm text-xs">
                <div className="flex justify-between">
                  <span className="text-[#88929b]">Ping RTT:</span>
                  <span className="text-[#4fdbc8] font-bold">18ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#88929b]">Error Rate:</span>
                  <span className="text-[#dde2f5]">0.02%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#88929b]">Rate Limit:</span>
                  <span className="text-[#dde2f5]">34% (1200/m)</span>
                </div>
              </div>

              <button
                onClick={() => {
                  setBinanceHalted(!binanceHalted);
                  showToast(binanceHalted ? 'Resumed Binance routing.' : 'Halted Binance routing.');
                }}
                className={`w-full py-1.5 px-2 rounded font-label-caps text-[10px] tracking-wider uppercase font-bold transition-colors ${
                  binanceHalted
                    ? 'bg-[#04b4a2] text-[#003731]'
                    : 'bg-[#242a38] text-[#dde2f5] hover:bg-[#93000a] hover:text-[#ffdad6]'
                }`}
              >
                {binanceHalted ? 'Resume Binance' : 'Halt Binance Routing'}
              </button>
            </div>

            {/* OKX Pro Card */}
            <div className="bg-[#1a1f2d] rounded-lg p-3.5 flex flex-col justify-between space-y-3 shadow-sm border border-[#3e4850]/30">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-headline-md text-headline-md text-[#dde2f5] font-semibold">OKX Pro</span>
                  <span className="font-label-caps text-label-caps px-2 py-0.5 rounded bg-[#4fdbc8]/15 text-[#4fdbc8] flex items-center gap-1 font-bold">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#4fdbc8]"></span> ONLINE
                  </span>
                </div>
                <div className="font-label-caps text-[10px] text-[#88929b] uppercase">Swap & Spot Ledger</div>
              </div>

              <div className="space-y-1 bg-[#080e1b] p-2 rounded border border-[#3e4850]/20 font-data-mono-sm text-xs">
                <div className="flex justify-between">
                  <span className="text-[#88929b]">Ping RTT:</span>
                  <span className="text-[#4fdbc8] font-bold">24ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#88929b]">Error Rate:</span>
                  <span className="text-[#dde2f5]">0.00%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#88929b]">Rate Limit:</span>
                  <span className="text-[#dde2f5]">42% (840/m)</span>
                </div>
              </div>

              <button
                onClick={() => {
                  setOkxHalted(!okxHalted);
                  showToast(okxHalted ? 'Resumed OKX routing.' : 'Halted OKX routing.');
                }}
                className={`w-full py-1.5 px-2 rounded font-label-caps text-[10px] tracking-wider uppercase font-bold transition-colors ${
                  okxHalted
                    ? 'bg-[#04b4a2] text-[#003731]'
                    : 'bg-[#242a38] text-[#dde2f5] hover:bg-[#93000a] hover:text-[#ffdad6]'
                }`}
              >
                {okxHalted ? 'Resume OKX' : 'Halt OKX Routing'}
              </button>
            </div>

            {/* Bybit Main Card */}
            <div className="bg-[#1a1f2d] rounded-lg p-3.5 flex flex-col justify-between space-y-3 shadow-sm border border-[#3e4850]/30 relative overflow-hidden">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-headline-md text-headline-md text-[#dde2f5] font-semibold">Bybit Main</span>
                  <span className={`font-label-caps text-label-caps px-2 py-0.5 rounded flex items-center gap-1 font-bold ${
                    bybitThrottled ? 'bg-[#00aac6]/20 text-[#4cd7f6]' : 'bg-[#4fdbc8]/15 text-[#4fdbc8]'
                  }`}>
                    <span className="h-1.5 w-1.5 rounded-full bg-[#4cd7f6] animate-pulse"></span>
                    {bybitThrottled ? 'THROTTLED' : 'NORMAL'}
                  </span>
                </div>
                <div className="font-label-caps text-[10px] text-[#88929b] uppercase">Perp & Unified Margin</div>
              </div>

              <div className="space-y-1 bg-[#080e1b] p-2 rounded border border-[#3e4850]/20 font-data-mono-sm text-xs">
                <div className="flex justify-between">
                  <span className="text-[#88929b]">Ping RTT:</span>
                  <span className="text-[#ffb4ab] font-bold">142ms (Elevated)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#88929b]">Error Rate:</span>
                  <span className="text-[#dde2f5]">1.18%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#88929b]">Rate Limit:</span>
                  <span className="text-[#ffb4ab] font-bold">88% (Critical)</span>
                </div>
              </div>

              <button
                onClick={() => {
                  setBybitThrottled(false);
                  showToast('Bybit rate-limiting queue flushed. Route reset to standard round-robin.');
                }}
                disabled={!bybitThrottled}
                className="w-full py-1.5 px-2 rounded bg-[#0ea5e9] text-[#003751] font-label-caps text-[10px] tracking-wider uppercase hover:bg-[#89ceff] transition-colors font-bold disabled:bg-[#242a38] disabled:text-[#4fdbc8] disabled:cursor-not-allowed"
              >
                {bybitThrottled ? 'Restore Throttle' : 'THROTTLE RESTORED'}
              </button>
            </div>

            {/* Coinstore Card */}
            <div className="bg-[#1a1f2d] rounded-lg p-3.5 flex flex-col justify-between space-y-3 shadow-sm border border-[#3e4850]/30 opacity-80">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-headline-md text-headline-md text-[#dde2f5] font-semibold">Coinstore</span>
                  <span className="font-label-caps text-label-caps px-2 py-0.5 rounded bg-[#2f3543] text-[#88929b] flex items-center gap-1 font-bold">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#88929b]"></span> PAUSED
                  </span>
                </div>
                <div className="font-label-caps text-[10px] text-[#88929b] uppercase">Secondary Arb Pool</div>
              </div>

              <div className="space-y-1 bg-[#080e1b] p-2 rounded border border-[#3e4850]/20 font-data-mono-sm text-xs">
                <div className="flex justify-between">
                  <span className="text-[#88929b]">Schedule:</span>
                  <span className="text-[#dde2f5]">Maint. to 14:00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#88929b]">Failover:</span>
                  <span className="text-[#4fdbc8] font-bold">Diverted to Backup</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#88929b]">Pending Legs:</span>
                  <span className="text-[#dde2f5]">0 Empty</span>
                </div>
              </div>

              <button disabled className="w-full py-1.5 px-2 rounded bg-[#242a38] text-[#88929b] font-label-caps text-[10px] tracking-wider uppercase cursor-not-allowed">
                Maint Lock Active
              </button>
            </div>

            {/* WazirX Card */}
            <div className="bg-[#1a1f2d] rounded-lg p-3.5 flex flex-col justify-between space-y-3 shadow-sm border border-[#3e4850]/30 opacity-70">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-headline-md text-headline-md text-[#dde2f5] font-semibold">WazirX (IN)</span>
                  <span className="font-label-caps text-label-caps px-2 py-0.5 rounded bg-[#2f3543] text-[#ffb4ab] flex items-center gap-1 font-bold">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#ffb4ab]"></span> BLOCKED
                  </span>
                </div>
                <div className="font-label-caps text-[10px] text-[#88929b] uppercase">Fiat INR Routing</div>
              </div>

              <div className="space-y-1 bg-[#080e1b] p-2 rounded border border-[#3e4850]/20 font-data-mono-sm text-xs">
                <div className="flex justify-between">
                  <span className="text-[#88929b]">Compliance:</span>
                  <span className="text-[#ffb4ab] font-bold">Sandbox Mode</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#88929b]">API Gateway:</span>
                  <span className="text-[#dde2f5]">Loopback Mock</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#88929b]">Order Book:</span>
                  <span className="text-[#88929b]">Air-Gapped</span>
                </div>
              </div>

              <button disabled className="w-full py-1.5 px-2 rounded bg-[#242a38] text-[#88929b] font-label-caps text-[10px] tracking-wider uppercase cursor-not-allowed">
                Regulatory Quarantine
              </button>
            </div>
          </div>
        </section>

        {/* SECTION 2: ACTIVE INCIDENT & PARTIAL-FILL RESOLUTION CONSOLE */}
        <section className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#89ceff] text-[20px]">troubleshoot</span>
                <span className="font-headline-md text-headline-md text-[#dde2f5] font-semibold">
                  Active Incident & Partial-Fill Resolution Console
                </span>
              </div>
              <p className="font-body-sm text-body-sm text-[#bec8d2]">
                Real-time non-atomic two-legged trade anomalies requiring autonomous or officer-level hedging intervention.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-label-caps text-label-caps text-[#88929b] uppercase font-bold">
                Active SLA Timer:
              </span>
              <span className="font-data-mono-sm text-data-mono-sm px-2.5 py-1 rounded bg-[#93000a] text-[#ffdad6] font-bold font-mono">
                {formatSla(slaCountdownSec)}
              </span>
            </div>
          </div>

          {/* Incident Main Bento Card */}
          <div className="bg-[#161b29] rounded-xl p-5 shadow-md space-y-4 border border-[#3e4850]/30">
            {/* Header row */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-2 bg-[#080e1b]/50 p-3 rounded-lg border border-[#3e4850]/20">
              <div className="flex items-center gap-4">
                <div className="flex flex-col">
                  <span className="font-label-caps text-[10px] text-[#88929b] uppercase">Incident ID</span>
                  <span className="font-data-mono-md text-data-mono-md text-[#89ceff] font-bold">#INC-9042</span>
                </div>
                <div className="h-8 w-px bg-[#3e4850]/30 hidden sm:block"></div>
                <div className="flex flex-col">
                  <span className="font-label-caps text-[10px] text-[#88929b] uppercase">Execution Pair</span>
                  <span className="font-data-mono-md text-data-mono-md text-[#dde2f5] font-bold">BTC / USDT</span>
                </div>
                <div className="h-8 w-px bg-[#3e4850]/30 hidden sm:block"></div>
                <div className="flex flex-col">
                  <span className="font-label-caps text-[10px] text-[#88929b] uppercase">Discrepancy Delta</span>
                  <span className="font-data-mono-md text-data-mono-md text-[#ffb4ab] font-bold font-mono">
                    0.15000000 BTC OPEN
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-label-caps text-label-caps px-2.5 py-1 rounded bg-[#4fdbc8]/10 text-[#4fdbc8] font-mono font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#4fdbc8] animate-ping"></span>
                  Auto-Hedging Algorithm Active
                </span>
                <span className="font-data-mono-sm text-xs text-[#88929b]">(Slippage Guard: 0.15%)</span>
              </div>
            </div>

            {/* 2-Legged Visual Execution Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-center">
              {/* Leg 1 */}
              <div className="lg:col-span-5 bg-[#1a1f2d] p-4 rounded-lg space-y-2 shadow-sm border border-[#3e4850]/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="font-label-caps text-label-caps px-1.5 py-0.5 rounded bg-[#89ceff]/20 text-[#89ceff] font-bold">
                      LEG 1
                    </span>
                    <span className="font-body-md text-body-md text-[#dde2f5] font-semibold">Binance Spot (BUY)</span>
                  </div>
                  <span className="font-label-caps text-label-caps text-[#4fdbc8] font-bold flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">check_circle</span> 100% FILLED
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 bg-[#080e1b] p-2.5 rounded border border-[#3e4850]/20 font-data-mono-sm text-xs">
                  <div>
                    <span className="text-[#88929b] block text-[10px] uppercase">Filled Amount</span>
                    <span className="text-[#dde2f5] font-bold">0.25000000 BTC</span>
                  </div>
                  <div>
                    <span className="text-[#88929b] block text-[10px] uppercase">Fill Execution Price</span>
                    <span className="text-[#dde2f5] font-mono">$64,210.00 USDT</span>
                  </div>
                  <div>
                    <span className="text-[#88929b] block text-[10px] uppercase">Route Execution Time</span>
                    <span className="text-[#bec8d2]">13:41:04.281 UTC</span>
                  </div>
                  <div>
                    <span className="text-[#88929b] block text-[10px] uppercase">Total Cost</span>
                    <span className="text-[#bec8d2]">$16,052.50 USDT</span>
                  </div>
                </div>
              </div>

              {/* Connector Graphic */}
              <div className="lg:col-span-2 flex flex-col items-center justify-center text-center py-2">
                <div className="w-full flex items-center justify-center relative">
                  <div className="h-0.5 w-full bg-[#3e4850]/40 absolute"></div>
                  <span className="relative z-10 p-2 rounded-full bg-[#242a38] text-[#ffb4ab] shadow-sm flex items-center justify-center border border-[#93000a]/40">
                    <span className="material-symbols-outlined text-[20px]">sync_problem</span>
                  </span>
                </div>
                <span className="font-label-caps text-label-caps text-[#ffb4ab] uppercase font-bold mt-1">
                  Non-Atomic Desync
                </span>
                <span className="font-data-mono-sm text-data-mono-sm text-[#88929b] text-[10px]">
                  Spread Drift: +$542.00
                </span>
              </div>

              {/* Leg 2 */}
              <div className="lg:col-span-5 bg-[#1a1f2d] p-4 rounded-lg space-y-2 shadow-sm border border-[#3e4850]/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="font-label-caps text-label-caps px-1.5 py-0.5 rounded bg-[#4cd7f6]/20 text-[#4cd7f6] font-bold">
                      LEG 2
                    </span>
                    <span className="font-body-md text-body-md text-[#dde2f5] font-semibold">OKX Pro (SELL)</span>
                  </div>
                  <span className="font-label-caps text-label-caps text-[#ffb4ab] font-bold flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">warning</span> 40% PARTIAL FILL
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 bg-[#080e1b] p-2.5 rounded border border-[#3e4850]/20 font-data-mono-sm text-xs">
                  <div>
                    <span className="text-[#88929b] block text-[10px] uppercase">Filled Amount</span>
                    <span className="text-[#4fdbc8] font-bold">0.10000000 BTC</span>
                  </div>
                  <div>
                    <span className="text-[#88929b] block text-[10px] uppercase">Fill Execution Price</span>
                    <span className="text-[#dde2f5] font-mono">$64,752.00 USDT</span>
                  </div>
                  <div>
                    <span className="text-[#88929b] block text-[10px] uppercase">Unfilled Remaining</span>
                    <span className="text-[#ffb4ab] font-bold">0.15000000 BTC</span>
                  </div>
                  <div>
                    <span className="text-[#88929b] block text-[10px] uppercase">Pending Hedging Value</span>
                    <span className="text-[#ffb4ab] font-mono">~$9,712.80 USDT</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Real-time Hedging Pipeline Log & Action Drawer */}
            <div className="bg-[#080e1b] p-4 rounded-lg space-y-3 border border-[#3e4850]/20">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#88929b] text-[16px]">terminal</span>
                  <span className="font-label-caps text-label-caps text-[#88929b] uppercase tracking-wider font-semibold">
                    Hedging Micro-Log Feed
                  </span>
                </div>
                <span className="font-data-mono-sm text-xs text-[#4fdbc8] font-bold">
                  Auto-Quoter Attempt #4 in 12s
                </span>
              </div>

              <div className="font-data-mono-sm text-xs bg-[#242a38]/40 p-3 rounded space-y-1.5 text-[#bec8d2] font-mono overflow-x-auto max-h-28">
                <div className="flex gap-2">
                  <span className="text-[#88929b]">[13:41:04.302]</span>
                  <span className="text-[#89ceff]">DEBUG</span>
                  <span>Binance order #B-99824 filled 0.25 BTC. Routing outbound Leg 2 to OKX book #O-3310...</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-[#88929b]">[13:41:04.490]</span>
                  <span className="text-[#ffb4ab]">WARN</span>
                  <span>OKX depth evaporated: 0.10 BTC filled @ $64,752.00. 0.15 BTC rejected by IOC limit guard.</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-[#88929b]">[13:41:05.104]</span>
                  <span className="text-[#4fdbc8]">INFO</span>
                  <span>Auto-hedge engine locked 0.15 BTC in isolated custody buffer. Monitoring cross-book slippage (0.04% curr &lt; 0.15% max).</span>
                </div>
              </div>

              {/* Mitigation Actions */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-[#3e4850]/20">
                <span className="font-label-caps text-label-caps text-[#88929b] uppercase font-bold">
                  Authorized Desk Mitigation Actions:
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => handleMitigationAction('force-fill')}
                    className="px-3.5 py-1.5 rounded bg-[#89ceff] text-[#00344d] font-label-caps text-label-caps tracking-wider uppercase font-bold hover:bg-[#c9e6ff] transition-colors shadow-sm flex items-center gap-1 active:scale-95"
                  >
                    <span className="material-symbols-outlined text-[16px]">bolt</span>
                    <span>Force Market Fill Remaining Leg</span>
                  </button>
                  <button
                    onClick={() => handleMitigationAction('liquidate')}
                    className="px-3.5 py-1.5 rounded bg-[#242a38] text-[#ffb4ab] hover:bg-[#93000a] hover:text-[#ffdad6] font-label-caps text-label-caps tracking-wider uppercase font-bold transition-colors flex items-center gap-1 active:scale-95"
                  >
                    <span className="material-symbols-outlined text-[16px]">point_of_sale</span>
                    <span>Liquidate Stale Leg to USDT</span>
                  </button>
                  <button
                    onClick={() => handleMitigationAction('escalate')}
                    className="px-3.5 py-1.5 rounded bg-[#242a38] text-[#dde2f5] hover:bg-[#2f3543] font-label-caps text-label-caps tracking-wider uppercase font-semibold transition-colors flex items-center gap-1 active:scale-95"
                  >
                    <span className="material-symbols-outlined text-[16px]">support</span>
                    <span>Escalate to Manual Desk</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 3: SYSTEM-WIDE EXPOSURE & LIMITS CONFIGURATION */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-headline-md text-headline-md text-[#dde2f5] font-semibold">
                System-Wide Exposure & Limits Configuration
              </span>
              <p className="font-body-sm text-body-sm text-[#bec8d2]">
                Hardcoded protocol safeguards, anti-slippage barriers, and automated margin-fee locks.
              </p>
            </div>
            <span className="font-label-caps text-label-caps text-[#4fdbc8] font-mono uppercase bg-[#4fdbc8]/10 px-2.5 py-1 rounded font-bold">
              ALL GUARDS SYNCHRONIZED
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Parameter 1 */}
            <div className="bg-[#161b29] rounded-xl p-4 flex flex-col justify-between space-y-3 shadow-sm border border-[#3e4850]/30">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-label-caps text-[10px] text-[#88929b] uppercase tracking-wider font-semibold">
                    EXECUTION CONSTRAINT
                  </span>
                  <span className="material-symbols-outlined text-[#89ceff] text-[18px]">tune</span>
                </div>
                <div className="font-headline-md text-headline-md text-[#dde2f5] font-semibold">
                  Max Slippage Tolerance
                </div>
                <p className="font-body-sm text-body-sm text-[#bec8d2]">
                  Max allowed deviation between quote timestamp and physical settlement fill.
                </p>
              </div>

              <div className="space-y-2 bg-[#080e1b] p-3 rounded-lg border border-[#3e4850]/20">
                <div className="flex items-baseline justify-between">
                  <span className="font-data-mono-lg text-data-mono-lg text-[#89ceff] font-bold">0.150%</span>
                  <span className="font-data-mono-sm text-xs text-[#88929b]">Hard Limit: 0.250%</span>
                </div>
                <div className="w-full bg-[#242a38] h-1.5 rounded overflow-hidden">
                  <div className="bg-[#0ea5e9] h-full" style={{ width: '60%' }}></div>
                </div>
                <span className="font-data-mono-sm text-[11px] text-[#4fdbc8] block font-semibold">
                  60% of hard limit safety ceiling
                </span>
              </div>

              <div className="flex items-center justify-between text-[#88929b] font-data-mono-sm text-xs">
                <span>Re-quote Threshold:</span>
                <span className="text-[#dde2f5] font-semibold">&gt; 0.08% Spread Drop</span>
              </div>
            </div>

            {/* Parameter 2 */}
            <div className="bg-[#161b29] rounded-xl p-4 flex flex-col justify-between space-y-3 shadow-sm border border-[#3e4850]/30">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-label-caps text-[10px] text-[#88929b] uppercase tracking-wider font-semibold">
                    ACCOUNT RISK CAP
                  </span>
                  <span className="material-symbols-outlined text-[#4fdbc8] text-[18px]">security</span>
                </div>
                <div className="font-headline-md text-headline-md text-[#dde2f5] font-semibold">
                  Daily Drawdown Limit
                </div>
                <p className="font-body-sm text-body-sm text-[#bec8d2]">
                  Autonomous kill-switch triggered per customer account upon negative slip accumulation.
                </p>
              </div>

              <div className="space-y-2 bg-[#080e1b] p-3 rounded-lg border border-[#3e4850]/20">
                <div className="flex items-baseline justify-between">
                  <span className="font-data-mono-lg text-data-mono-lg text-[#dde2f5] font-bold font-mono">
                    $150.00
                  </span>
                  <span className="font-data-mono-sm text-xs text-[#88929b] font-mono">USDT / 24h</span>
                </div>
                <div className="w-full bg-[#242a38] h-1.5 rounded overflow-hidden">
                  <div className="bg-[#4fdbc8] h-full" style={{ width: '14%' }}></div>
                </div>
                <span className="font-data-mono-sm text-[11px] text-[#88929b] block">
                  Average User Burn Today: $4.18
                </span>
              </div>

              <div className="flex items-center justify-between text-[#88929b] font-data-mono-sm text-xs">
                <span>Users in Breach:</span>
                <span className="text-[#4fdbc8] font-bold">0 / 4,812 Users</span>
              </div>
            </div>

            {/* Parameter 3 */}
            <div className="bg-[#161b29] rounded-xl p-4 flex flex-col justify-between space-y-3 shadow-sm border border-[#3e4850]/30">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-label-caps text-[10px] text-[#88929b] uppercase tracking-wider font-semibold">
                    TEMPORAL INTEGRITY
                  </span>
                  <span className="material-symbols-outlined text-[#4cd7f6] text-[18px]">timer_off</span>
                </div>
                <div className="font-headline-md text-headline-md text-[#dde2f5] font-semibold">
                  Stale Invalidation
                </div>
                <p className="font-body-sm text-body-sm text-[#bec8d2]">
                  Order book quotes older than window threshold are purged from triangular resolver.
                </p>
              </div>

              <div className="space-y-2 bg-[#080e1b] p-3 rounded-lg border border-[#3e4850]/20">
                <div className="flex items-baseline justify-between">
                  <span className="font-data-mono-lg text-data-mono-lg text-[#4cd7f6] font-bold font-mono">
                    400 ms
                  </span>
                  <span className="font-data-mono-sm text-xs text-[#88929b] font-mono">Strict Max Age</span>
                </div>
                <div className="w-full bg-[#242a38] h-1.5 rounded overflow-hidden">
                  <div className="bg-[#4cd7f6] h-full" style={{ width: '48%' }}></div>
                </div>
                <span className="font-data-mono-sm text-[11px] text-[#88929b] block">
                  Average Engine Tick: 192ms
                </span>
              </div>

              <div className="flex items-center justify-between text-[#88929b] font-data-mono-sm text-xs">
                <span>Stale Quote Rejections:</span>
                <span className="text-[#dde2f5] font-semibold">218 / min (Normal)</span>
              </div>
            </div>

            {/* Parameter 4 */}
            <div className="bg-[#161b29] rounded-xl p-4 flex flex-col justify-between space-y-3 shadow-sm border-l-2 border-[#89ceff] border-y border-r border-[#3e4850]/30">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-label-caps text-[10px] text-[#89ceff] uppercase tracking-wider font-bold">
                    BALANCE INTEGRITY
                  </span>
                  <span className="material-symbols-outlined text-[#89ceff] text-[18px]">lock_reset</span>
                </div>
                <div className="font-headline-md text-headline-md text-[#dde2f5] font-semibold">
                  9% Fee Deduction Lock
                </div>
                <p className="font-body-sm text-body-sm text-[#bec8d2]">
                  Double-entry platform profit take protection policy across all linked user ledger balances.
                </p>
              </div>

              <div className="bg-[#080e1b] p-3 rounded-lg space-y-1 border border-[#3e4850]/20">
                <span className="font-label-caps text-label-caps text-[#ffb4ab] uppercase font-bold flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">shield</span> Safety Lock Rule
                </span>
                <p className="font-data-mono-sm text-xs text-[#dde2f5] leading-tight">
                  Platform 9% fee deduction automatically paused if user Service Wallet drops below{' '}
                  <span className="text-[#4fdbc8] font-bold font-mono">$10.00 USDT</span> threshold.
                </p>
              </div>

              <div className="flex items-center justify-between text-[#88929b] font-data-mono-sm text-xs">
                <span>Lock Mechanism State:</span>
                <span className="text-[#4fdbc8] font-bold">ARMED & ENFORCED</span>
              </div>
            </div>
          </div>
        </section>

        {/* Operational Audit Note Footer */}
        <div className="pt-2 pb-4 flex flex-wrap items-center justify-between text-[#88929b] font-data-mono-sm text-xs border-t border-[#3e4850]/20">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px] text-[#4fdbc8]">verified</span>
            <span>ArbSetu Bot Risk Engine Kernel v4.19-hf2 | Distributed Consensus Enforced</span>
          </div>
          <div className="flex items-center gap-4">
            <span>Ledger Signer: 0x89C...4EF</span>
            <span>Enclave Latency: 0.8ms</span>
          </div>
        </div>
      </div>
    </div>
  );
};
