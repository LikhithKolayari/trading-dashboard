import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import ExecutionDepthCard from "../ExecutionDepthCard";

const ticker = {
  bidPrice: "100",
  askPrice: "101",
  bidQty: "5",
  askQty: "7",
};

describe("ExecutionDepthCard", () => {
  it("shows bid/ask, spread and depths", () => {
    render(<ExecutionDepthCard ticker={ticker} spread={1} />);

    expect(screen.getByText(/execution & depth/i)).toBeInTheDocument();
    expect(screen.getByText("100")).toBeInTheDocument();
    expect(screen.getByText("101")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("7")).toBeInTheDocument();
  });
});
