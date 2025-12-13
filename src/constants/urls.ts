// Centralized URL constants
// Environment-derived values must be provided via Vite's import.meta.env
// Defaults are provided for local development only.

export const API_URLS = {
  API: {
    BASE: import.meta.env.VITE_API_BASE || "http://localhost:3001/api",
  },
  BINANCE: {
    BASE: "https://api.binance.com",
    EXCHANGE_INFO:
      "https://api.binance.com/api/v3/exchangeInfo?symbolStatus=TRADING&permissions=SPOT&showPermissionSets=false",
  },
} as const;
