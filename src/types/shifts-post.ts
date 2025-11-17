/** requestQuote */
export interface RequestQuote {
    depositCoin: string;
    depositNetwork: string;
    settleCoin: string;
    settleNetwork: string;
    depositAmount: number;
    settleAmount: number;
    userIp?: string;
}

/** createFixedShift */
export interface CreateFixedShift {
    settleAddress: string;
    quoteId: string;
    settleMemo?: string;
    refundAddress?: string;
    refundMemo?: string;
    externalId?: string;
    userIp?: string;
}

/** createVariableShift */
export interface CreateVariableShift {
    settleAddress: string;
    settleCoin: string;
    settleNetwork: string;
    depositCoin: string;
    depositNetwork: string;
    refundAddress?: string;
    settleMemo?: string;
    refundMemo?: string;
    externalId?: string;
    userIp?: string;
}

/** setRefundAddress */
export interface SetRefundAddress {
    shiftId: string;
    refundAddress: string;
    refundMemo?: string;
}

/** createCheckout */
export interface CreateCheckout {
    settleCoin: string;
    settleNetwork: string;
    settleAmount: number;
    settleAddress: string;
    successUrl: string;
    cancelUrl: string;
    settleMemo?: string;
    userIp?: string;
}