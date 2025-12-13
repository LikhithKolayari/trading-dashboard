import { createContext } from "react";
import type { User } from "../types/user";

export interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  signup: (data: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    email: string;
    password: string;
  }) => Promise<string>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
