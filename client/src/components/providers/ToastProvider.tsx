"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";

type ToastTone = "success" | "info" | "error";

export type ToastItem = {
  id: string;
  message: string;
  tone: ToastTone;
};

type ToastContextValue = {
  saved: () => void;
  updated: () => void;
  deleted: () => void;
  error: (message?: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const DISMISS_MS = 4200;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const remove = useCallback((id: string) => {
    const t = timers.current.get(id);
    if (t) clearTimeout(t);
    timers.current.delete(id);
    setToasts((prev) => prev.filter((x) => x.id !== id));
  }, []);

  const push = useCallback(
    (message: string, tone: ToastTone) => {
      const id =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random()}`;
      setToasts((prev) => [...prev, { id, message, tone }]);
      const timer = setTimeout(() => remove(id), DISMISS_MS);
      timers.current.set(id, timer);
    },
    [remove]
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      saved: () => push("Saved successfully ✅", "success"),
      updated: () => push("Updated successfully ✏️", "success"),
      deleted: () => push("Deleted successfully ❌", "info"),
      error: (message) =>
        push(message?.trim() || "Something went wrong ⚠️", "error"),
    }),
    [push]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2 p-2 sm:bottom-6 sm:right-6"
        aria-live="polite"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto rounded-lg border px-4 py-3 text-sm font-medium shadow-lg ${
              t.tone === "error"
                ? "border-red-200 bg-red-50 text-red-800"
                : t.tone === "info"
                  ? "border-[var(--purity-border)] bg-[var(--purity-card)] text-[var(--purity-text)]"
                  : "border-teal-200 bg-teal-50 text-teal-900"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <span>{t.message}</span>
              <button
                type="button"
                className="shrink-0 text-xs font-bold text-[var(--purity-muted)] hover:text-[var(--purity-text)]"
                onClick={() => remove(t.id)}
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
