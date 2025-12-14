import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "../ProtectedRoute";
import * as useAuthMod from "../../context/useAuth";
import type { AuthContextValue } from "../../context/AuthContextBase";

function renderWithRouter(ui: React.ReactNode, initialEntries = ["/dashboard"]) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route path="/" element={<div>Login Page</div>} />
        <Route path="/dashboard" element={ui} />
      </Routes>
    </MemoryRouter>
  );
}

describe("ProtectedRoute", () => {
  it("shows loading state when loading", () => {
    vi.spyOn(useAuthMod, "useAuth").mockReturnValue({
      isAuthenticated: false,
      loading: true,
      user: null,
      login: vi.fn(),
      logout: vi.fn(),
      signup: vi.fn(),
    } as unknown as AuthContextValue);

    renderWithRouter(
      <ProtectedRoute>
        <div>Secret</div>
      </ProtectedRoute>
    );

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it("navigates to login when not authenticated", () => {
    vi.spyOn(useAuthMod, "useAuth").mockReturnValue({
      isAuthenticated: false,
      loading: false,
      user: null,
      login: vi.fn(),
      logout: vi.fn(),
      signup: vi.fn(),
    } as unknown as AuthContextValue);

    renderWithRouter(
      <ProtectedRoute>
        <div>Secret</div>
      </ProtectedRoute>
    );

    // We land on '/dashboard' initially, ProtectedRoute should render a Navigate to '/'
    // Which means 'Secret' should not appear, but the route content at '/' should
    expect(screen.queryByText("Secret")).not.toBeInTheDocument();
  });

  it("renders children when authenticated", () => {
    vi.spyOn(useAuthMod, "useAuth").mockReturnValue({
      isAuthenticated: true,
      loading: false,
      user: { id: "1", email: "a@b.com", firstName: "A", lastName: "B", dateOfBirth: "2000-01-01" },
      login: vi.fn(),
      logout: vi.fn(),
      signup: vi.fn(),
    } as unknown as AuthContextValue);

    renderWithRouter(
      <ProtectedRoute>
        <div>Secret</div>
      </ProtectedRoute>
    );

    expect(screen.getByText("Secret")).toBeInTheDocument();
  });
});
