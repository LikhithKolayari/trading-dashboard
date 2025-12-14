import { useEffect, useMemo, useState } from "react";
import Button from "../components/Button";
import { useAuth } from "../context/useAuth";
import SymbolSelect from "../components/SymbolSelect";
import { LuLogOut } from "react-icons/lu";

import PrimaryPriceCard from "../components/TradingCards/PrimaryPriceCard";
import ExecutionDepthCard from "../components/TradingCards/ExecutionDepthCard";
import VolatilityRangeCard from "../components/TradingCards/VolatilityRangeCard";
import TradeActivityCard from "../components/TradingCards/TradeActivityCard";
import { useTickerStream } from "../hooks/useTickerStream";
import { useKlineStream } from "../hooks/useKlineStream";
import { get24hrTicker } from "../services/binance";
import type { Binance24hrTicker, KlineInterval } from "../types/binance";
import CandlestickChart from "../components/CandlestickChart";
import IntervalSelect from "../components/IntervalSelect";
import { getUIKlines, transformKlinesToChartData } from "../services/binance";
import type { ChartCandle } from "../types/chart";
import { addToWatchlist, getWatchlist, removeFromWatchlist } from "../services/api";
import { useToast } from "../context/ToastContext";
import WatchlistItem from "../components/WatchlistItem";
import { useWatchlistStream } from "../hooks/useWatchlistStream";

function getErrorMessage(err: unknown): string {
  if (err && typeof err === "object" && "message" in err) {
    const m = (err as { message?: unknown }).message;
    if (typeof m === "string") return m;
  }
  return "Action failed";
}

