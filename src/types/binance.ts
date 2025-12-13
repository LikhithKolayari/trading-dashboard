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

// Kline-related types
export type KlineInterval =
  | "1s"
  | "1m"
  | "3m"
  | "5m"
  | "15m"
  | "30m"
  | "1h"
  | "2h"
  | "4h"
  | "6h"
  | "8h"
  | "12h"
  | "1d"
  | "3d"
  | "1w"
  | "1M";

export type BinanceUIKline = [
  openTime: number,
  open: string,
  high: string,
  low: string,
  close: string,
  volume: string,
  closeTime: number,
  quoteVolume: string,
  trades: number,
  takerBuyBase: string,
  takerBuyQuote: string,
  ignore: string
];

export interface KlineRequestParams {
  symbol: string;
  interval: KlineInterval;
  startTime?: number; // Unix epoch in milliseconds
  endTime?: number; // Unix epoch in milliseconds
  limit?: number;
}
export interface Binance24hrTicker {
  symbol: string;
  priceChange: string;
  priceChangePercent: string;
  weightedAvgPrice: string;
  prevClosePrice: string;
  lastPrice: string;
  lastQty: string;
  bidPrice: string;
  bidQty: string;
  askPrice: string;
  askQty: string;
  openPrice: string;
  highPrice: string;
  lowPrice: string;
  volume: string;
  quoteVolume: string;
  openTime: number;
  closeTime: number;
  firstId: number;
  lastId: number;
  count: number;
}

export interface TickerComputed {
  spread: number; // askPrice - bidPrice
  openTimeHuman: string; // YYYY-MM-DD HH:MM:SS UTC
  closeTimeHuman: string; // YYYY-MM-DD HH:MM:SS UTC
}
