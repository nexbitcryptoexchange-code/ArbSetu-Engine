export type ViewMode = 'mobile' | 'desktop';

export type MobileTab = 'radar' | 'trades' | 'wallet' | 'network' | 'profile' | 'connect-key';

export type DesktopNav = 
  | 'dashboard'
  | 'withdrawal-queue'
  | 'bot-risk-control'
  | '5-tier-ledger'
  | 'wallet-liabilities'
  | 'exchange-connectors'
  | 'support-crm'
  | 'staff-roles'
  | 'immutable-audit-logs';

export interface ExchangeConnector {
  id: string;
  name: string;
  shortCode: string;
  avatarColor: string;
  status: 'healthy' | 'degraded' | 'maintenance' | 'coming-soon' | 'paused' | 'blocked';
  ping: number;
  lastPingText?: string;
  readData: boolean;
  spotTrade: boolean;
  noWithdraw: boolean;
  allocatedUsdt: number;
  spotAssetAmount: number;
  spotAssetSymbol: string;
  note?: string;
  rateLimitPct?: number;
  rateLimitText?: string;
  errorRate?: string;
  maintenanceNotice?: string;
}

export interface ArbitrageSpread {
  id: string;
  pair: string;
  baseAsset: string;
  quoteAsset: string;
  icon: string;
  iconColor: string;
  routeType: string;
  sourceExchange: string;
  targetExchange: string;
  spreadPct: number;
  spreadUsd: number;
  buyPrice: number;
  sellPrice: number;
  cleanNetGainUsd: number;
  cleanNetGainPct: number;
  windowSeconds: number;
  poolDepth?: string;
  status: 'active' | 'settled' | 'routing';
  settledAgo?: string;
  refCode?: string;
}

export interface WithdrawalRequest {
  id: string;
  timestamp: string;
  userUid: string;
  tier: string;
  kycNote: string;
  grossUsdt: number;
  adminFeeUsdt: number;
  gasUsdt: number;
  gasChain: string;
  netPayoutUsdt: number;
  chain: 'TRC-20' | 'BEP-20';
  destinationAddress: string;
  fullAddress: string;
  accountNote: string;
  slaRemainingText: string;
  slaDeadline: string;
  isUrgentSla: boolean;
  riskScore: number;
  riskFlag?: string;
  riskNote: string;
  makerName: string;
  checkerName?: string;
  status: 'awaiting-maker' | 'awaiting-checker' | 'tx-enclave-signed' | 'completed' | 'held' | 'rejected';
}

export interface LedgerEntry {
  id: string;
  timestamp: string;
  debitAccount: string;
  creditAccount: string;
  asset: string;
  amount: number;
  referenceEntity: string;
  signedBy: string;
  hashProof: string;
  fullHash: string;
}

export interface TierCommission {
  level: number;
  label: string;
  ratePct: number;
  activeCount: number;
  accruedUsdt: number;
  isFixedProtocol?: boolean;
}
