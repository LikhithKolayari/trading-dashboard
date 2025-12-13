import { useEffect, useMemo, useState } from "react";
import { getTradingSymbolOptions, type SymbolOption } from "../services/binance";

export interface SymbolSelectProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export default function SymbolSelect({
  value,
  onChange,
  placeholder = "Select symbol",
  className = "",
}: SymbolSelectProps) {
  const [options, setOptions] = useState<SymbolOption[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const sortedOptions = useMemo(() => {
    // Sort alphabetically for easy use
    return [...options].sort((a, b) => a.label.localeCompare(b.label));
  }, [options]);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const opts = await getTradingSymbolOptions();
      setOptions(opts);
    } catch (e) {
      setError((e as Error)?.message || "Failed to load symbols");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  return (
    <div className={"w-full " + className}>
      <label className="block text-sm text-gray-300 mb-2">Market Symbol</label>
      <div className="flex items-center gap-2">
        <select
          className="w-full bg-gray-800 border border-gray-700 text-gray-100 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-60"
          value={value || ""}
          onChange={(e) => onChange?.(e.target.value)}
          disabled={loading || !!error}
        >
          <option value="" disabled>
            {loading ? "Loading symbols..." : placeholder}
          </option>
          {!loading &&
            !error &&
            sortedOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
        </select>
        {error && (
          <button
            type="button"
            onClick={() => load()}
            className="text-sm text-red-300 hover:text-red-200 underline"
            title="Retry"
          >
            Retry
          </button>
        )}
      </div>
      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
    </div>
  );
}