export default function Dashboard() {
  const { user, logout } = useAuth();

  const onLogout = async () => {
    await logout();
  };

  const [symbol, setSymbol] = useState<string>("");
  const [watchlist, setWatchlist] = useState<string[]>([]);
  // Dedicated WS stream for watchlist tickers
  const { tickerMap, unsubscribeSymbols } = useWatchlistStream(watchlist);
  const { show: showToast } = useToast();
  const {
    ticker: wsTicker,
    loading: wsLoading,
    error: wsError,
    isStale,
    status,
    reconnect,
  } = useTickerStream(symbol);

  // Kline chart state
  const [interval, setInterval] = useState<KlineInterval>("1h");
  const [klines, setKlines] = useState<ChartCandle[]>([]);
  const [klinesLoading, setKlinesLoading] = useState<boolean>(false);
  const [klinesError, setKlinesError] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [noMoreData, setNoMoreData] = useState<boolean>(false);

  // Live kline stream for real-time chart updates
  const { kline: liveKline } = useKlineStream(symbol, interval);

  // Initial static data fetch on symbol change
  const [initialTicker, setInitialTicker] = useState<Binance24hrTicker | null>(null);
  const [restLoading, setRestLoading] = useState<boolean>(false);
  const [restError, setRestError] = useState<string | null>(null);
  const SYMBOL_REGEX = /^[A-Z0-9]{4,20}$/; // match WS hook allowlist

  useEffect(() => {
    let cancelled = false;
    setInitialTicker(null);
    setRestError(null);

    const s = (symbol || "").trim().toUpperCase();
    if (!s || !SYMBOL_REGEX.test(s)) {
      setRestLoading(false);
      return;
    }

    setRestLoading(true);
    (async () => {
      try {
        const data = await get24hrTicker(s);
        if (!cancelled) setInitialTicker(data);
      } catch {
        if (!cancelled) setRestError("Failed to load initial ticker");
      } finally {
        if (!cancelled) setRestLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [symbol]);

  // Initial watchlist fetch
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await getWatchlist();
        if (!cancelled) setWatchlist(Array.isArray(data.symbols) ? data.symbols : []);
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const isInWatchlist = useMemo(() => {
    const s = (symbol || "").trim().toUpperCase();
    if (!s) return false;
    return watchlist.includes(s);
  }, [symbol, watchlist]);

  const handleAddRemoveWatchlist = async () => {
    const s = (symbol || "").trim().toUpperCase();
    if (!s || !SYMBOL_REGEX.test(s)) return;
    try {
      if (isInWatchlist) {
        const res = await removeFromWatchlist(s);
        setWatchlist(res.symbols || []);
        showToast(`Removed ${s} from watchlist`, "success");
      } else {
        const res = await addToWatchlist(s);
        setWatchlist(res.symbols || []);
        showToast(`Added ${s} to watchlist`, "success");
      }
    } catch (err: unknown) {
      const msg = getErrorMessage(err);
      if (msg.toLowerCase().includes("limit")) {
        showToast(
          "Watchlist limit reached (5/5). Please remove a symbol to add a new one.",
          "error"
        );
      } else if (msg.toLowerCase().includes("already")) {
        showToast(`${s} is already in your watchlist`, "info");
      } else {
        showToast(msg, "error");
      }
    }
  };

  // Fetch klines whenever symbol or interval changes
  useEffect(() => {
    let cancelled = false;
    setKlines([]);
    setKlinesError(null);
    setNoMoreData(false);

    const s = (symbol || "").trim().toUpperCase();
    if (!s || !SYMBOL_REGEX.test(s)) {
      setKlinesLoading(false);
      return;
    }

    setKlinesLoading(true);
    (async () => {
      try {
        const LIMIT = 500;
        const raw = await getUIKlines({ symbol: s, interval, limit: LIMIT });
        const transformed = transformKlinesToChartData(raw);
        if (!cancelled) {
          setKlines(transformed);
          if (raw.length < LIMIT) setNoMoreData(true);
        }
      } catch {
        if (!cancelled) setKlinesError("Failed to load klines");
      } finally {
        if (!cancelled) setKlinesLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [symbol, interval]);

  // Merge live kline updates into chart data
  useEffect(() => {
    if (!liveKline) return;
    setKlines((prev) => {
      const { candle } = liveKline;
      if (!Array.isArray(prev) || prev.length === 0) {
        return [candle];
      }
      const last = prev[prev.length - 1];
      if (candle.time === last.time) {
        const next = prev.slice();
        next[next.length - 1] = candle; // update in-place last bar
        return next;
      }
      if (candle.time > last.time) {
        return [...prev, candle]; // append new bar
      }
      // If candle is older than our latest, ignore (historical fetch handles older data)
      return prev;
    });
  }, [liveKline]);

  // Prefer WS live updates; fall back to initial REST data
  const ticker = wsTicker ?? initialTicker;
  const loading = !ticker && (restLoading || wsLoading);
  const error = wsError ?? restError;

  if (!user) return null;

  const msToUtc = (ts: number): string => {
    try {
      const d = new Date(ts);
      return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(
        d.getUTCDate()
      ).padStart(2, "0")} ${String(d.getUTCHours()).padStart(2, "0")}:${String(
        d.getUTCMinutes()
      ).padStart(2, "0")}:${String(d.getUTCSeconds()).padStart(2, "0")} UTC`;
    } catch {
      return "";
    }
  };

  const bid = ticker?.bidPrice ? parseFloat(ticker.bidPrice) : NaN;
  const ask = ticker?.askPrice ? parseFloat(ticker.askPrice) : NaN;
  const spread = Number.isFinite(bid) && Number.isFinite(ask) ? +(ask - bid) : undefined;
  const openTimeHuman = typeof ticker?.openTime === "number" ? msToUtc(ticker.openTime) : undefined;
  const closeTimeHuman =
    typeof ticker?.closeTime === "number" ? msToUtc(ticker.closeTime) : undefined;

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--color-page-bg)" }}>
      {/* Top Navigation */}
      <header
        className="w-full border-b sticky top-0 z-10"
        style={{ backgroundColor: "var(--color-surface-alt)", borderColor: "var(--color-border)" }}
      >
        <div className="h-1" style={{ backgroundColor: "#646cff" }} />
        <div className="px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/vite.svg" alt="Vite logo" className="h-8 w-8" />
            <span
              className="brand-vx text-[22px] sm:text-2xl font-bold tracking-tight text-white"
              style={{
                fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
              }}
            >
              Vite
              <span className="font-extrabold" style={{ color: "#646cff" }}>
                X
              </span>
            </span>
          </div>
          <div className="flex items-center gap-3 text-[15px] sm:text-base">
            <Button
              variant="secondary"
              onClick={onLogout}
              className="bg-transparent hover:bg-transparent"
            >
              <LuLogOut size={20} />
              <span className="ml-2">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-6 py-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Left: Market Summary & Chart */}
          <section className="col-span-12 lg:col-span-9">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl md:text-3xl font-semibold text-white">Market Summary</h2>
              <div className="flex items-center gap-3">
                <div className="w-64">
                  <SymbolSelect value={symbol} onChange={setSymbol} />
                </div>
              </div>
            </div>

            <div className="-mt-1 mb-5">
              <p className="text-gray-400">
                Welcome back,{" "}
                <span className="font-semibold" style={{ color: "var(--color-accent)" }}>
                  {user.firstName} {user.lastName}
                </span>
              </p>
              {!symbol && (
                <p className="text-xs text-gray-500 mt-1">
                  Select a symbol to load live ticker data.
                </p>
              )}
            </div>

            {/* Cards 1 & 2 above the chart */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <PrimaryPriceCard
                ticker={ticker}
                isInWatchlist={isInWatchlist}
                onToggleWatchlist={handleAddRemoveWatchlist}
                disabled={
                  !symbol ||
                  !SYMBOL_REGEX.test((symbol || "").trim().toUpperCase()) ||
                  (!isInWatchlist && watchlist.length >= 5)
                }
              />
              <ExecutionDepthCard ticker={ticker} spread={spread} />
            </div>

            {/* Chart */}
            <div
              className="rounded-xl border shadow-inner overflow-hidden"
              style={{
                backgroundColor: "var(--color-surface)",
                borderColor: "var(--color-border)",
              }}
            >
              <div className="p-4 text-gray-400 text-sm flex items-center justify-between gap-4">
                <h3 className="font-semibold text-base" style={{ color: "var(--color-accent)" }}>
                  Chart
                </h3>
                <div className="w-40">
                  <IntervalSelect value={interval} onChange={setInterval} />
                </div>
              </div>
              <div className="px-4 pb-4">
                <div className="relative">
                  {klinesLoading && (
                    <div className="absolute left-2 top-2 text-xs text-gray-400">
                      Loading klines...
                    </div>
                  )}
                  {klinesError && (
                    <div className="absolute left-2 top-2 text-xs text-red-400">{klinesError}</div>
                  )}
                  <CandlestickChart
                    data={klines}
                    height={380}
                    className="w-full"
                    onLoadMore={async () => {
                      if (isLoadingMore || noMoreData) return;
                      const s = (symbol || "").trim().toUpperCase();
                      if (!s || !SYMBOL_REGEX.test(s)) return;
                      if (!klines.length) return;

                      try {
                        setIsLoadingMore(true);
                        const earliestSec = Math.min(...klines.map((k) => k.time));
                        // Use endTime just before earliest to avoid duplicate boundary
                        const endTime = earliestSec * 1000 - 1;
                        const LIMIT = 500;
                        const raw = await getUIKlines({
                          symbol: s,
                          interval,
                          endTime,
                          limit: LIMIT,
                        });
                        const older = transformKlinesToChartData(raw);
                        if (!older.length) {
                          setNoMoreData(true);
                          return;
                        }
                        setKlines((prev) => {
                          // Merge unique by time and keep ascending order
                          const seen = new Set<number>();
                          const merged = [...older, ...prev].filter((c) => {
                            if (seen.has(c.time)) return false;
                            seen.add(c.time);
                            return true;
                          });
                          merged.sort((a, b) => a.time - b.time);
                          return merged;
                        });
                        if (raw.length < LIMIT) setNoMoreData(true);
                      } catch {
                        // Soft-fail: keep UI responsive
                      } finally {
                        setIsLoadingMore(false);
                      }
                    }}
                    isLoadingMore={isLoadingMore}
                  />
                </div>
              </div>
            </div>

            {/* Cards 3 & 4 below the chart */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <VolatilityRangeCard ticker={ticker} />
              <TradeActivityCard
                ticker={ticker}
                openTimeHuman={openTimeHuman}
                closeTimeHuman={closeTimeHuman}
              />
            </div>
          </section>

          {/* Right: Watchlist */}
          <aside className="col-span-12 lg:col-span-3">
            <div
              className="rounded-xl border"
              style={{
                backgroundColor: "var(--color-surface)",
                borderColor: "var(--color-border)",
              }}
            >
              <div className="px-4 py-3 border-b" style={{ borderColor: "var(--color-border)" }}>
                <h3 className="font-semibold" style={{ color: "var(--color-accent)" }}>
                  Watchlist <span className="text-xs text-gray-400">({watchlist.length}/5)</span>
                </h3>
              </div>
              <ul>
                {watchlist.length === 0 && (
                  <li className="px-4 py-3 text-sm text-gray-400">No symbols yet</li>
                )}
                {watchlist.map((s) => (
                  <WatchlistItem
                    key={s}
                    symbol={s}
                    ticker={tickerMap[s]}
                    onSelect={() => setSymbol(s)}
                    onRemove={async () => {
                      try {
                        unsubscribeSymbols([s]);
                        const res = await removeFromWatchlist(s);
                        setWatchlist(res.symbols || []);
                        showToast(`Removed ${s} from watchlist`, "success");
                      } catch (err: unknown) {
                        const msg = getErrorMessage(err) || "Failed to remove";
                        showToast(msg, "error");
                      }
                    }}
                  />
                ))}
              </ul>
            </div>
          </aside>
        </div>

        {/* Status Area */}
        <div className="mt-4 text-sm">
          {loading && <p className="text-gray-400">Loading ticker...</p>}
          {error && <p className="text-red-400">{error}</p>}
          {isStale && (
            <div className="text-yellow-400">
              Connection lost. Showing last known data. Attempting to reconnect...
              <button
                type="button"
                onClick={reconnect}
                className="ml-2 text-xs px-2 py-0.5 rounded border"
                style={{ borderColor: "var(--color-border)", color: "var(--color-accent)" }}
              >
                Reconnect
              </button>
              <span className="ml-2 text-gray-500">Status: {status}</span>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
