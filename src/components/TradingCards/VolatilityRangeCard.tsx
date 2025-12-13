import DataField from "./DataField";
import type { Binance24hrTicker } from "../../types/binance";

interface Props {
  ticker?: Partial<Binance24hrTicker> | null;
}

export default function VolatilityRangeCard({ ticker }: Props) {
  return (
    <div
      className="rounded-xl border p-4 h-full"
      style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="text-xs" style={{ color: "var(--color-accent)" }}>
          Volatility & Range
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <DataField label="24hr High" value={ticker?.highPrice} priority={1} />
        <DataField label="24hr Low" value={ticker?.lowPrice} priority={1} />
        <DataField label="Base Volume (ETH)" value={ticker?.volume} priority={2} />
        <DataField label="Quote Volume (BTC)" value={ticker?.quoteVolume} priority={2} />
        <DataField label="VWAP" value={ticker?.weightedAvgPrice} priority={2} />
      </div>
    </div>
  );
}
