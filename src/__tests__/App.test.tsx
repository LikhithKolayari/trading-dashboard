import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import App from "../App";

describe("App", () => {
  it("renders the Login page by default route", () => {
    render(<App />);
    // The default route ("/") renders the Login page
    expect(screen.getByRole("heading", { name: /login/i })).toBeInTheDocument();
  });
});
