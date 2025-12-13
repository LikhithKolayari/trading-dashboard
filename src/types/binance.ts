export interface BinanceRateLimit {
  rateLimitType?: string;
  interval?: string;
  intervalNum?: number;
  limit?: number;
}

export interface BinanceSymbol {
  symbol: string;
  status: string;
  baseAsset: string;
  baseAssetPrecision: number;
  quoteAsset: string;
  quoteAssetPrecision: number;
  // other fields omitted
}

export interface BinanceExchangeInfo {
  timezone: string;
  serverTime: number;
  rateLimits?: BinanceRateLimit[];
  exchangeFilters?: unknown[];
  symbols: BinanceSymbol[];
  sors?: unknown[];
}
