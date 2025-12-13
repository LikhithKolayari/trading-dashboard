"use strict";

import { API_URLS } from "../constants/urls";
import type {
  BinanceTickerStreamEvent,
  WebSocketStatus,
  BinanceStreamResponse,
} from "../types/binance";

// Basic allowlist validation for Binance stream names like "btcusdt@ticker"
// Allows lowercase letters, digits, '@', '!' and underscores. Length 3-128.
const STREAM_NAME_REGEX = /^[a-z0-9@_!]{3,128}$/;

function generateRequestId(): string {
  // Prefer cryptographically secure UUID when available (browser)
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    try {
      return crypto.randomUUID();
    } catch {
      // fall through
    }
  }
  // Fallback: timestamp + random number string
  return `${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
}

function isOpen(ws: WebSocket | null): ws is WebSocket {
  return !!ws && ws.readyState === WebSocket.OPEN;
}

function safeJsonParse<T = unknown>(raw: string): T | null {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export type MessageHandler = (data: unknown) => void;
export type StatusHandler = (status: WebSocketStatus) => void;

export interface WebSocketCoreOptions {
  url?: string;
  protocols?: string | string[];
}

/**
 * WebSocketCore: lightweight, reusable WS client with simple subscribe support.
 */
export class WebSocketCore {
  private ws: WebSocket | null = null;
  private url: string;
  private protocols?: string | string[];
  private status: WebSocketStatus = "idle";
  private messageHandlers = new Set<MessageHandler>();
  private statusHandlers = new Set<StatusHandler>();
  private pendingStreams: string[] = [];
  private activeSubscriptions: Set<string> = new Set();

  constructor(options: WebSocketCoreOptions = {}) {
    this.url = options.url ?? API_URLS.BINANCE.WS_URL;
    this.protocols = options.protocols;
  }

  getStatus(): WebSocketStatus {
    return this.status;
  }

  onMessage(handler: MessageHandler): () => void {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }

  onStatusChange(handler: StatusHandler): () => void {
    this.statusHandlers.add(handler);
    return () => this.statusHandlers.delete(handler);
  }

  private setStatus(next: WebSocketStatus) {
    this.status = next;
    for (const h of this.statusHandlers) h(next);
  }

  connect(): void {
    if (
      this.ws &&
      (this.ws.readyState === WebSocket.CONNECTING || this.ws.readyState === WebSocket.OPEN)
    ) {
      return;
    }

    this.setStatus("connecting");

    try {
      this.ws = this.protocols ? new WebSocket(this.url, this.protocols) : new WebSocket(this.url);
    } catch {
      this.setStatus("error");
      return;
    }

    this.ws.onopen = () => {
      this.setStatus("open");
      // Flush any pending subscriptions
      if (this.pendingStreams.length) {
        const toSend = [...this.pendingStreams];
        this.pendingStreams = [];
        this.subscribe(toSend);
      }
    };

    this.ws.onmessage = (evt: MessageEvent<string>) => {
      const parsed = typeof evt.data === "string" ? safeJsonParse<unknown>(evt.data) : evt.data;

      // Unwrap Binance stream wrapper { stream, data } when present
      let messageToDispatch: unknown = parsed;
      if (isStreamWrapper(parsed)) {
        // Validate stream name to basic allowlist; if invalid, drop message
        if (typeof parsed.stream === "string" && STREAM_NAME_REGEX.test(parsed.stream)) {
          messageToDispatch = parsed.data;
        } else {
          // Silently ignore unexpected stream names
          return;
        }
      }

      for (const h of this.messageHandlers) h(messageToDispatch);
    };

    this.ws.onerror = () => {
      this.setStatus("error");
    };

    this.ws.onclose = () => {
      this.setStatus("closed");
      // Move active subscriptions to pending so they are re-subscribed on next connect
      if (this.activeSubscriptions.size > 0) {
        const queued = new Set(this.pendingStreams);
        for (const s of this.activeSubscriptions) if (!queued.has(s)) this.pendingStreams.push(s);
        this.activeSubscriptions.clear();
      }
      this.ws = null;
    };
  }

  /**
   * Disconnect gracefully.
   */
  disconnect(code: number = 1000, reason = "client-close"): void {
    if (!this.ws) return;
    try {
      this.setStatus("closing");
      this.ws.close(code, reason);
    } finally {
      // onclose handler will nullify and set closed
    }
  }

  /**
   * Reconnect by closing any existing socket and opening a fresh connection.
   */
  reconnect(): void {
    this.disconnect();
    setTimeout(() => this.connect(), 0);
  }

  subscribe(streams: string[]): void {
    if (!Array.isArray(streams) || streams.length === 0) return;

    // Normalize, validate, and deduplicate
    const validUnique = Array.from(
      new Set(
        streams
          .map((s) => s?.trim().toLowerCase())
          .filter((s): s is string => !!s && STREAM_NAME_REGEX.test(s))
      )
    );

    if (validUnique.length === 0) return;

    if (!isOpen(this.ws)) {
      // Queue until connection is ready (avoid duplicates in queue)
      const queued = new Set(this.pendingStreams);
      for (const s of validUnique) if (!queued.has(s)) this.pendingStreams.push(s);
      return;
    }

    // Filter out streams that are already subscribed
    const toSubscribe = validUnique.filter((s) => !this.activeSubscriptions.has(s));
    if (toSubscribe.length === 0) return;

    const payload = {
      method: "SUBSCRIBE",
      params: toSubscribe,
      id: generateRequestId(),
    } as const;

    try {
      this.ws!.send(JSON.stringify(payload));
      // Track active subscriptions optimistically
      toSubscribe.forEach((s) => this.activeSubscriptions.add(s));
    } catch {
      /* empty */
    }
  }

  unsubscribe(streams: string[]): void {
    if (!Array.isArray(streams) || streams.length === 0) return;

    const validUnique = Array.from(
      new Set(
        streams
          .map((s) => s?.trim().toLowerCase())
          .filter((s): s is string => !!s && STREAM_NAME_REGEX.test(s))
      )
    );

    if (validUnique.length === 0) return;

    // Limit to streams we believe are currently active
    const toUnsub = validUnique.filter((s) => this.activeSubscriptions.has(s));
    if (toUnsub.length === 0) return;

    if (!isOpen(this.ws)) {
      // If not connected, ensure they're not queued and drop from active set
      const removeSet = new Set(toUnsub);
      this.pendingStreams = this.pendingStreams.filter((s) => !removeSet.has(s));
      toUnsub.forEach((s) => this.activeSubscriptions.delete(s));
      return;
    }

    const payload = {
      method: "UNSUBSCRIBE",
      params: toUnsub,
      id: generateRequestId(),
    } as const;

    try {
      this.ws!.send(JSON.stringify(payload));
      toUnsub.forEach((s) => this.activeSubscriptions.delete(s));
    } catch {
      // Swallow send errors in demo scope
    }
  }
}

// Narrower for Binance stream wrapper shape
function isStreamWrapper(obj: unknown): obj is BinanceStreamResponse<unknown> {
  if (typeof obj !== "object" || obj === null) return false;
  const anyObj = obj as { stream?: unknown; data?: unknown };
  return typeof anyObj.stream === "string" && "data" in anyObj;
}

// Type guard helper if consumers want to narrow incoming messages
export function isBinanceTickerEvent(msg: unknown): msg is BinanceTickerStreamEvent {
  if (typeof msg !== "object" || msg === null) return false;
  const e = (msg as { e?: unknown }).e;
  return e === "24hrTicker";
}
