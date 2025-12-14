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
  spread: number;
  openTimeHuman: string; // YYYY-MM-DD HH:MM:SS UTC
  closeTimeHuman: string; // YYYY-MM-DD HH:MM:SS UTC
}

export interface BinanceTickerStreamEvent {
  e: "24hrTicker"; // Event type
  E: number; // Event time
  s: string; // Symbol, e.g., "BTCUSDT"
  p: string; // Price change
  P: string; // Price change percent
  w: string; // Weighted average price
  x: string; // First trade(F)-1 price (first trade before the 24hr rolling window)
  c: string; // Last price
  Q: string; // Last quantity
  b: string; // Best bid price
  B: string; // Best bid quantity
  a: string; // Best ask price
  A: string; // Best ask quantity
  o: string; // Open price
  h: string; // High price
  l: string; // Low price
  v: string; // Total traded base asset volume
  q: string; // Total traded quote asset volume
  O: number; // Statistics open time
  C: number; // Statistics close time
  F: number; // First trade ID
  L: number; // Last trade ID
  n: number; // Total number of trades
}

// Kline stream event (matches Binance WS payload for kline streams)
export interface BinanceKlineStreamEvent {
  e: "kline"; // Event type
  E: number; // Event time
  s: string; // Symbol
  k: {
    t: number; // Kline start time (ms)
    T: number; // Kline close time (ms)
    s: string; // Symbol
    i: string; // Interval (e.g., "1h")
    f: number; // First trade ID
    L: number; // Last trade ID
    o: string; // Open price
    c: string; // Close price
    h: string; // High price
    l: string; // Low price
    v: string; // Base asset volume
    n: number; // Number of trades
    x: boolean; // Is this kline closed?
    q: string; // Quote asset volume
    V: string; // Taker buy base asset volume
    Q: string; // Taker buy quote asset volume
    B: string; // Ignore
  };
}

export type WebSocketStatus = "idle" | "connecting" | "open" | "closing" | "closed" | "error";

// Wrapper for Binance combined stream responses: { stream, data }
export interface BinanceStreamResponse<T = unknown> {
  stream: string;
  data: T;
}
