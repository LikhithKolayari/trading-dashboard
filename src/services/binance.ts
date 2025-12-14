import type {
  BinanceExchangeInfo,
  BinanceSymbol,
  BinanceUIKline,
  KlineRequestParams,
  KlineInterval,
  Binance24hrTicker,
} from "../types/binance";
import { API_URLS } from "../constants/urls";

// Simple in-memory cache to avoid refetching within the same session
let cachedExchangeInfo: BinanceExchangeInfo | null = null;
let lastFetchTs = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// Timeout handling implemented in fetchJson via AbortController
async function fetchJson<T>(
  url: string,
  opts: RequestInit & { timeoutMs?: number } = {}
): Promise<T> {
  const { timeoutMs = 8000, ...rest } = opts;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      ...rest,
      method: "GET",
      headers: {
        Accept: "application/json",
        ...(rest.headers || {}),
      },
      signal: controller.signal,
    });
    const ct = res.headers.get("content-type") || "";
    if (!ct.includes("application/json")) {
      throw new Error("Unexpected content-type from Binance");
    }
    const data = (await res.json()) as T;
    if (!res.ok) {
      throw new Error("Binance request failed");
    }
    return data;
  } finally {
    clearTimeout(id);
  }
}

export async function getExchangeInfo(forceRefresh = false): Promise<BinanceExchangeInfo> {
  const now = Date.now();
  if (!forceRefresh && cachedExchangeInfo && now - lastFetchTs < CACHE_TTL_MS) {
    return cachedExchangeInfo;
  }
  const url = `${API_URLS.BINANCE.BASE}${API_URLS.BINANCE.EXCHANGE_INFO}`;
  const data = await fetchJson<BinanceExchangeInfo>(url);

  if (!data || !Array.isArray(data.symbols)) {
    throw new Error("Invalid response from Binance");
  }
  cachedExchangeInfo = data;
  lastFetchTs = now;
  return data;
}

export async function get24hrTicker(
  symbol: string,
  options: { timeoutMs?: number } = {}
): Promise<Binance24hrTicker> {
  const s = symbol?.trim().toUpperCase();

  const url = new URL(API_URLS.BINANCE.TICKER_24HR, API_URLS.BINANCE.BASE);
  url.searchParams.set("symbol", s);

  const data = await fetchJson<Binance24hrTicker>(url.toString(), {
    timeoutMs: options.timeoutMs ?? 8000,
  });

  // Minimal shape validation
  if (!data || data.symbol !== s || typeof data.lastPrice !== "string") {
    throw new Error("Invalid response from Binance");
  }
  return data;
}

export interface SymbolOption {
  label: string;
  value: string;
  baseAsset: string;
  quoteAsset: string;
}

export async function getTradingSymbolOptions(): Promise<SymbolOption[]> {
  const info = await getExchangeInfo();
  const symbols: BinanceSymbol[] = info.symbols || [];

  return symbols.map((s) => ({
    label: s.symbol,
    value: s.symbol,
    baseAsset: s.baseAsset,
    quoteAsset: s.quoteAsset,
  }));
}

// Allowlist of valid kline intervals per Binance
const ALLOWED_INTERVALS: ReadonlySet<KlineInterval> = new Set([
  "1s",
  "1m",
  "3m",
  "5m",
  "15m",
  "30m",
  "1h",
  "2h",
  "4h",
  "6h",
  "8h",
  "12h",
  "1d",
  "3d",
  "1w",
  "1M",
]);

function validateAndBuildUIKlinesUrl(params: KlineRequestParams): string {
  const { interval, startTime, endTime, limit } = params;
  const symbol = params.symbol?.trim().toUpperCase();

  // Basic symbol validation (alphanumeric only, typical length 4-20)
  if (!symbol || !/^[A-Z0-9]{4,20}$/.test(symbol)) {
    throw new Error("Invalid symbol format");
  }

  // Interval validation via allowlist
  if (!ALLOWED_INTERVALS.has(interval)) {
    throw new Error("Invalid interval");
  }

  // Timestamps validation (milliseconds since epoch)
  const MS_MIN = 1_000_000_000_000;
  if (startTime !== undefined) {
    if (!Number.isInteger(startTime) || startTime < 0 || startTime < MS_MIN) {
      throw new Error("Invalid startTime (must be Unix ms)");
    }
  }
  if (endTime !== undefined) {
    if (!Number.isInteger(endTime) || endTime < 0 || endTime < MS_MIN) {
      throw new Error("Invalid endTime (must be Unix ms)");
    }
  }
  if (startTime !== undefined && endTime !== undefined && startTime > endTime) {
    throw new Error("startTime cannot be greater than endTime");
  }
  // Optional limit validation (Binance caps at 1000)
  if (limit !== undefined) {
    if (!Number.isInteger(limit) || limit < 1 || limit > 1000) {
      throw new Error("Invalid limit (1-1000)");
    }
  }

  const url = new URL(API_URLS.BINANCE.UI_KLINES, API_URLS.BINANCE.BASE);
  url.searchParams.set("symbol", symbol);
  url.searchParams.set("interval", interval);
  if (startTime !== undefined) url.searchParams.set("startTime", String(startTime));
  if (endTime !== undefined) url.searchParams.set("endTime", String(endTime));
  if (limit !== undefined) url.searchParams.set("limit", String(limit));

  return url.toString();
}

/**
 * Fetch Binance UI klines
 * Returns array of 12-element tuples as provided by Binance
 */
export async function getUIKlines(
  params: KlineRequestParams,
  options: { timeoutMs?: number } = {}
): Promise<BinanceUIKline[]> {
  const url = validateAndBuildUIKlinesUrl(params);
  const data = await fetchJson<BinanceUIKline[]>(url, { timeoutMs: options.timeoutMs ?? 8000 });

  if (!Array.isArray(data) || !data.every((d) => Array.isArray(d) && d.length >= 12)) {
    throw new Error("Invalid response from Binance");
  }
  return data;
}

// Transform Binance UI klines (ms timestamps, string prices) into ChartCandle[] (sec timestamps, number prices)
import type { ChartCandle } from "../types/chart";
export function transformKlinesToChartData(uiklines: BinanceUIKline[]): ChartCandle[] {
  if (!Array.isArray(uiklines)) return [];
  return uiklines
    .map((k) => {
      const [openTime, open, high, low, close] = k;
      const timeSec = Math.floor(Number(openTime) / 1000);
      const o = Number.parseFloat(open as string);
      const h = Number.parseFloat(high as string);
      const l = Number.parseFloat(low as string);
      const c = Number.parseFloat(close as string);
      if (
        !Number.isFinite(timeSec) ||
        !Number.isFinite(o) ||
        !Number.isFinite(h) ||
        !Number.isFinite(l) ||
        !Number.isFinite(c)
      ) {
        return null;
      }
      return { time: timeSec, open: o, high: h, low: l, close: c } as ChartCandle;
    })
    .filter((x): x is ChartCandle => x !== null);
}
