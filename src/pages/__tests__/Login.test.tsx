import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import Login from "../Login";
import * as useAuthMod from "../../context/useAuth";
import type { AuthContextValue } from "../../context/AuthContextBase";

function renderLogin() {
  vi.spyOn(useAuthMod, "useAuth").mockReturnValue({
    login: vi.fn().mockResolvedValue(undefined),
    logout: vi.fn(),
    signup: vi.fn(),
    user: null,
    isAuthenticated: false,
    loading: false,
  } as unknown as AuthContextValue);

  return render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>
  );
}

describe("Login page", () => {
  it("validates fields and calls login", async () => {
    const user = userEvent.setup();
    renderLogin();

    const email = screen.getByLabelText(/email/i);
    const password = screen.getByLabelText(/password/i, { selector: "input" });
    const submit = screen.getByRole("button", { name: /login/i });

    // Initially invalid -> disabled
    expect(submit).toBeDisabled();

    await user.type(email, "john@doe.com");
    await user.type(password, "passwordA1!");

    // Now valid
    expect(submit).not.toBeDisabled();

    await user.click(submit);
    expect(useAuthMod.useAuth().login).toHaveBeenCalled();
  });
});
