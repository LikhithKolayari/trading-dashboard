import { useMemo } from "react";
import { useBinanceStream } from "./useBinanceStream";
import { isBinanceTickerEvent } from "../services/websocket";
import type {
  Binance24hrTicker,
  BinanceTickerStreamEvent,
  WebSocketStatus,
} from "../types/binance";

const SYMBOL_REGEX = /^[A-Z0-9]{4,20}$/; // basic allowlist

function mapWsToRestShape(e: BinanceTickerStreamEvent): Binance24hrTicker {
  // Direct field mapping from WS (e) to REST shape
  return {
    symbol: e.s,
    priceChange: e.p,
    priceChangePercent: e.P,
    weightedAvgPrice: e.w,
    prevClosePrice: e.x,
    lastPrice: e.c,
    lastQty: e.Q,
    bidPrice: e.b,
    bidQty: e.B,
    askPrice: e.a,
    askQty: e.A,
    openPrice: e.o,
    highPrice: e.h,
    lowPrice: e.l,
    volume: e.v,
    quoteVolume: e.q,
    openTime: e.O,
    closeTime: e.C,
    firstId: e.F,
    lastId: e.L,
    count: e.n,
  };
}

export interface UseTickerStreamResult {
  ticker: Binance24hrTicker | null;
  loading: boolean;
  error: string | null;
  status: WebSocketStatus;
  isStale: boolean; // true if disconnected but still showing last known data
  reconnect: () => void;
  unsubscribe: (streams: string[]) => void; // pass-through
  unsubscribeCurrent: () => void; // convenience: unsub current symbol stream
}

export function useTickerStream(symbol?: string): UseTickerStreamResult {
  // Validate and normalize symbol
  const normalizedSymbol = useMemo(() => {
    const s = symbol?.trim().toUpperCase() ?? "";
    return SYMBOL_REGEX.test(s) ? s : "";
  }, [symbol]);

  const stream = useMemo(() => {
    return normalizedSymbol ? `${normalizedSymbol.toLowerCase()}@ticker` : "";
  }, [normalizedSymbol]);

  const streams = useMemo(() => (stream ? [stream] : []), [stream]);

  const { data: raw, status, error, reconnect, unsubscribe } = useBinanceStream<unknown>(streams);

  // Derive ticker directly from the latest WS message without local state
  const ticker = useMemo<Binance24hrTicker | null>(() => {
    if (!raw || !isBinanceTickerEvent(raw)) return null;
    // Extra guard: ensure the event belongs to current symbol
    if (!raw.s || raw.s.toUpperCase() !== normalizedSymbol) return null;
    return mapWsToRestShape(raw);
  }, [raw, normalizedSymbol]);

  const isStale = !!ticker && status !== "open";
  const loading = normalizedSymbol !== "" && !ticker && status !== "error";

  const unsubscribeCurrent = () => {
    if (!normalizedSymbol) return;
    const s = `${normalizedSymbol.toLowerCase()}@ticker`;
    unsubscribe([s]);
  };

  return { ticker, loading, error, status, isStale, reconnect, unsubscribe, unsubscribeCurrent };
}
