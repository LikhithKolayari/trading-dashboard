import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { WebSocketCore } from "../services/websocket";
import { isBinanceTickerEvent } from "../services/websocket";
import type {
  Binance24hrTicker,
  BinanceTickerStreamEvent,
  WebSocketStatus,
} from "../types/binance";

// Allow only uppercase letters and numbers, typical Binance spot symbols
const SYMBOL_REGEX = /^[A-Z0-9]{4,20}$/;

function mapWsToRestShape(e: BinanceTickerStreamEvent): Binance24hrTicker {
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

export interface UseWatchlistStreamResult {
  tickerMap: Record<string, Binance24hrTicker>;
  status: WebSocketStatus;
  error: string | null;
  reconnect: () => void;
  unsubscribeSymbols: (symbols: string[]) => void;
}

/**
 * Dedicated multi-symbol ticker stream hook for the watchlist
 * - Subscribes to <symbol>@ticker for all provided symbols
 * - Automatically unsubscribes when symbols are removed
 */
export function useWatchlistStream(symbols: string[] = []): UseWatchlistStreamResult {
  const normalizedSymbols = useMemo(() => {
    const seen = new Set<string>();
    const result: string[] = [];
    for (const raw of symbols || []) {
      const s = (raw ?? "").trim().toUpperCase();
      if (!s || !SYMBOL_REGEX.test(s)) continue;
      if (!seen.has(s)) {
        seen.add(s);
        result.push(s);
      }
    }
    return result;
  }, [symbols]);

  const streams = useMemo(() => {
    return normalizedSymbols.map((s) => `${s.toLowerCase()}@ticker`);
  }, [normalizedSymbols]);

  // Dedicated WS client for watchlist
  const clientRef = useRef<WebSocketCore | null>(null);
  const [status, setStatus] = useState<WebSocketStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  // Keep a local ticker map keyed by UPPERCASE symbol
  const [tickerMap, setTickerMap] = useState<Record<string, Binance24hrTicker>>({});
  const symbolsSetRef = useRef<Set<string>>(new Set(normalizedSymbols));
  const prevStreamsRef = useRef<string[]>([]);

  // Init client and handlers
  useEffect(() => {
    const client = new WebSocketCore();
    clientRef.current = client;

    const offStatus = client.onStatusChange((s) => {
      setStatus(s);
      if (s === "error") setError("WebSocket error");
      if (s === "open") setError(null);
    });

    const offMessage = client.onMessage((msg) => {
      if (!isBinanceTickerEvent(msg)) return;
      const evt = msg as BinanceTickerStreamEvent;
      const sym = (evt.s || "").toUpperCase();
      if (!symbolsSetRef.current.has(sym)) return;
      const tick = mapWsToRestShape(evt);
      setTickerMap((prev) => ({ ...prev, [sym]: tick }));
    });

    client.connect();

    return () => {
      offMessage();
      offStatus();
      try {
        client.disconnect();
      } catch {
        /* ignore */
      }
      clientRef.current = null;
      prevStreamsRef.current = [];
    };
  }, []);

  // Diff subscriptions when streams change
  useEffect(() => {
    const client = clientRef.current;
    if (!client) return;

    const next = streams;
    const prev = prevStreamsRef.current;

    const toUnsub = prev.filter((s) => !next.includes(s));
    const toSub = next.filter((s) => !prev.includes(s));

    if (toUnsub.length) client.unsubscribe(toUnsub);
    if (toSub.length) client.subscribe(toSub);

    prevStreamsRef.current = next;
  }, [streams]);

  // Prune tickerMap entries when the symbol list changes
  useEffect(() => {
    symbolsSetRef.current = new Set(normalizedSymbols);
    setTickerMap((prev) => {
      const next: Record<string, Binance24hrTicker> = {};
      for (const key of Object.keys(prev)) {
        if (symbolsSetRef.current.has(key)) next[key] = prev[key];
      }
      return next;
    });
  }, [normalizedSymbols]);

  const reconnect = useCallback(() => clientRef.current?.reconnect(), []);

  const unsubscribeSymbols = (toRemove: string[]) => {
    if (!Array.isArray(toRemove) || toRemove.length === 0) return;
    const valid = toRemove
      .map((s) => (s ?? "").trim().toUpperCase())
      .filter((s) => SYMBOL_REGEX.test(s));
    if (!valid.length) return;

    const toStreams = valid.map((s) => `${s.toLowerCase()}@ticker`);
    clientRef.current?.unsubscribe(toStreams);

    // Optimistically remove from map
    setTickerMap((prev) => {
      const next = { ...prev } as Record<string, Binance24hrTicker>;
      for (const s of valid) delete next[s];
      return next;
    });

    // Update prevStreamsRef so future diffs don't resubscribe
    const setToRemove = new Set(toStreams);
    prevStreamsRef.current = prevStreamsRef.current.filter((s) => !setToRemove.has(s));
  };

  return { tickerMap, status, error, reconnect, unsubscribeSymbols };
}
