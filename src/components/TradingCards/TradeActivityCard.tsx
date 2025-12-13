import DataField from "./DataField";
import type { Binance24hrTicker } from "../../types/binance";

interface Props {
  ticker?: Partial<Binance24hrTicker> | null;
  openTimeHuman?: string | null;
  closeTimeHuman?: string | null;
}

export default function TradeActivityCard({ ticker, openTimeHuman, closeTimeHuman }: Props) {
  return (
    <div
      className="rounded-xl border p-4 h-full"
      style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="text-xs" style={{ color: "var(--color-accent)" }}>
          Trade Activity & Context
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <DataField label="Window Start Time" value={openTimeHuman ?? undefined} priority={2} />
        <DataField label="Trades Count" value={ticker?.count as number | undefined} priority={2} />
        <DataField label="Last Trade Quantity" value={ticker?.lastQty} priority={3} />
        <DataField label="Window End Time" value={closeTimeHuman ?? undefined} priority={2} />
      </div>
    </div>
  );
}
