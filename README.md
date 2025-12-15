# Trading Dashboard

A simple, real‑time crypto dashboard built with React and a small Node/Express server. It streams live market data from Binance, draws an interactive candlestick chart, and lets you sign up, log in, and manage a personal watchlist.

## Project overview

- Pick a symbol (e.g., BTCUSDT) to see its live price, daily change, and other quick stats.
- View an interactive candlestick chart that updates in real time.
- Sign up and log in to keep a short watchlist of your favorite symbols (up to 5).
- Works locally with no secrets or API keys.

## What you see on the dashboard

- Market summary
  - Choose a trading symbol and see a friendly welcome with your name when logged in.
- Primary Price & Change
  - Current price, 24‑hour change (absolute and %), and a button to add/remove the symbol from your watchlist.
- Execution & Depth
  - Best Bid (Buy) and Best Ask (Sell)
  - Spread (Ask − Bid)
  - Bid Depth and Ask Depth (quantities at the top of book)
- Candlestick Chart
  - Interactive chart of price over time with selectable intervals (e.g., 1m, 5m, 1h, 1d)
  - Updates live as new candles form; scroll left to load older candles
- Volatility & Range
  - 24‑hour High and Low
  - Base Volume, Quote Volume, and VWAP
- Trade Activity & Context
  - Number of trades in the 24‑hour window
  - Window start/end timestamps and last trade quantity
- Watchlist (right side)
  - Your saved symbols with last price and daily % change (color‑coded)
  - Click a symbol to focus it on the chart; remove with one click (max 5 symbols)
- Connection status
  - Clear status message when the live stream is stale, with a handy Reconnect button

## How market data works (Binance + lightweight‑charts)

- Binance APIs
  - REST (one‑time fetches): We load initial data such as the list of tradable symbols and a block of historical candles to draw the chart.
  - WebSocket (live updates): We subscribe to live ticker updates for the selected symbol and to kline (candlestick) events so the chart continues to move without full page reloads.
  - Public endpoints only; no API key needed. Please respect Binance rate limits.
- Charting with lightweight‑charts
  - We use TradingView’s lightweight‑charts to render the candlestick chart.
  - The chart is fed by the initial REST candles and then kept in sync by incoming WebSocket kline updates.
  - Scrolling to the left triggers a “load older candles” action so you can quickly backfill history.

## User authentication

- Sign up with your name, date of birth, email, and a strong password.
- Log in to create a session; the server sets a secure, HTTP‑only cookie so you stay signed in.
- Add or remove symbols from your personal watchlist. We cap it at 5 to keep things tidy and to limit open streams.
- Passwords are hashed; sessions are managed on the server.

## Main services and libraries

- Frontend
  - React + Vite + TypeScript
  - React Router (navigation)
  - lightweight‑charts (candlestick chart)
  - react‑select, react‑icons
  - Tailwind CSS (styling)
  - zod (form validation)
- Backend
  - Express, CORS, Helmet (basic security headers)
  - express‑session, cookie‑parser (login sessions)
  - bcrypt (password hashing)
  - node‑json‑db (simple file storage for demo)
- Testing
  - Vitest, React Testing Library, jsdom

## Run it locally

1. Install dependencies

- npm install
- npm --prefix server install

2. Start both servers (frontend + backend)

- npm run dev:all
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001/api

3. Environment (optional)

- Copy .env.example to .env to tweak ports or CORS if needed

## Running tests

- Unit/Component tests: npm test
- Watch mode: npm run test:watch
- Test UI (optional): npm run test:ui

## Assumptions and trade‑offs

- This is a demo: it uses a file‑based store instead of a real database and a simple in‑memory WebSocket client.
- Watchlist is limited to 5 symbols to reduce clutter and lower streaming load.
- Only public Binance endpoints are used; data is for informational/educational purposes.
- If you deploy to production, use a managed database and a persistent session store.

## Production deployment (Render)

Live site: https://trading-dashboard-7fbn.onrender.com/

This app is packaged to run as a single Render Web Service where Express serves both the API and the built React app.

- Render automatically detects the Containerfile.
- Create a new Web Service, connect this repo, and choose Docker as the runtime.
- No special build/start commands required; the image builds the frontend and serves it via Express.
- A health check is exposed at GET /api/health.

⚠️ **Important:** The free Render instance will spin down with inactivity, which can delay the first request by 50 seconds or more. Please be patient on initial load.

Notes

- API is served under the same domain at /api.
- Sessions will reset on each deploy because the demo uses an in‑process session secret and store.
