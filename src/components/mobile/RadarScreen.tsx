import React, { useState, useEffect } from 'react';
import { INITIAL_SPREADS } from '../../data/mockData';
import { ArbitrageSpread } from '../../types';

interface RadarScreenProps {
  showToast: (msg: string) => void;
  onNavigateToTrades?: () => void;
}

export const RadarScreen: React.FC<RadarScreenProps> = ({ showToast, onNavigateToTrades }) => {
  const [spreads, setSpreads] = useState<ArbitrageSpread[]>(INITIAL_SPREADS);
  const [engineActive, setEngineActive] = useState(true);
  const [windowTimer, setWindowTimer] = useState(4.2);
  const [executingId, setExecutingId] = useState<string | null>(null);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [capitalPool, setCapitalPool] = useState(12500);
  const [maxSlip, setMaxSlip] = useState(0.15);
  const [dailyLossCap, setDailyLossCap] = useState(150);

  // Live countdown timer for spread window
  useEffect(() => {
    const interval = setInterval(() => {
      setWindowTimer((prev) => (prev > 0.4 ? Number((prev - 0.1).toFixed(1)) : 4.8));
    }, 100);
    return () => clearInterval(interval);
  }, []);

  const handleInstantFill = (spreadId: string) => {
    setExecutingId(spreadId);
    showToast('Routing Dual-Exchange Fill via IP-Whitelisted WebSockets...');

    setTimeout(() => {
      setExecutingId(null);
      setSpreads((prev) =>
        prev.map((s) => {
          if (s.id === spreadId) {
            return {
              ...s,
              status: 'settled',
              settledAgo: 'Just now',
              refCode: `Ref #ARB-${Math.floor(10000 + Math.random() * 90000)}`
            };
          }
          return s;
        })
      );
      showToast('Filled @ +$38.40 Net Realized Profit! 91/9 Ledger Settled.');
    }, 1200);
  };

  const handlePauseToggle = () => {
    setEngineActive(!engineActive);
    showToast(engineActive ? 'Auto-Arb Engine paused. New scans halted.' : 'Auto-Arb Engine resumed. Continuous scan active.');
  };

  const handleKillLegs = () => {
    if (confirm('Cancel all open unfilled arbitrage legs on Binance, OKX, and Bybit?')) {
      showToast('All open unfilled order legs aborted. Position neutral.');
    }
  };

  return (
    <div className="flex flex-col w-full pb-28 pt-16 bg-[#0d1320] min-h-screen">
      {/* System Status Ambient Header Bar */}
      <div className="px-4 py-2.5 bg-[#080e1b] flex items-center justify-between shadow-sm border-b border-[#1e293b]/40">
        <div className="flex items-center gap-2 min-w-0">
          <span className="material-symbols-outlined text-[16px] text-[#4fdbc8]">verified_user</span>
          <span className="font-data-mono-sm text-data-mono-sm text-[#dde2f5] truncate font-semibold">
            UID: AS-882941
          </span>
          <span className="px-1.5 py-0.5 rounded-full bg-[#242a38] font-label-caps text-[9px] text-[#4fdbc8] tracking-wider uppercase font-bold">
            Tier 2 KYC
          </span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="w-2 h-2 rounded-full bg-[#4fdbc8] animate-pulse"></span>
          <span className="font-data-mono-sm text-data-mono-sm text-[#bec8d2]">Radar 14ms</span>
        </div>
      </div>

      <div className="p-4 space-y-3 max-w-xl mx-auto w-full">
        {/* Non-Custodial Architecture Trust Badge */}
        <div className="bg-[#161b29] p-3.5 rounded-xl shadow-sm relative overflow-hidden border border-[#3e4850]/30">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#242a38] flex items-center justify-center shrink-0 text-[#89ceff]">
              <span className="material-symbols-outlined text-[20px]">lock_clock</span>
            </div>
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-label-caps text-label-caps text-[#89ceff] tracking-wider uppercase font-bold">
                  Non-Custodial Architecture
                </span>
                <span className="px-1 rounded bg-[#1a1f2d] font-label-caps text-[9px] text-[#bec8d2] uppercase font-semibold">
                  API Only
                </span>
              </div>
              <p className="font-body-sm text-body-sm text-[#bec8d2] leading-relaxed">
                Capital stays isolated inside your exchange accounts. Bot triggers spot pairs without withdrawal permissions.
              </p>
            </div>
          </div>
        </div>

        {/* Inventory Imbalance Alert Toast / Banner */}
        <div className="bg-[#161b29] p-3.5 rounded-xl shadow-sm border border-[#3e4850]/20">
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-[#1a1f2d] flex items-center justify-center shrink-0 text-[#4fdbc8]">
              <span className="material-symbols-outlined text-[18px]">balance</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="font-label-caps text-label-caps text-[#4fdbc8] tracking-wider uppercase font-bold">
                  Inventory Imbalance
                </span>
                <span className="font-data-mono-sm text-[10px] text-[#bec8d2] bg-[#242a38] px-1.5 py-0.5 rounded">
                  Rebalance Suggested
                </span>
              </div>
              <p className="font-body-sm text-body-sm text-[#bec8d2] mt-0.5 leading-snug">
                Binance USDT depleted (<span className="font-data-mono-sm text-[#dde2f5] font-semibold">$120</span>), OKX heavy (<span className="font-data-mono-sm text-[#dde2f5] font-semibold">0.84 BTC</span>). Manual cross-transfer advised to unlock next spread.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Status KPI Matrix */}
        <div className="grid grid-cols-2 gap-2.5">
          {/* KPI 1: Realized Arb Profit */}
          <div className="bg-[#161b29] p-3.5 rounded-xl flex flex-col justify-between shadow-sm border border-[#3e4850]/20">
            <div className="flex items-center justify-between">
              <span className="font-label-caps text-label-caps text-[#bec8d2] uppercase tracking-wider">
                Net Realized
              </span>
              <span className="material-symbols-outlined text-[18px] text-[#4fdbc8]">trending_up</span>
            </div>
            <div className="mt-2">
              <div className="font-data-mono-lg text-data-mono-lg text-[#4fdbc8] tracking-tight font-bold">
                $1,842.60
              </div>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="font-data-mono-sm text-data-mono-sm text-[#4fdbc8] font-semibold">+14.2%</span>
                <span className="font-body-sm text-[10px] text-[#bec8d2]">30D Peak HWM</span>
              </div>
            </div>
          </div>

          {/* KPI 2: Service Wallet Pool */}
          <div className="bg-[#161b29] p-3.5 rounded-xl flex flex-col justify-between shadow-sm border border-[#3e4850]/20">
            <div className="flex items-center justify-between">
              <span className="font-label-caps text-label-caps text-[#bec8d2] uppercase tracking-wider">
                Gas & 9% Fee Pool
              </span>
              <span className="material-symbols-outlined text-[18px] text-[#89ceff]">toll</span>
            </div>
            <div className="mt-2">
              <div className="font-data-mono-lg text-data-mono-lg text-[#89ceff] tracking-tight font-bold">
                $48.20 <span className="font-label-caps text-[10px] text-[#bec8d2] font-normal">USDT</span>
              </div>
              <div className="flex items-center justify-between mt-0.5">
                <span className="font-data-mono-sm text-[11px] text-[#bec8d2]">~54 fills left</span>
                <span className="px-1.5 py-0.5 rounded bg-[#1a1f2d] font-label-caps text-[9px] text-[#4fdbc8] font-bold">
                  Auto-On
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Connected Exchanges Micro-Rail */}
        <div className="bg-[#161b29] p-3.5 rounded-xl shadow-sm space-y-2 border border-[#3e4850]/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="font-label-caps text-label-caps text-[#bec8d2] tracking-wider uppercase font-semibold">
                Connected Nodes
              </span>
              <span className="px-1.5 py-0.5 rounded-full bg-[#242a38] font-data-mono-sm text-[10px] text-[#89ceff] font-bold">
                3/5 Active
              </span>
            </div>
            <span className="font-data-mono-sm text-[11px] text-[#bec8d2]">Sub-tick Sync</span>
          </div>

          <div className="grid grid-cols-5 gap-1.5 pt-0.5">
            {/* Binance */}
            <div className="bg-[#1a1f2d] p-2 rounded-lg flex flex-col items-center justify-center text-center">
              <span className="font-label-caps text-[10px] text-[#dde2f5] font-semibold">BNB</span>
              <div className="flex items-center gap-1 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#4fdbc8]"></span>
                <span className="font-data-mono-sm text-[10px] text-[#4fdbc8]">22ms</span>
              </div>
            </div>
            {/* OKX */}
            <div className="bg-[#1a1f2d] p-2 rounded-lg flex flex-col items-center justify-center text-center">
              <span className="font-label-caps text-[10px] text-[#dde2f5] font-semibold">OKX</span>
              <div className="flex items-center gap-1 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#4fdbc8]"></span>
                <span className="font-data-mono-sm text-[10px] text-[#4fdbc8]">19ms</span>
              </div>
            </div>
            {/* Bybit */}
            <div className="bg-[#1a1f2d] p-2 rounded-lg flex flex-col items-center justify-center text-center">
              <span className="font-label-caps text-[10px] text-[#dde2f5] font-semibold">BYB</span>
              <div className="flex items-center gap-1 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#4cd7f6]"></span>
                <span className="font-data-mono-sm text-[10px] text-[#4cd7f6]">112ms</span>
              </div>
            </div>
            {/* Coinstore */}
            <div className="bg-[#080e1b] p-2 rounded-lg flex flex-col items-center justify-center text-center opacity-70">
              <span className="font-label-caps text-[10px] text-[#bec8d2]">CS</span>
              <div className="flex items-center gap-1 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#88929b]"></span>
                <span className="font-data-mono-sm text-[9px] text-[#88929b]">MAINT</span>
              </div>
            </div>
            {/* WazirX */}
            <div className="bg-[#080e1b] p-2 rounded-lg flex flex-col items-center justify-center text-center opacity-50">
              <span className="font-label-caps text-[10px] text-[#bec8d2]">WZX</span>
              <div className="flex items-center gap-1 mt-1">
                <span className="font-data-mono-sm text-[9px] text-[#88929b]">SOON</span>
              </div>
            </div>
          </div>
        </div>

        {/* Active Bot Engine Control Console */}
        <div className="bg-[#161b29] p-3.5 rounded-xl shadow-sm space-y-3 border border-[#3e4850]/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${engineActive ? 'bg-[#4fdbc8] animate-ping' : 'bg-[#88929b]'}`}></span>
              <span className="font-headline-md text-headline-md text-[#dde2f5] font-semibold">
                Auto-Arb Engine v2.4
              </span>
            </div>
            <div className="px-2 py-0.5 rounded-full bg-[#242a38] flex items-center gap-1">
              <span className={`w-1.5 h-1.5 rounded-full ${engineActive ? 'bg-[#4fdbc8]' : 'bg-[#88929b]'}`}></span>
              <span className={`font-label-caps text-[10px] font-bold uppercase ${engineActive ? 'text-[#4fdbc8]' : 'text-[#88929b]'}`}>
                {engineActive ? 'ACTIVE' : 'PAUSED'}
              </span>
            </div>
          </div>

          {/* Engine Telemetry Metrics */}
          <div className="grid grid-cols-3 gap-2 bg-[#1a1f2d] p-2.5 rounded-lg border border-[#3e4850]/20">
            <div>
              <span className="font-label-caps text-[10px] text-[#bec8d2] block uppercase">Capital Pool</span>
              <span className="font-data-mono-md text-data-mono-md text-[#dde2f5] font-semibold mt-0.5 block">
                ${capitalPool.toLocaleString()}
              </span>
            </div>
            <div>
              <span className="font-label-caps text-[10px] text-[#bec8d2] block uppercase">Max Slip</span>
              <span className="font-data-mono-md text-data-mono-md text-[#4fdbc8] font-semibold mt-0.5 block">
                ≤ {maxSlip}%
              </span>
            </div>
            <div>
              <span className="font-label-caps text-[10px] text-[#bec8d2] block uppercase">Daily Loss Cap</span>
              <span className="font-data-mono-md text-data-mono-md text-[#ffb4ab] font-semibold mt-0.5 block">
                -${dailyLossCap}.00
              </span>
            </div>
          </div>

          {/* Quick Action Controls */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={handlePauseToggle}
              className={`min-h-[44px] rounded-lg flex items-center justify-center gap-1.5 transition-colors border border-[#3e4850]/30 active:scale-95 ${
                engineActive ? 'bg-[#1a1f2d] hover:bg-[#242a38] text-[#dde2f5]' : 'bg-[#4fdbc8]/20 text-[#4fdbc8]'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">
                {engineActive ? 'pause' : 'play_arrow'}
              </span>
              <span className="font-label-caps text-label-caps">
                {engineActive ? 'Pause' : 'Resume'}
              </span>
            </button>
            <button
              onClick={handleKillLegs}
              className="min-h-[44px] bg-[#1a1f2d] hover:bg-[#93000a]/20 text-[#ffb4ab] active:scale-95 rounded-lg flex items-center justify-center gap-1 transition-colors border border-[#3e4850]/30 px-1"
            >
              <span className="material-symbols-outlined text-[18px]">cancel</span>
              <span className="font-label-caps text-label-caps">Kill Legs</span>
            </button>
            <button
              onClick={() => setShowConfigModal(true)}
              className="min-h-[44px] bg-[#1a1f2d] hover:bg-[#242a38] text-[#89ceff] active:scale-95 rounded-lg flex items-center justify-center gap-1 transition-colors border border-[#3e4850]/30"
            >
              <span className="material-symbols-outlined text-[18px]">tune</span>
              <span className="font-label-caps text-label-caps">Config</span>
            </button>
          </div>
        </div>

        {/* Live Arbitrage Spread Scanner */}
        <div className="space-y-2.5 pt-1">
          <div className="flex items-center justify-between px-0.5">
            <div className="flex items-center gap-2">
              <span className="font-headline-md text-headline-md text-[#dde2f5] font-semibold">
                Executable Spreads
              </span>
              <span className="px-2 py-0.5 rounded-full bg-[#242a38] font-data-mono-sm text-[10px] text-[#4fdbc8] font-bold">
                {spreads.length} Detected
              </span>
            </div>
            <div className="flex items-center gap-1 text-[#bec8d2]">
              <span className="material-symbols-outlined text-[14px] animate-spin text-[#89ceff]">refresh</span>
              <span className="font-data-mono-sm text-[10px]">Continuous Scan</span>
            </div>
          </div>

          {/* Spread Card 1: BTC/USDT Live Executable */}
          {spreads.map((spread) => {
            const isSettled = spread.status === 'settled';
            const isExecuting = executingId === spread.id;

            if (isSettled) {
              return (
                <div
                  key={spread.id}
                  className="bg-[#161b29] p-3.5 rounded-xl shadow-sm border border-[#3e4850]/20 opacity-90"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-[#1a1f2d] flex items-center justify-center font-headline-md text-[14px] text-[#4fdbc8]">
                        {spread.icon}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-headline-md text-headline-md text-[#dde2f5] font-semibold">
                            {spread.pair}
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-[#1a1f2d] font-label-caps text-[9px] text-[#4fdbc8] font-bold">
                            SETTLED
                          </span>
                        </div>
                        <div className="font-data-mono-sm text-[11px] text-[#bec8d2]">
                          {spread.sourceExchange} → {spread.targetExchange} • {spread.settledAgo || 'Just now'}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-data-mono-md text-data-mono-md text-[#4fdbc8] font-bold">
                        +${spread.cleanNetGainUsd.toFixed(2)}
                      </div>
                      <div className="font-data-mono-sm text-[10px] text-[#bec8d2]">
                        {spread.refCode || 'Ref #ARB-90214'}
                      </div>
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={spread.id}
                className="bg-[#161b29] p-3.5 rounded-xl shadow-sm space-y-2.5 border border-[#3e4850]/30"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-8 h-8 rounded-full bg-[#1a1f2d] flex items-center justify-center font-headline-md text-[14px]"
                      style={{ color: spread.iconColor }}
                    >
                      {spread.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-headline-md text-headline-md text-[#dde2f5] font-semibold">
                          {spread.pair}
                        </span>
                        <span className="font-data-mono-sm text-[11px] text-[#bec8d2]">
                          {spread.routeType}
                        </span>
                      </div>
                      <div className="font-data-mono-sm text-[11px] text-[#bec8d2]">
                        {spread.sourceExchange} → {spread.targetExchange}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-data-mono-lg text-data-mono-lg text-[#4fdbc8] font-bold">
                      +{spread.spreadPct}%
                    </div>
                    <div className="font-data-mono-sm text-[11px] text-[#bec8d2]">
                      ${spread.spreadUsd} spread
                    </div>
                  </div>
                </div>

                {/* Route Visualization Pill Strip */}
                <div className="bg-[#1a1f2d] p-2.5 rounded-lg flex items-center justify-between text-center border border-[#3e4850]/20">
                  <div className="flex-1">
                    <span className="font-label-caps text-[9px] text-[#bec8d2] block">
                      BUY {spread.sourceExchange.toUpperCase()}
                    </span>
                    <span className="font-data-mono-sm text-data-mono-sm text-[#dde2f5] font-semibold">
                      ${spread.buyPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="px-2 text-[#89ceff]">
                    <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </div>
                  <div className="flex-1">
                    <span className="font-label-caps text-[9px] text-[#bec8d2] block">
                      SELL {spread.targetExchange.toUpperCase()}
                    </span>
                    <span className="font-data-mono-sm text-data-mono-sm text-[#dde2f5] font-semibold">
                      ${spread.sellPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                {/* Metric Details & Countdown */}
                <div className="flex items-center justify-between pt-1">
                  <div>
                    <span className="font-label-caps text-[10px] text-[#bec8d2] uppercase">
                      Est. Clean Net Gain
                    </span>
                    <div className="font-data-mono-md text-data-mono-md text-[#4fdbc8] font-bold">
                      +${spread.cleanNetGainUsd.toFixed(2)}{' '}
                      <span className="font-body-sm text-[11px] text-[#bec8d2] font-normal">
                        ({spread.cleanNetGainPct}%)
                      </span>
                    </div>
                  </div>

                  {spread.windowSeconds > 0 ? (
                    <div className="flex items-center gap-1.5 bg-[#1a1f2d] px-2 py-1 rounded border border-[#3e4850]/20">
                      <span className="material-symbols-outlined text-[14px] text-[#4cd7f6]">timer</span>
                      <span className="font-data-mono-sm text-[11px] text-[#4cd7f6] font-mono">
                        {windowTimer}s window
                      </span>
                    </div>
                  ) : (
                    <button
                      onClick={onNavigateToTrades}
                      className="min-h-[36px] px-3 bg-[#1a1f2d] hover:bg-[#242a38] text-[#dde2f5] font-label-caps text-label-caps uppercase rounded-lg flex items-center gap-1 transition-colors border border-[#3e4850]/30"
                    >
                      <span>Route Leg</span>
                      <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                    </button>
                  )}
                </div>

                {/* Single Tap Execution Trigger */}
                {spread.windowSeconds > 0 && (
                  <button
                    disabled={isExecuting}
                    onClick={() => handleInstantFill(spread.id)}
                    className="w-full min-h-[44px] bg-[#89ceff] hover:bg-[#c9e6ff] text-[#00344d] font-label-caps text-label-caps uppercase tracking-wider rounded-lg flex items-center justify-center gap-2 font-bold transition-transform active:scale-[0.99] shadow-md"
                  >
                    {isExecuting ? (
                      <>
                        <span className="material-symbols-outlined text-[18px] animate-spin">sync</span>
                        <span>Routing Dual-Exchange Fill...</span>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[18px]">bolt</span>
                        <span>Instant Fill Spread (91/9 Auto-Settled)</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Settlement Verification & 91/9 Protocol Breakdown Card */}
        <div className="bg-[#161b29] p-3.5 rounded-xl shadow-sm space-y-2 border border-[#3e4850]/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px] text-[#4fdbc8]">receipt_long</span>
              <span className="font-headline-md text-headline-md text-[#dde2f5] font-semibold">
                Settlement Proof: 91/9 Rule
              </span>
            </div>
            <span className="font-data-mono-sm text-[10px] text-[#bec8d2]">Order #ARB-90214</span>
          </div>

          <p className="font-body-sm text-body-sm text-[#bec8d2] leading-snug">
            Every profitable arbitrage fill is verified on-chain. Capital never leaves your account; platform and affiliate fees deduct strictly from your service balance.
          </p>

          {/* Ledger Visual Breakdown */}
          <div className="bg-[#1a1f2d] p-3 rounded-lg space-y-2 border border-[#3e4850]/20">
            <div className="flex justify-between items-center text-body-sm">
              <span className="text-[#bec8d2]">Gross Spread Profit</span>
              <span className="font-data-mono-sm text-[#dde2f5] font-semibold">+$15.80 USDT</span>
            </div>
            <div className="flex justify-between items-center text-body-sm">
              <span className="text-[#bec8d2]">Taker & Gas Fees</span>
              <span className="font-data-mono-sm text-[#ffb4ab]">-$1.52 USDT</span>
            </div>
            <div className="flex justify-between items-center text-body-sm pt-1 border-t border-[#3e4850]/30">
              <span className="text-[#dde2f5] font-medium">Net Realized Profit</span>
              <span className="font-data-mono-md text-[#4fdbc8] font-bold">+$14.28 USDT</span>
            </div>

            {/* 91/9 Splitting Visual Matrix */}
            <div className="pt-2 space-y-1.5">
              <div className="w-full bg-[#2f3543] rounded-full h-2 flex overflow-hidden">
                <div className="bg-[#4fdbc8] h-full" style={{ width: '91%' }}></div>
                <div className="bg-[#4cd7f6] h-full" style={{ width: '8%' }}></div>
                <div className="bg-[#89ceff] h-full" style={{ width: '1%' }}></div>
              </div>
              <div className="grid grid-cols-3 gap-1 pt-1">
                <div className="bg-[#161b29] p-1.5 rounded text-center">
                  <span className="font-label-caps text-[9px] text-[#4fdbc8] block font-bold">
                    91% USER KEEP
                  </span>
                  <span className="font-data-mono-sm text-[#dde2f5] font-semibold">+$13.00</span>
                </div>
                <div className="bg-[#161b29] p-1.5 rounded text-center">
                  <span className="font-label-caps text-[9px] text-[#4cd7f6] block font-bold">
                    8% 5-TIER AFF
                  </span>
                  <span className="font-data-mono-sm text-[#dde2f5]">-$1.14</span>
                </div>
                <div className="bg-[#161b29] p-1.5 rounded text-center">
                  <span className="font-label-caps text-[9px] text-[#89ceff] block font-bold">
                    1% ENGINE
                  </span>
                  <span className="font-data-mono-sm text-[#dde2f5]">-$0.14</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-[#bec8d2] pt-0.5">
            <span className="material-symbols-outlined text-[14px] text-[#4fdbc8]">check_circle</span>
            <span className="font-body-sm text-[11px]">$1.28 fee automatically settled from Service Wallet ($48.20 remaining)</span>
          </div>
        </div>

        {/* Institutional Disclaimer Footer Bar */}
        <div className="p-3.5 rounded-xl bg-[#080e1b] text-center space-y-1 border border-[#3e4850]/20">
          <div className="flex items-center justify-center gap-1 text-[#bec8d2]">
            <span className="material-symbols-outlined text-[14px]">shield</span>
            <span className="font-label-caps text-[10px] uppercase tracking-wider font-semibold">
              Zero Direct Withdrawal Permissions Allowed
            </span>
          </div>
          <p className="font-body-sm text-[11px] text-[#88929b] leading-tight">
            ArbSetu operates via encrypted IP-whitelisted REST/WebSocket order routing. Ensure both sides of your trade route have sufficient liquidity prior to enabling automated cycles.
          </p>
        </div>
      </div>

      {/* Engine Config Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl bg-[#1a1f2d] p-4 shadow-2xl border border-[#3e4850]/50 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-headline-md text-headline-md text-[#dde2f5]">Engine Configuration</h3>
              <button
                onClick={() => setShowConfigModal(false)}
                className="text-[#bec8d2] hover:text-[#dde2f5]"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div>
                <label className="font-label-caps text-[10px] text-[#bec8d2] block mb-1">
                  Capital Pool (USDT)
                </label>
                <input
                  type="number"
                  value={capitalPool}
                  onChange={(e) => setCapitalPool(Number(e.target.value))}
                  className="w-full h-10 px-3 rounded bg-[#080e1b] text-[#dde2f5] font-data-mono-sm border border-[#3e4850]/40"
                />
              </div>

              <div>
                <label className="font-label-caps text-[10px] text-[#bec8d2] block mb-1">
                  Max Slippage Tolerance (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={maxSlip}
                  onChange={(e) => setMaxSlip(Number(e.target.value))}
                  className="w-full h-10 px-3 rounded bg-[#080e1b] text-[#dde2f5] font-data-mono-sm border border-[#3e4850]/40"
                />
              </div>

              <div>
                <label className="font-label-caps text-[10px] text-[#bec8d2] block mb-1">
                  Daily Loss Cap (USDT)
                </label>
                <input
                  type="number"
                  value={dailyLossCap}
                  onChange={(e) => setDailyLossCap(Number(e.target.value))}
                  className="w-full h-10 px-3 rounded bg-[#080e1b] text-[#dde2f5] font-data-mono-sm border border-[#3e4850]/40"
                />
              </div>
            </div>

            <button
              onClick={() => {
                setShowConfigModal(false);
                showToast('Engine parameters updated and synced across node relays.');
              }}
              className="w-full py-2.5 rounded-lg bg-[#0ea5e9] text-[#003751] font-bold text-sm"
            >
              Save Parameters
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
