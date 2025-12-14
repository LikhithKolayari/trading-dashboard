import { useMemo } from "react";
import { useBinanceStream } from "./useBinanceStream";
import { isBinanceKlineEvent } from "../services/websocket";
import type { KlineInterval, WebSocketStatus, BinanceKlineStreamEvent } from "../types/binance";
import type { ChartCandle } from "../types/chart";

const SYMBOL_REGEX = /^[A-Z0-9]{4,20}$/; // allowlist similar to ticker hook

export interface UseKlineStreamResult {
  kline: {
    candle: ChartCandle;
    closed: boolean;
  } | null;
  loading: boolean;
  error: string | null;
  status: WebSocketStatus;
  reconnect: () => void;
  unsubscribe: (streams: string[]) => void;
  unsubscribeCurrent: () => void;
}

// Convert a BinanceKlineStreamEvent to our ChartCandle shape
function toChartCandle(
  evt: BinanceKlineStreamEvent
): { candle: ChartCandle; closed: boolean } | null {
  if (!evt?.k) return null;
  const k = evt.k;
  const timeSec = Math.floor(k.t / 1000);
  const o = Number.parseFloat(k.o);
  const h = Number.parseFloat(k.h);
  const l = Number.parseFloat(k.l);
  const c = Number.parseFloat(k.c);
  if (
    !Number.isFinite(timeSec) ||
    !Number.isFinite(o) ||
    !Number.isFinite(h) ||
    !Number.isFinite(l) ||
    !Number.isFinite(c)
  ) {
    return null;
  }
  return { candle: { time: timeSec, open: o, high: h, low: l, close: c }, closed: !!k.x };
}

export function useKlineStream(symbol?: string, interval?: KlineInterval): UseKlineStreamResult {
  const normalizedSymbol = useMemo(() => {
    const s = symbol?.trim().toUpperCase() ?? "";
    return SYMBOL_REGEX.test(s) ? s : "";
  }, [symbol]);

  const normalizedInterval = useMemo(
    () => (interval ?? ("" as unknown)) as KlineInterval | "",
    [interval]
  );

  const stream = useMemo(() => {
    if (!normalizedSymbol || !normalizedInterval) return "";
    return `${normalizedSymbol.toLowerCase()}@kline_${normalizedInterval}`;
  }, [normalizedSymbol, normalizedInterval]);

  const streams = useMemo(() => (stream ? [stream] : []), [stream]);

  const { data: raw, status, error, reconnect, unsubscribe } = useBinanceStream<unknown>(streams);

  const kline = useMemo<UseKlineStreamResult["kline"]>(() => {
    if (!raw || !isBinanceKlineEvent(raw)) return null;
    // ensure symbol and interval match current selection
    if (!raw.s || raw.s.toUpperCase() !== normalizedSymbol) return null;
    if (!raw.k?.i || String(raw.k.i) !== String(normalizedInterval)) return null;
    return toChartCandle(raw);
  }, [raw, normalizedSymbol, normalizedInterval]);

  const loading =
    normalizedSymbol !== "" && normalizedInterval !== "" && !kline && status !== "error";

  const unsubscribeCurrent = () => {
    if (!normalizedSymbol || !normalizedInterval) return;
    const s = `${normalizedSymbol.toLowerCase()}@kline_${normalizedInterval}`;
    unsubscribe([s]);
  };

  return { kline, loading, error, status, reconnect, unsubscribe, unsubscribeCurrent };
}
