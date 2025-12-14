import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Button from "../Button";

describe("Button", () => {
  it("renders children and handles click", async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(<Button onClick={onClick}>Click Me</Button>);

    const btn = screen.getByRole("button", { name: /click me/i });
    expect(btn).toBeInTheDocument();

    await user.click(btn);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("does not call onClick when disabled", async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(
      <Button onClick={onClick} disabled>
        Disabled
      </Button>
    );

    const btn = screen.getByRole("button", { name: /disabled/i });
    expect(btn).toBeDisabled();

    await user.click(btn);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("applies variant classes", () => {
    const { rerender } = render(<Button variant="primary">A</Button>);
    const primary = screen.getByRole("button", { name: "A" });
    expect(primary.className).toMatch(/bg-blue-600/);

    rerender(<Button variant="secondary">A</Button>);
    const secondary = screen.getByRole("button", { name: "A" });
    expect(secondary.className).toMatch(/bg-gray-700/);
  });
});
