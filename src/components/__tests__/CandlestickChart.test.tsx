import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import CandlestickChart from "../CandlestickChart";

// Mock lightweight-charts to avoid DOM canvas deps
vi.mock("lightweight-charts", () => {
  const timeScale = {
    fitContent: vi.fn(),
    subscribeVisibleLogicalRangeChange: vi.fn(),
    unsubscribeVisibleLogicalRangeChange: vi.fn(),
  };
  const chart = {
    addSeries: vi.fn(() => ({ setData: vi.fn() })),
    timeScale: () => timeScale,
    applyOptions: vi.fn(),
    remove: vi.fn(),
  };
  return {
    createChart: vi.fn(() => chart),
    ColorType: { Solid: "Solid" },
    CandlestickSeries: "CandlestickSeries",
  };
});

describe("CandlestickChart", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("mounts and renders container", () => {
    render(<CandlestickChart data={[]} />);
    // container rendered as a div with default height
    const el = screen.getByTestId("candlestick-container");
    expect(el).toBeInTheDocument();
  });
});
