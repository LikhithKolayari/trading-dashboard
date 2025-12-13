import type { LoginResponse, SessionResponse } from "../types/user";
import { API_URLS } from "../constants/urls";

const API_BASE = API_URLS.API.BASE;

// Function to handle API requests
async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    credentials: "include", // send HTTP-only cookie
  });

  const contentType = res.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const data = (isJson ? ((await res.json()) as unknown) : undefined) as unknown;

  if (!res.ok) {
    const errData = (data as { error?: string } | undefined) || undefined;
    const message = errData?.error || "Request failed";
    throw new Error(message);
  }
  return data as T;
}

export interface SignupPayload {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  email: string;
  password: string;
}

export async function signup(payload: SignupPayload): Promise<{ message: string }> {
  return apiFetch<{ message: string }>("/signup", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  return apiFetch<LoginResponse>("/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function logout(): Promise<{ message: string }> {
  return apiFetch<{ message: string }>("/logout", { method: "POST" });
}

export async function getSession(): Promise<SessionResponse> {
  return apiFetch<SessionResponse>("/session", { method: "GET" });
}

export { API_BASE };
