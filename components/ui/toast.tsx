"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Check, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastType = "success" | "error" | "info";

export interface ToastInput {
  type?: ToastType;
  title: string;
  description?: string;
  /** Auto-dismiss after this many ms. Default 3800. Pass 0 to disable. */
  durationMs?: number;
}

interface Toast extends Required<Omit<ToastInput, "description">> {
  id: string;
  description?: string;
}

interface ToastContextValue {
  toast: (t: ToastInput) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast() must be used inside <ToastProvider>");
  return ctx;
}

const ICONS = {
  success: Check,
  error: AlertTriangle,
  info: Info,
} as const;

const TONE_STYLES: Record<ToastType, string> = {
  success: "border-spykar-success/40 bg-white",
  error: "border-spykar-red/40 bg-white",
  info: "border-border bg-white",
};

const ICON_STYLES: Record<ToastType, string> = {
  success: "bg-spykar-success text-white",
  error: "bg-spykar-red text-white",
  info: "bg-spykar-ink text-white",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((cur) => cur.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (input: ToastInput) => {
      const id = `t-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const item: Toast = {
        id,
        type: input.type ?? "success",
        title: input.title,
        description: input.description,
        durationMs: input.durationMs ?? 3800,
      };
      setToasts((cur) => [...cur, item]);
      if (item.durationMs > 0) {
        window.setTimeout(() => dismiss(id), item.durationMs);
      }
    },
    [dismiss]
  );

  const value = useMemo(() => ({ toast, dismiss }), [toast, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 top-4 z-[60] flex flex-col items-center gap-2 px-4 sm:left-auto sm:right-4 sm:items-end"
        aria-live="polite"
        aria-atomic="false"
      >
        <AnimatePresence>
          {toasts.map((t) => {
            const Icon = ICONS[t.type];
            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: -16, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                transition={{ duration: 0.18 }}
                className={cn(
                  "pointer-events-auto w-full max-w-sm rounded-lg border p-4 shadow-xl",
                  TONE_STYLES[t.type]
                )}
                role={t.type === "error" ? "alert" : "status"}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                      ICON_STYLES[t.type]
                    )}
                  >
                    <Icon className="h-4 w-4" strokeWidth={2.5} aria-hidden />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-bold text-spykar-ink">
                      {t.title}
                    </div>
                    {t.description && (
                      <div className="mt-0.5 text-xs text-muted-foreground">
                        {t.description}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => dismiss(t.id)}
                    aria-label="Dismiss"
                    className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
