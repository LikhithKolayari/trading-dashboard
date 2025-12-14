import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Input from "../Input";

describe("Input", () => {
  it("renders text input, shows error and calls onChange", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();

    render(
      <Input
        id="email"
        label="Email"
        value=""
        onChange={onChange}
        placeholder="Enter email"
        error="Invalid email"
      />
    );

    // Label and error
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByText(/invalid email/i)).toBeInTheDocument();

    await user.type(screen.getByLabelText(/email/i), "a");
    expect(onChange).toHaveBeenCalled();
  });

  it("toggles password visibility", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();

    render(
      <Input
        id="password"
        label="Password"
        type="password"
        value="secret"
        onChange={onChange}
        placeholder="Enter password"
      />
    );

    const field = screen.getByLabelText(/password/i, { selector: "input" }) as HTMLInputElement;
    // Initially password type
    expect(field.type).toBe("password");

    const toggle = screen.getByRole("button", { name: /show password/i });
    await user.click(toggle);

    // Now visible
    expect(field.type).toBe("text");

    // Toggle back
    const toggle2 = screen.getByRole("button", { name: /hide password/i });
    await user.click(toggle2);
    expect(field.type).toBe("password");
  });
});
