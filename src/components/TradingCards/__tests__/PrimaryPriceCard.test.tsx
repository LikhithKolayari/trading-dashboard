import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PrimaryPriceCard from "../PrimaryPriceCard";

const baseTicker = {
  symbol: "BTCUSDT",
  lastPrice: "50000",
  priceChangePercent: "2.5",
  priceChange: "1000",
  openPrice: "49000",
};

describe("PrimaryPriceCard", () => {
  it("renders ticker values and toggles watchlist via button", async () => {
    const user = userEvent.setup();
    const onToggleWatchlist = vi.fn();

    render(
      <PrimaryPriceCard
        ticker={baseTicker}
        isInWatchlist={false}
        onToggleWatchlist={onToggleWatchlist}
      />
    );

    expect(screen.getByText(/primary price & change/i)).toBeInTheDocument();
    expect(screen.getByText("BTCUSDT")).toBeInTheDocument();
    expect(screen.getByText("50000")).toBeInTheDocument();

    const btn = screen.getByRole("button", { name: /add to watchlist/i });
    await user.click(btn);
    expect(onToggleWatchlist).toHaveBeenCalled();
  });

  it("shows remove when already in watchlist and respects disabled", async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();

    render(
      <PrimaryPriceCard ticker={baseTicker} isInWatchlist disabled onToggleWatchlist={onToggle} />
    );

    const btn = screen.getByRole("button", { name: /remove/i });
    expect(btn).toBeDisabled();

    await user.click(btn);
    expect(onToggle).not.toHaveBeenCalled();
  });
});
