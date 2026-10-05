import React, { useState } from 'react';
import { ArbitrageSpread } from '../../types';
import { INITIAL_SPREADS } from '../../data/mockData';

interface TradesScreenProps {
  showToast: (msg: string) => void;
}

export const TradesScreen: React.FC<TradesScreenProps> = ({ showToast }) => {
  const [spreads, setSpreads] = useState<ArbitrageSpread[]>(INITIAL_SPREADS);
  const [activeLeg, setActiveLeg] = useState<'all' | 'open' | 'settled'>('all');
  const [isRouting, setIsRouting] = useState(false);

  const handleExecuteTrip = (spread: ArbitrageSpread) => {
    setIsRouting(true);
    showToast(`Executing Triangular Route: BUY ${spread.sourceExchange} -> SELL ${spread.targetExchange}...`);

    setTimeout(() => {
      setIsRouting(false);
      showToast(`Trip complete! Net gain +$${spread.cleanNetGainUsd.toFixed(2)} USDT settled to Ledger.`);
      setSpreads(prev => prev.map(s => s.id === spread.id ? { ...s, status: 'settled', settledAgo: 'Just now' } : s));
    }, 1400);
  };

  return (
    <div className="flex flex-col w-full pb-28 pt-16 bg-[#0d1320] min-h-screen">
      {/* Top telemetry banner */}
      <div className="px-4 py-2.5 bg-[#080e1b] flex items-center justify-between border-b border-[#1e293b]/40">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#4fdbc8] animate-pulse"></span>
          <span className="font-label-caps text-label-caps text-[#dde2f5] uppercase font-bold">
            Live Order Books Sync
          </span>
        </div>
        <span className="font-data-mono-sm text-[11px] text-[#89ceff]">Sub-10ms Cross-DEX Stream</span>
      </div>

      <div className="p-4 space-y-3 max-w-xl mx-auto w-full">
        {/* Execution Summary Bar */}
        <div className="grid grid-cols-3 gap-2 bg-[#161b29] p-3 rounded-xl border border-[#3e4850]/30">
          <div className="flex flex-col">
            <span className="font-label-caps text-[10px] text-[#88929b] uppercase">24H Trades</span>
            <span className="font-data-mono-lg text-data-mono-lg text-[#dde2f5] font-bold">142</span>
          </div>
          <div className="flex flex-col">
            <span className="font-label-caps text-[10px] text-[#88929b] uppercase">Avg Net Slip</span>
            <span className="font-data-mono-lg text-data-mono-lg text-[#4fdbc8] font-bold">0.024%</span>
          </div>
          <div className="flex flex-col">
            <span className="font-label-caps text-[10px] text-[#88929b] uppercase">Total Realized</span>
            <span className="font-data-mono-lg text-data-mono-lg text-[#89ceff] font-bold">+$1,842.60</span>
          </div>
        </div>

        {/* Filter pills */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveLeg('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeLeg === 'all'
                ? 'bg-[#0ea5e9] text-[#003751]'
                : 'bg-[#1a1f2d] text-[#bec8d2] hover:bg-[#242a38]'
            }`}
          >
            All Pairs (3)
          </button>
          <button
            onClick={() => setActiveLeg('open')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeLeg === 'open'
                ? 'bg-[#0ea5e9] text-[#003751]'
                : 'bg-[#1a1f2d] text-[#bec8d2] hover:bg-[#242a38]'
            }`}
          >
            Open Spreads (2)
          </button>
          <button
            onClick={() => setActiveLeg('settled')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeLeg === 'settled'
                ? 'bg-[#0ea5e9] text-[#003751]'
                : 'bg-[#1a1f2d] text-[#bec8d2] hover:bg-[#242a38]'
            }`}
          >
            Settled (1)
          </button>
        </div>

        {/* Spreads List */}
        <div className="space-y-3">
          {spreads
            .filter(s => activeLeg === 'all' ? true : activeLeg === 'open' ? s.status === 'active' : s.status === 'settled')
            .map((spread) => (
              <div
                key={spread.id}
                className="bg-[#161b29] rounded-xl p-4 shadow-sm border border-[#3e4850]/30 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-10 h-10 rounded-xl bg-[#1a1f2d] flex items-center justify-center font-bold text-lg"
                      style={{ color: spread.iconColor }}
                    >
                      {spread.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-headline-md text-headline-md text-[#dde2f5] font-semibold">
                          {spread.pair}
                        </span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          spread.status === 'settled'
                            ? 'bg-[#4fdbc8]/15 text-[#4fdbc8]'
                            : 'bg-[#0ea5e9]/20 text-[#89ceff]'
                        }`}>
                          {spread.status.toUpperCase()}
                        </span>
                      </div>
                      <span className="font-data-mono-sm text-[11px] text-[#bec8d2]">
                        {spread.sourceExchange} → {spread.targetExchange} • Depth: {spread.poolDepth || '$18.4k'}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-data-mono-lg text-data-mono-lg text-[#4fdbc8] font-bold">
                      +{spread.spreadPct}%
                    </span>
                    <span className="font-data-mono-sm text-[11px] text-[#bec8d2] block">
                      ${spread.spreadUsd} spread
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 bg-[#080e1b] p-2.5 rounded-lg border border-[#3e4850]/20 font-data-mono-sm text-xs">
                  <div>
                    <span className="text-[#88929b] block uppercase text-[10px]">Buy {spread.sourceExchange}</span>
                    <span className="text-[#dde2f5] font-semibold">${spread.buyPrice.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-[#88929b] block uppercase text-[10px]">Sell {spread.targetExchange}</span>
                    <span className="text-[#dde2f5] font-semibold">${spread.sellPrice.toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div>
                    <span className="text-[10px] text-[#bec8d2] font-label-caps uppercase block">Net Yield</span>
                    <span className="font-data-mono-md text-data-mono-md text-[#4fdbc8] font-bold">
                      +${spread.cleanNetGainUsd.toFixed(2)} USDT
                    </span>
                  </div>

                  <button
                    disabled={isRouting || spread.status === 'settled'}
                    onClick={() => handleExecuteTrip(spread)}
                    className={`min-h-[40px] px-4 rounded-lg font-headline-md text-xs font-bold uppercase transition-all shadow-sm ${
                      spread.status === 'settled'
                        ? 'bg-[#242a38] text-[#88929b] cursor-default'
                        : 'bg-[#89ceff] hover:bg-[#c9e6ff] text-[#00344d] active:scale-95'
                    }`}
                  >
                    {spread.status === 'settled' ? 'Settled' : 'Execute Trip Route'}
                  </button>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};
