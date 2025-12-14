import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import DataField from "../DataField";

describe("DataField", () => {
  it("renders label and value, falls back to -- for invalid", () => {
    const { rerender } = render(<DataField label="A" value="123" />);
    expect(screen.getByText("A")).toBeInTheDocument();
    expect(screen.getByText("123")).toBeInTheDocument();

    rerender(<DataField label="A" value={""} />);
    expect(screen.getByText("--")).toBeInTheDocument();

    rerender(<DataField label="A" value={Number.NaN} />);
    expect(screen.getByText("--")).toBeInTheDocument();
  });

  it("applies variant colors via inline style", () => {
    const { rerender } = render(<DataField label="P" value={1} variant="positive" />);
    const val1 = screen.getByText("1");
    expect(val1).toBeInTheDocument();

    rerender(<DataField label="P" value={-2} variant="negative" />);
    const val2 = screen.getByText("-2");
    expect(val2).toBeInTheDocument();
  });
});
