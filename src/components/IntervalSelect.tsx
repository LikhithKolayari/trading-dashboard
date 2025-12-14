import { useId } from "react";
import type { KlineInterval } from "../types/binance";

export interface IntervalSelectProps {
  value: KlineInterval;
  onChange: (value: KlineInterval) => void;
  className?: string;
  label?: string;
  disabled?: boolean;
}

// Full Binance interval set
const INTERVALS: KlineInterval[] = [
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
];

export default function IntervalSelect({
  value,
  onChange,
  className = "",
  label = "Timeframe",
  disabled = false,
}: IntervalSelectProps) {
  const inputId = useId();

  return (
    <div className={"w-full " + className}>
      {label && (
        <label htmlFor={inputId} className="block text-sm text-gray-300 mb-1">
          {label}
        </label>
      )}
      <select
        id={inputId}
        value={value}
        onChange={(e) => onChange(e.target.value as KlineInterval)}
        disabled={disabled}
        className="w-full h-9 px-2 rounded-md border bg-[var(--select-bg)] text-[var(--select-text)] border-[var(--select-border)] focus:outline-none focus:ring-1 focus:ring-[var(--select-focus)] focus:border-[var(--select-focus)]"
        aria-label="Kline interval"
      >
        {INTERVALS.map((intv) => (
          <option key={intv} value={intv}>
            {intv}
          </option>
        ))}
      </select>
    </div>
  );
}
