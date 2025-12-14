import { useCallback, useEffect, useRef, useState } from "react";
import { WebSocketCore } from "../services/websocket";
import type { WebSocketStatus } from "../types/binance";

// Shared singleton WebSocketCore instance so all hooks reuse one connection
let __sharedClient: WebSocketCore | null = null;
function getSharedClient(): WebSocketCore {
  if (!__sharedClient) {
    __sharedClient = new WebSocketCore();
  }
  return __sharedClient;
}

export interface UseBinanceStreamResult<T = unknown> {
  data: T | null;
  status: WebSocketStatus;
  error: string | null;
  reconnect: () => void;
  unsubscribe: (streams: string[]) => void;
}

function normalizeStreams(streams: string[]): string[] {
  // Normalize: trim, lowercase, remove falsy, and dedupe preserving order
  const seen = new Set<string>();
  const result: string[] = [];
  for (const raw of streams || []) {
    const s = (raw ?? "").trim().toLowerCase();
    if (!s) continue;
    if (!seen.has(s)) {
      seen.add(s);
      result.push(s);
    }
  }
  return result;
}

/**
 * Manages a single WebSocketCore instance and diffs subscriptions on input changes.
 */
export function useBinanceStream<T = unknown>(streams: string[]): UseBinanceStreamResult<T> {
  const [status, setStatus] = useState<WebSocketStatus>("idle");
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);

  const clientRef = useRef<WebSocketCore | null>(null);
  const prevStreamsRef = useRef<string[]>([]);

  useEffect(() => {
    const client = getSharedClient();
    clientRef.current = client;

    const offStatus = client.onStatusChange((s) => {
      setStatus(s);
      if (s === "error") setError("WebSocket error");
    });

    const offMessage = client.onMessage((msg) => {
      // Pass through raw message; let caller type-narrow if needed
      setData(msg as T);
      setError(null);
    });

    // Ensure the shared client is connected (no-op if already open/connecting)
    client.connect();

    return () => {
      // Unregister handlers for this hook
      offMessage();
      offStatus();
      // Unsubscribe any streams this hook last subscribed to
      const last = prevStreamsRef.current;
      if (last && last.length) {
        try {
          client.unsubscribe(last);
        } catch {
          // ignore
        }
      }
      // Do NOT disconnect the shared client here; other hooks may still be using it
      prevStreamsRef.current = [];
    };
  }, []);

  // Diff subscriptions when streams input changes
  useEffect(() => {
    const next = normalizeStreams(Array.isArray(streams) ? streams : []);
    const prev = prevStreamsRef.current;
    const client = clientRef.current;
    if (!client) return;

    // Streams to unsubscribe: in prev but not in next
    const toUnsub = prev.filter((s) => !next.includes(s));
    if (toUnsub.length) client.unsubscribe(toUnsub);

    // Streams to subscribe: in next but not in prev
    const toSub = next.filter((s) => !prev.includes(s));
    if (toSub.length) client.subscribe(toSub);

    prevStreamsRef.current = next;
  }, [JSON.stringify(streams)]);

  const reconnect = useCallback(() => clientRef.current?.reconnect(), []);
  const unsubscribe = useCallback((s: string[]) => clientRef.current?.unsubscribe(s), []);

  return { data, status, error, reconnect, unsubscribe };
}
