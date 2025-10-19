export interface QuoteData {
  id: string;
  createdAt: string; // ISO date string
  depositCoin: string;
  settleCoin: string;
  depositNetwork: string;
  settleNetwork: string;
  expiresAt: string; // ISO date string
  depositAmount: string; // String representation of number
  settleAmount: string; // String representation of number
  rate: string; // String representation of number
  affiliateId: string;
}


interface BaseShiftData {
    id: string;
    createdAt: string;
    depositCoin: string;
    settleCoin: string;
    depositNetwork: string;
    settleNetwork: string;
    depositAddress: string;
    settleAddress: string;
    depositMin: string;
    depositMax: string;
    type: 'fixed' | 'variable';
    expiresAt: string;
    status: string;
    updatedAt: string;
    averageShiftSeconds: string;
    externalId?: string;
    rate: string;
}

export interface FixedShiftData extends BaseShiftData {
    type: 'fixed';
    quoteId: string;
    depositAmount: string;
    settleAmount: string;
}
interface RefundedFixedShiftData extends FixedShiftData {
    refundAddress: string;
}

export interface SettledFixedShift extends FixedShiftData {
    status: 'settled';
    depositHash: string;
    settleHash: string;
    depositReceivedAt: string;
    updatedAt: string;
}

export interface VariableShiftData extends BaseShiftData {
    type: 'variable';
    settleCoinNetworkFee: string; // String representation of number
    networkFeeUsd: string; // String representation of number
}

interface RefundedVariableShiftData extends VariableShiftData {
    refundAddress: string;
}

export interface SettledVariableShift extends VariableShiftData {
    status: 'settled';
    depositAmount: string;
    settleAmount: string;
    depositHash: string;
    settleHash: string;
    depositReceivedAt: string;
    updatedAt: string;
}

interface MultipleVariableShiftData extends VariableShiftData {
    type: 'variable';
    status: 'multiple';
    deposits: Array<{
        updatedAt: string;
        depositHash: string;
        settleHash?: string;
        depositReceivedAt: string;
        depositAmount: string;
        settleAmount?: string;
        rate?: string;
        status: string;
    }>;
}

export type RefundData = RefundedFixedShiftData | RefundedVariableShiftData;

export type ShiftData = FixedShiftData | SettledFixedShift | VariableShiftData | SettledVariableShift | MultipleVariableShiftData | RefundedFixedShiftData | RefundedVariableShiftData;

export interface CheckoutData {
    id: string;
    settleCoin: string;
    settleNetwork: string;
    settleAddress: string;
    settleMemo?: string;
    settleAmount: string;
    updatedAt: string;
    createdAt: string;
    affiliateId?: string;
    successUrl: string;
    cancelUrl: string;
}
