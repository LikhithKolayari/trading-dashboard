import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import VolatilityRangeCard from "../VolatilityRangeCard";

const ticker = {
  highPrice: "52000",
  lowPrice: "48000",
  volume: "123.45",
  quoteVolume: "6000000",
  weightedAvgPrice: "50000",
};

describe("VolatilityRangeCard", () => {
  it("renders high/low/volumes/vwap", () => {
    render(<VolatilityRangeCard ticker={ticker} />);

    expect(screen.getByText(/volatility & range/i)).toBeInTheDocument();
    expect(screen.getByText("52000")).toBeInTheDocument();
    expect(screen.getByText("48000")).toBeInTheDocument();
    expect(screen.getByText("123.45")).toBeInTheDocument();
    expect(screen.getByText("6000000")).toBeInTheDocument();
    expect(screen.getByText("50000")).toBeInTheDocument();
  });
});
