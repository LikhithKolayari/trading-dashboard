import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SymbolSelect from "../SymbolSelect";
import * as binanceSvc from "../../services/binance";

// Mock react-select as a native select for easier testing
vi.mock("react-select", () => {
  return {
    __esModule: true,
    default: ({
      options,
      value,
      onChange,
      inputId,
    }: {
      options: { label: string; value: string }[];
      value: { label: string; value: string } | null;
      onChange: (opt: { label: string; value: string } | null) => void;
      inputId?: string;
    }) => {
      const v = value && typeof value === "object" ? value.value : "";
      return (
        <select
          data-testid="react-select-mock"
          id={inputId}
          value={v}
          onChange={(e) => onChange({ label: e.target.value, value: e.target.value })}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      );
    },
  };
});

describe("SymbolSelect", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("loads options and calls onChange when selecting", async () => {
    const getTradingSymbolOptions = vi
      .spyOn(binanceSvc, "getTradingSymbolOptions")
      .mockResolvedValue([
        { label: "BTCUSDT", value: "BTCUSDT", baseAsset: "BTC", quoteAsset: "USDT" },
        { label: "ADAUSDT", value: "ADAUSDT", baseAsset: "ADA", quoteAsset: "USDT" },
      ]);

    const onChange = vi.fn();
    render(<SymbolSelect value="" onChange={onChange} />);

    // label
    expect(screen.getByText(/market symbol/i)).toBeInTheDocument();

    // Wait for options to load
    await waitFor(() => expect(getTradingSymbolOptions).toHaveBeenCalled());

    const select = screen.getByTestId("react-select-mock") as HTMLSelectElement;
    expect(select).toBeInTheDocument();

    const user = userEvent.setup();
    await user.selectOptions(select, "ADAUSDT");

    expect(onChange).toHaveBeenCalledWith("ADAUSDT");
  });

  it("shows error and allows retry", async () => {
    const spy = vi.spyOn(binanceSvc, "getTradingSymbolOptions");
    spy.mockRejectedValueOnce(new Error("boom"));
    spy.mockResolvedValueOnce([
      { label: "ETHUSDT", value: "ETHUSDT", baseAsset: "ETH", quoteAsset: "USDT" },
    ]);

    render(<SymbolSelect />);

    // Error shown after first failure
    await screen.findByText(/failed to load symbols/i);

    const retry = screen.getByRole("button", { name: /retry/i });
    const user = userEvent.setup();
    await user.click(retry);

    // On retry we should load successfully and select rendered
    await screen.findByTestId("react-select-mock");
  });
});
