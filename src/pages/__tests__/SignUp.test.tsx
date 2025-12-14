import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import SignUp from "../SignUp";
import * as useAuthMod from "../../context/useAuth";
import { PASSWORD_MIN } from "../../schemas/auth.schema";
import type { AuthContextValue } from "../../context/AuthContextBase";

describe("SignUp page", () => {
  function setup(mock: Partial<AuthContextValue> = {}) {
    const signup = vi.fn().mockResolvedValue("Signup successful. Please log in.");
    vi.spyOn(useAuthMod, "useAuth").mockReturnValue({
      user: null,
      isAuthenticated: false,
      loading: false,
      login: vi.fn(),
      logout: vi.fn(),
      signup,
      ...mock,
    } as unknown as AuthContextValue);

    render(
      <MemoryRouter>
        <SignUp />
      </MemoryRouter>
    );

    return { signup };
  }

  it("validates fields and enables submit when valid, then shows success", async () => {
    const user = userEvent.setup();
    const { signup } = setup();

    const submit = screen.getByRole("button", { name: /sign up/i });
    expect(submit).toBeDisabled();

    await user.type(screen.getByLabelText(/first name/i), "Jane");
    await user.type(screen.getByLabelText(/last name/i), "Doe");
    await user.type(screen.getByLabelText(/date of birth/i), "1990-01-01");
    await user.type(screen.getByLabelText(/^email$/i), "jane@example.com");
    await user.type(screen.getByLabelText(/^password$/i), "PasswordAA11!!");

    expect(submit).not.toBeDisabled();

    await user.click(submit);

    await waitFor(() => expect(signup).toHaveBeenCalled());

    // After success, success screen appears
    expect(await screen.findByText(/success/i)).toBeInTheDocument();
    expect(screen.getByText(/please log in/i)).toBeInTheDocument();
  });

  it("shows schema errors when invalid input", async () => {
    const user = userEvent.setup();
    setup();

    await user.type(screen.getByLabelText(/^email$/i), "bad-email");
    await user.type(screen.getByLabelText(/^password$/i), "short");

    const submit = screen.getByRole("button", { name: /sign up/i });
    expect(submit).toBeDisabled();

    // Mark fields as touched by typing into others
    await user.type(screen.getByLabelText(/first name/i), "J");
    await user.type(screen.getByLabelText(/last name/i), "D");

    // Password helper mentions min length
    expect(screen.getByText(new RegExp(String(PASSWORD_MIN)))).toBeInTheDocument();
  });
});
