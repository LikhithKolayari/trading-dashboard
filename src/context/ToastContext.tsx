/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

export type ToastKind = "success" | "error" | "info";

export interface ToastMessage {
  id: string;
  kind: ToastKind;
  text: string;
  timeoutMs?: number;
}

interface ToastContextValue {
  show: (text: string, kind?: ToastKind, timeoutMs?: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    (text: string, kind: ToastKind = "info", timeoutMs = 3500) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const toast: ToastMessage = { id, kind, text, timeoutMs };
      setToasts((prev) => [...prev, toast]);
      window.setTimeout(() => remove(id), Math.max(1500, timeoutMs));
    },
    [remove]
  );

  const value = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Toast container - centered top */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] space-y-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`min-w-[240px] max-w-[480px] rounded-md border px-4 py-2 shadow-lg text-sm text-center ${
              t.kind === "success"
                ? "bg-green-900/30 border-green-600 text-green-200"
                : t.kind === "error"
                ? "bg-red-900/30 border-red-600 text-red-200"
                : "bg-gray-800/80 border-gray-600 text-gray-100"
            }`}
          >
            {t.text}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
