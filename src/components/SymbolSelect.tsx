import { useEffect, useMemo, useState, useId } from "react";
import Select, { type StylesConfig } from "react-select";
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
  const inputId = useId();

  const sortedOptions = useMemo(() => {
    // Sort alphabetically for easy use
    return [...options].sort((a, b) => a.label.localeCompare(b.label));
  }, [options]);

  const selectedOption = useMemo(() => {
    return sortedOptions.find((opt) => opt.value === value) ?? null;
  }, [sortedOptions, value]);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const opts = await getTradingSymbolOptions();
      setOptions(opts);
    } catch {
      setError("Failed to load symbols");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  // Dark theme styles to match current UI
  const customStyles: StylesConfig<SymbolOption, false> = {
    container: (base) => ({
      ...base,
      width: "100%",
    }),
    control: (base, state) => ({
      ...base,
      backgroundColor: "var(--select-bg)",
      borderColor: state.isFocused ? "var(--select-focus)" : "var(--select-border)",
      boxShadow: state.isFocused ? "var(--select-focus-ring)" : "none",
      minHeight: 38,
      cursor: state.isDisabled ? "not-allowed" : "default",
      ":hover": {
        borderColor: state.isFocused ? "var(--select-focus)" : "var(--select-border-hover)",
      },
    }),
    valueContainer: (base) => ({
      ...base,
      padding: "2px 8px",
    }),
    input: (base) => ({
      ...base,
      color: "var(--select-text)",
    }),
    singleValue: (base) => ({
      ...base,
      color: "var(--select-text)",
    }),
    placeholder: (base) => ({
      ...base,
      color: "var(--select-placeholder)",
    }),
    indicatorsContainer: (base) => ({
      ...base,
      color: "var(--select-placeholder)",
    }),
    dropdownIndicator: (base, state) => ({
      ...base,
      color: state.isFocused ? "var(--select-focus)" : "var(--select-placeholder)",
      ":hover": { color: "var(--select-focus)" },
    }),
    indicatorSeparator: (base) => ({
      ...base,
      backgroundColor: "var(--select-border)",
    }),
    menu: (base) => ({
      ...base,
      backgroundColor: "var(--select-menu-bg)",
      border: "1px solid var(--select-menu-border)",
      overflow: "hidden",
    }),
    menuList: (base) => ({
      ...base,
      maxHeight: 240,
      paddingTop: 0,
      paddingBottom: 0,
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected
        ? "var(--select-option-bg-selected)"
        : state.isFocused
        ? "var(--select-option-bg-focus)"
        : "var(--select-bg)",
      color: state.isSelected ? "var(--select-option-text-selected)" : "var(--select-text)",
      cursor: "pointer",
      ":active": {
        backgroundColor: state.isSelected
          ? "var(--select-option-bg-selected)"
          : "var(--select-option-bg-active)",
      },
    }),
    noOptionsMessage: (base) => ({
      ...base,
      color: "var(--select-placeholder)",
    }),
  };

  return (
    <div className={"w-full " + className}>
      <label htmlFor={inputId} className="block text-sm text-gray-300 mb-2">
        Market Symbol
      </label>
      <div className="flex items-center gap-2">
        <div className="w-full">
          <Select<SymbolOption, false>
            inputId={inputId}
            instanceId={inputId}
            isSearchable
            isClearable={false}
            isDisabled={loading || !!error}
            isLoading={loading}
            options={sortedOptions}
            value={selectedOption}
            onChange={(opt) => onChange?.(opt ? opt.value : "")}
            placeholder={loading ? "Loading symbols..." : placeholder}
            noOptionsMessage={() => "No symbols found"}
            styles={customStyles}
            filterOption={(option, rawInput) => {
              const q = rawInput.trim().toLowerCase();
              if (!q) return true;
              const label = option.label.toLowerCase();
              const val = option.data.value.toLowerCase();
              return label.includes(q) || val.includes(q);
            }}
          />
        </div>
        {error && (
          <button
            type="button"
            onClick={() => void load()}
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
