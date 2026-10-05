import React from 'react';
import { ViewMode } from '../../types';

interface ProfileScreenProps {
  onNavigateToConnectKey: () => void;
  onToggleViewMode: (mode: ViewMode) => void;
  showToast: (msg: string) => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  onNavigateToConnectKey,
  onToggleViewMode,
  showToast
}) => {
  return (
    <div className="flex flex-col w-full pb-28 pt-16 bg-[#0d1320] min-h-screen">
      <div className="p-4 space-y-4 max-w-xl mx-auto w-full">
        {/* User Dossier Card */}
        <div className="bg-[#161b29] rounded-xl p-4 shadow-sm border border-[#3e4850]/30 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-xl bg-[#89ceff] flex items-center justify-center text-[#00344d] font-bold text-2xl shadow-inner">
              <span className="material-symbols-outlined text-[32px]">person</span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-headline-lg-mobile text-headline-lg-mobile text-[#dde2f5] font-bold">
                  AS-882941
                </span>
                <span className="px-2 py-0.5 rounded-full bg-[#4fdbc8]/15 text-[#4fdbc8] text-[10px] font-bold font-mono">
                  VERIFIED TIER 2
                </span>
              </div>
              <span className="font-data-mono-sm text-xs text-[#bec8d2]">j.vander**@quantmatrix.io</span>
              <span className="font-data-mono-sm text-[11px] text-[#89ceff]">Sponsor: AS-104922 (LOCKED)</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#3e4850]/20 font-data-mono-sm text-xs">
            <div className="bg-[#080e1b] p-2 rounded">
              <span className="text-[#88929b] block uppercase text-[10px]">Session Status</span>
              <span className="text-[#4fdbc8] font-semibold">Active • Enclave HSM</span>
            </div>
            <div className="bg-[#080e1b] p-2 rounded">
              <span className="text-[#88929b] block uppercase text-[10px]">Security Clear</span>
              <span className="text-[#89ceff] font-semibold">Dual-Signoff 2FA</span>
            </div>
          </div>
        </div>

        {/* Shortcuts Section */}
        <div className="space-y-2">
          <span className="font-label-caps text-label-caps uppercase text-[#bec8d2] font-semibold px-1">
            Institutional Settings
          </span>

          <div className="bg-[#161b29] rounded-xl shadow-sm border border-[#3e4850]/30 divide-y divide-[#3e4850]/20 overflow-hidden">
            <button
              onClick={onNavigateToConnectKey}
              className="w-full flex items-center justify-between p-3.5 hover:bg-[#1a1f2d] transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[#89ceff] text-[20px]">key</span>
                <div>
                  <div className="font-headline-md text-sm text-[#dde2f5] font-semibold">
                    Exchange API Keys
                  </div>
                  <div className="text-xs text-[#bec8d2]">Zero-Custody IP-whitelisted credentials</div>
                </div>
              </div>
              <span className="material-symbols-outlined text-[18px] text-[#bec8d2]">chevron_right</span>
            </button>

            <button
              onClick={() => onToggleViewMode('desktop')}
              className="w-full flex items-center justify-between p-3.5 hover:bg-[#1a1f2d] transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[#4fdbc8] text-[20px]">terminal</span>
                <div>
                  <div className="font-headline-md text-sm text-[#dde2f5] font-semibold">
                    Launch Terminal CRM
                  </div>
                  <div className="text-xs text-[#bec8d2]">Maker-Checker, Risk Controls, 5-Tier Ledger</div>
                </div>
              </div>
              <span className="material-symbols-outlined text-[18px] text-[#bec8d2]">open_in_new</span>
            </button>

            <button
              onClick={() => showToast('YubiKey 5C NFC Verified & Active.')}
              className="w-full flex items-center justify-between p-3.5 hover:bg-[#1a1f2d] transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[#4cd7f6] text-[20px]">security</span>
                <div>
                  <div className="font-headline-md text-sm text-[#dde2f5] font-semibold">
                    Hardware MFA / 2FA
                  </div>
                  <div className="text-xs text-[#bec8d2]">Air-Gapped YubiKey 5C NFC Attached</div>
                </div>
              </div>
              <span className="text-[11px] font-mono text-[#4fdbc8] bg-[#4fdbc8]/10 px-2 py-0.5 rounded font-bold">
                ENFORCED
              </span>
            </button>

            <button
              onClick={() => showToast('IP Whitelist active: 198.51.100.44, 198.51.100.45, 203.0.113.12')}
              className="w-full flex items-center justify-between p-3.5 hover:bg-[#1a1f2d] transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[#89ceff] text-[20px]">hub</span>
                <div>
                  <div className="font-headline-md text-sm text-[#dde2f5] font-semibold">
                    Dedicated Execution IPs
                  </div>
                  <div className="text-xs text-[#bec8d2]">3 Static Node IPs configured</div>
                </div>
              </div>
              <span className="material-symbols-outlined text-[18px] text-[#bec8d2]">chevron_right</span>
            </button>
          </div>
        </div>

        {/* Session Security */}
        <div className="p-3.5 rounded-xl bg-[#080e1b] border border-[#3e4850]/20 space-y-2 text-center">
          <span className="font-data-mono-sm text-[11px] text-[#88929b] block">
            Cryptographic Enclave: AWS KMS EU-WEST-1 #940
          </span>
          <button
            onClick={() => showToast('Session locked. Cryptographic keys stored in secure enclave.')}
            className="w-full py-2.5 rounded-lg bg-[#242a38] hover:bg-[#2f3543] text-[#dde2f5] text-xs font-bold uppercase transition-all"
          >
            Lock Session
          </button>
        </div>
      </div>
    </div>
  );
};
