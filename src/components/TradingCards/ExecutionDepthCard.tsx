import DataField from "./DataField";
import type { Binance24hrTicker } from "../../types/binance";

interface Props {
  ticker?: Partial<Binance24hrTicker> | null;
  spread?: number | null; // ask - bid
}

export default function ExecutionDepthCard({ ticker, spread }: Props) {
  return (
    <div
      className="rounded-xl border p-4 h-full"
      style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="text-xs" style={{ color: "var(--color-accent)" }}>
          Execution & Depth
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <DataField label="Best Bid (Buy)" value={ticker?.bidPrice} priority={1} />
        <DataField label="Best Ask (Sell)" value={ticker?.askPrice} priority={1} />
        <DataField label="Spread" value={spread as number | undefined} priority={1} />
        <DataField label="Bid Depth" value={ticker?.bidQty} priority={2} />
        <DataField label="Ask Depth" value={ticker?.askQty} priority={2} />
      </div>
    </div>
  );
}
