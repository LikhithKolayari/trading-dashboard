import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import IntervalSelect from "../IntervalSelect";

describe("IntervalSelect", () => {
  it("renders label and options, calls onChange", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<IntervalSelect value="1h" onChange={onChange} />);

    // Label defaults to 'Timeframe'
    expect(screen.getByText(/timeframe/i)).toBeInTheDocument();

    const select = screen.getByLabelText(/kline interval/i) as HTMLSelectElement;
    expect(select.value).toBe("1h");

    await user.selectOptions(select, "15m");
    expect(onChange).toHaveBeenCalledWith("15m");
  });
});
