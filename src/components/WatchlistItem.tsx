import type { Binance24hrTicker } from "../types/binance";
import { LuTrash2 } from "react-icons/lu";

export type WatchlistItemProps = {
  symbol: string;
  ticker?: Partial<Binance24hrTicker> | null;
  onSelect?: () => void;
  onRemove?: () => void;
};

function formatPrice(v?: string): string {
  if (!v) return "-";
  const n = Number(v);
  if (!Number.isFinite(n)) return "-";
  // Keep up to 8 decimals but trim trailing zeros
  return n.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 8,
  });
}

function formatPercent(p?: string): string {
  if (!p) return "-";
  const n = Number(p);
  if (!Number.isFinite(n)) return "-";
  return `${n}%`;
}

export default function WatchlistItem({ symbol, ticker, onSelect, onRemove }: WatchlistItemProps) {
  const percent = Number(ticker?.priceChangePercent);
  const isPos = Number.isFinite(percent) && percent >= 0;
  const isNeg = Number.isFinite(percent) && percent < 0;

  return (
    <li className="px-3 py-3 sm:px-4 sm:py-4 hover:bg-white/5 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <button
          type="button"
          className="flex-1 text-left"
          onClick={onSelect}
          title={`View ${symbol}`}
        >
          <div className="flex items-baseline justify-between">
            <span
              className="font-semibold text-white text-base sm:text-lg"
              style={{ letterSpacing: 0.2 }}
            >
              {symbol}
            </span>
            <span
              className={`text-base sm:text-lg font-semibold ${
                isPos ? "text-green-400" : isNeg ? "text-red-400" : "text-gray-400"
              }`}
            >
              {formatPercent(ticker?.priceChangePercent)}
            </span>
          </div>
          <div className="mt-1 text-xs sm:text-sm text-gray-400">
            {formatPrice(ticker?.lastPrice)}
          </div>
        </button>
        <button
          type="button"
          aria-label={`Remove ${symbol} from watchlist`}
          className="text-gray-400 hover:text-red-400 p-1 rounded-md"
          onClick={onRemove}
          title={`Remove ${symbol}`}
        >
          <LuTrash2 size={14} />
        </button>
      </div>
    </li>
  );
}
