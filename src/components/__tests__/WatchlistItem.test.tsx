import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import WatchlistItem from "../WatchlistItem";

function renderItem(overrides: Partial<React.ComponentProps<typeof WatchlistItem>> = {}) {
  const onSelect = vi.fn();
  const onRemove = vi.fn();
  const props = {
    symbol: "ETHUSDT",
    ticker: {
      priceChangePercent: "1.23",
      lastPrice: "123.45678901",
    },
    onSelect,
    onRemove,
    ...overrides,
  };
  render(
    <ul>
      <WatchlistItem {...props} />
    </ul>
  );
  return { onSelect, onRemove };
}

describe("WatchlistItem", () => {
  it("renders symbol, formats price and percent, triggers callbacks", async () => {
    const user = userEvent.setup();
    const { onSelect, onRemove } = renderItem();

    expect(screen.getByText("ETHUSDT")).toBeInTheDocument();
    // percent formatted with % appended
    expect(screen.getByText(/1.23%/)).toBeInTheDocument();
    // price up to 8 decimals
    expect(screen.getByText("123.45678901")).toBeInTheDocument();

    await user.click(screen.getByTitle(/view ethusdt/i));
    expect(onSelect).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole("button", { name: /remove ethusdt/i }));
    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it("applies color based on percent and shows '-' for invalid values", () => {
    // negative percent -> red
    renderItem({ ticker: { priceChangePercent: "-2.5", lastPrice: "abc" } });
    const pct = screen.getByText(/-2.5%/);
    expect(pct.className).toMatch(/text-red-400/);
    // invalid price becomes '-'
    expect(screen.getByText("-"));
  });

  it("neutral color when percent missing", () => {
    renderItem({ ticker: { lastPrice: "100" } });
    // the percent span is gray when undefined; find the element with % placeholder '-'
    const percentEl = screen.getAllByText("-")[0];
    expect(percentEl.className).toMatch(/text-gray-400/);
  });
});
