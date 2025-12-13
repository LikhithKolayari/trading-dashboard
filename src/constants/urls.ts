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
      "/api/v3/exchangeInfo?symbolStatus=TRADING&permissions=SPOT&showPermissionSets=false",
    UI_KLINES: "/api/v3/uiKlines",
    TICKER_24HR: "/api/v3/ticker/24hr",
  },
} as const;
