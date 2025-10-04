"use client";

import React, { createContext, useContext, useCallback, useState, useMemo } from "react";
import { X } from "lucide-react";

export type ToastType = "info" | "success" | "error" | "warning";

export interface ToastOptions {
  id?: string;
  title?: string;
  description?: string;
  type?: ToastType;
  duration?: number; // ms
}

interface ToastItem extends Required<Omit<ToastOptions, "duration">> {
  duration: number;
  createdAt: number;
}

interface ToastContextValue {
  show: (opts: ToastOptions) => string; // returns id
  dismiss: (id: string) => void;
  clear: () => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const show = useCallback((opts: ToastOptions) => {
    const id = opts.id || Math.random().toString(36).slice(2);
    const item: ToastItem = {
      id,
      title: opts.title || "",
      description: opts.description || "",
      type: opts.type || "info",
      duration: opts.duration ?? 5000,
      createdAt: Date.now(),
    };
    setToasts((prev) => [...prev, item]);
    if (item.duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, item.duration);
    }
    return id;
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const clear = useCallback(() => setToasts([]), []);

  const value = useMemo(() => ({ show, dismiss, clear }), [show, dismiss, clear]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

function ToastContainer({ toasts, onDismiss }: { toasts: ToastItem[]; onDismiss: (id: string) => void }) {
  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={getToastClass(t.type)}
          role="status"
          aria-live="polite"
        >
          <div className="flex-1">
            {t.title && <div className="font-semibold mb-0.5">{t.title}</div>}
            {t.description && <div className="text-sm opacity-90">{t.description}</div>}
          </div>
          <button
            onClick={() => onDismiss(t.id)}
            className="ml-3 text-white/70 hover:text-white transition-colors"
            aria-label="Dismiss"
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}

function getToastClass(type: ToastType) {
  const base = "min-w-[260px] max-w-[360px] rounded-xl px-4 py-3 text-white shadow-lg backdrop-blur border transition-all duration-200 flex items-start";
  switch (type) {
    case "success":
      return `${base} bg-green-600/20 border-green-500/30`;
    case "error":
      return `${base} bg-red-600/20 border-red-500/30`;
    case "warning":
      return `${base} bg-yellow-600/20 border-yellow-500/30`;
    default:
      return `${base} bg-blue-600/20 border-blue-500/30`;
  }
}
