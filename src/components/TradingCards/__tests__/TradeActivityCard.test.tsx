import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import TradeActivityCard from "../TradeActivityCard";

describe("TradeActivityCard", () => {
  it("renders times and trade details", () => {
    render(
      <TradeActivityCard
        ticker={{ count: 42, lastQty: "0.5" }}
        openTimeHuman="09:00"
        closeTimeHuman="10:00"
      />
    );

    expect(screen.getByText(/trade activity & context/i)).toBeInTheDocument();
    expect(screen.getByText("09:00")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
    expect(screen.getByText("0.5")).toBeInTheDocument();
    expect(screen.getByText("10:00")).toBeInTheDocument();
  });
});
