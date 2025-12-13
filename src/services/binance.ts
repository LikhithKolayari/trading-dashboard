import type { BinanceExchangeInfo, BinanceSymbol } from "../types/binance";
import { API_URLS } from "../constants/urls";

// Simple in-memory cache to avoid refetching within the same session
let cachedExchangeInfo: BinanceExchangeInfo | null = null;
let lastFetchTs = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// note: timeout handling implemented in fetchJson via AbortController
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
  const data = await fetchJson<BinanceExchangeInfo>(API_URLS.BINANCE.EXCHANGE_INFO);

  if (!data || !Array.isArray(data.symbols)) {
    throw new Error("Invalid response from Binance");
  }
  cachedExchangeInfo = data;
  lastFetchTs = now;
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
  // Only include symbols that are actively trading by default
  return symbols.map((s) => ({
    label: s.symbol,
    value: s.symbol,
    baseAsset: s.baseAsset,
    quoteAsset: s.quoteAsset,
  }));
}
