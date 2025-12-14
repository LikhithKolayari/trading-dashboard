import DataField from "./DataField";
import type { Binance24hrTicker } from "../../types/binance";

interface Props {
  ticker?: Partial<Binance24hrTicker> | null;
  spread?: number | null; // ask - bid
}

export default function ExecutionDepthCard({ ticker, spread }: Props) {
  const formatVal = (v?: string | number | null) => {
    if (v === null || v === undefined) return v as null | undefined;
    const n = typeof v === "string" ? Number(v) : v;
    if (typeof n === "number" && Number.isFinite(n)) {
      return n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 8 });
    }
    return typeof v === "string" ? v : String(v);
  };
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
      <div className="grid grid-cols-2 gap-3 md:gap-4 lg:gap-5">
        <DataField label="Best Bid (Buy)" value={formatVal(ticker?.bidPrice)} priority={1} />
        <DataField label="Best Ask (Sell)" value={formatVal(ticker?.askPrice)} priority={1} />
        <DataField label="Spread" value={formatVal(spread as number | undefined)} priority={1} />
        <DataField label="Bid Depth" value={formatVal(ticker?.bidQty)} priority={2} />
        <DataField label="Ask Depth" value={formatVal(ticker?.askQty)} priority={2} />
      </div>
    </div>
  );
}
