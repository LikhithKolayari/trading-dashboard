import DataField from "./DataField";
import Button from "../Button";
import { LuStar, LuStarOff } from "react-icons/lu";
import type { Binance24hrTicker } from "../../types/binance";

interface Props {
  ticker?: Partial<Binance24hrTicker> | null;
  symbol?: string;
  isInWatchlist?: boolean;
  onToggleWatchlist?: () => void;
  disabled?: boolean;
}

export default function PrimaryPriceCard({
  ticker,
  isInWatchlist,
  onToggleWatchlist,
  disabled,
}: Props) {
  const changePercent = Number(ticker?.priceChangePercent);
  const variant = isNaN(changePercent) ? "default" : changePercent >= 0 ? "positive" : "negative";

  return (
    <div
      className="rounded-xl border p-4 h-full"
      style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="text-xs" style={{ color: "var(--color-accent)" }}>
          Primary Price & Change
        </div>
        <div>
          <Button
            variant={isInWatchlist ? "secondary" : "primary"}
            onClick={onToggleWatchlist}
            disabled={!!disabled}
          >
            {isInWatchlist ? (
              <>
                <LuStarOff size={18} />
                <span className="ml-2">Remove</span>
              </>
            ) : (
              <>
                <LuStar size={18} />
                <span className="ml-2">Add to Watchlist</span>
              </>
            )}
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <DataField label="Symbol" value={ticker?.symbol} priority={1} />
        <DataField label="Current Price" value={ticker?.lastPrice} priority={1} variant={variant} />
        <DataField
          label="24hr Change %"
          value={ticker?.priceChangePercent}
          priority={1}
          variant={variant}
        />
        <DataField label="24hr Open" value={ticker?.openPrice} priority={2} />
        <DataField label="24hr Change" value={ticker?.priceChange} priority={2} variant={variant} />
      </div>
    </div>
  );
}
