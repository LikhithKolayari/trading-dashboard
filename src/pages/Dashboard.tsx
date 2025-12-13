import { useEffect, useState } from "react";
import Button from "../components/Button";
import { useAuth } from "../context/useAuth";
import SymbolSelect from "../components/SymbolSelect";
import { LuLogOut } from "react-icons/lu";
import PrimaryPriceCard from "../components/TradingCards/PrimaryPriceCard";
import ExecutionDepthCard from "../components/TradingCards/ExecutionDepthCard";
import VolatilityRangeCard from "../components/TradingCards/VolatilityRangeCard";
import TradeActivityCard from "../components/TradingCards/TradeActivityCard";
import { useTickerStream } from "../hooks/useTickerStream";
import { get24hrTicker } from "../services/binance";
import type { Binance24hrTicker } from "../types/binance";

export default function Dashboard() {
  const { user, logout } = useAuth();

  const onLogout = async () => {
    await logout();
  };

  const [symbol, setSymbol] = useState<string>("");
  const {
    ticker: wsTicker,
    loading: wsLoading,
    error: wsError,
    isStale,
    status,
    reconnect,
  } = useTickerStream(symbol);

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
              <div className="w-64">
                <SymbolSelect value={symbol} onChange={setSymbol} />
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
              <PrimaryPriceCard ticker={ticker} />
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
              <div className="p-4 text-gray-400 text-sm">Chart</div>
              <div className="h-[380px] relative">
                {/* Simple placeholder curve background */}
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(180deg, rgba(50,108,255,0.15) 0%, rgba(50,108,255,0.04) 50%, rgba(0,0,0,0) 100%)",
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-gray-500">Chart Placeholder</span>
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
                  Watchlist
                </h3>
              </div>
              {/* Placeholder list */}
              <ul className="divide-y" style={{ borderColor: "var(--color-border)" }}>
                {Array.from({ length: 8 }).map((_, idx) => (
                  <li key={idx} className="px-4 py-3 flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-gray-200 font-medium">—</span>
                      <span className="text-xs text-gray-400">—</span>
                    </div>
                    <span className="text-xs text-gray-500">0.00%</span>
                  </li>
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
