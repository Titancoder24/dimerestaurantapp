import { create } from "zustand";

export type ToastKind = "success" | "error" | "warn" | "info";

export type ToastItem = {
  id: string;
  kind: ToastKind;
  title: string;
  message?: string;
};

type ToastState = {
  toasts: ToastItem[];
  push: (kind: ToastKind, title: string, message?: string) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  warn: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
  dismiss: (id: string) => void;
};

export const useToast = create<ToastState>((set, get) => ({
  toasts: [],
  push: (kind, title, message) => {
    const id = Math.random().toString(36).slice(2);
    set((s) => ({ toasts: [...s.toasts, { id, kind, title, message }] }));
    setTimeout(() => get().dismiss(id), 4000);
  },
  success: (t, m) => get().push("success", t, m),
  error: (t, m) => get().push("error", t, m),
  warn: (t, m) => get().push("warn", t, m),
  info: (t, m) => get().push("info", t, m),
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));
