interface TokenDetails {
    [network: string]: NetworkDetails;
}
interface NetworkDetails {
    contractAddress: string;
    decimals: number;
}
export interface Coins {
    networks: string[];
    coin: string;
    mainnet?: string;
    name: string;
    hasMemo?: boolean;
    fixedOnly: string[] | boolean;
    variableOnly: string[] | boolean;
    tokenDetails?: TokenDetails;
    networksWithMemo: string[];
    depositOffline: string[] | boolean;
    settleOffline: string[] | boolean;
}
export interface Permissions {
    createShift: boolean;
}
export interface PairData {
    depositCoin: string;
    settleCoin: string;
    depositNetwork: string;
    settleNetwork: string;
    min: string;
    max: string;
    rate: string;
}
export interface RecentShiftData {
    createdAt: string;
    depositCoin: string;
    depositNetwork: string;
    depositAmount: string;
    settleCoin: string;
    settleNetwork: string;
    settleAmount: string;
}
export interface XaiStatsData {
    totalSupply: number;
    circulatingSupply: number;
    numberOfStakers: number;
    latestAnnualPercentageYield: string;
    latestDistributedXai: string;
    totalStaked: string;
    averageAnnualPercentageYield: string;
    totalValueLocked: string;
    totalValueLockedRatio: string;
    xaiPriceUsd: string;
    svxaiPriceUsd: string;
    svxaiPriceXai: string;
}
export interface AccountData {
    id: string;
    lifetimeStakingRewards: string;
    unstaking: string;
    staked: string;
    available: string;
    totalBalance: string;
}
export {};
//# sourceMappingURL=types.d.ts.map