"use client";

import { ToastProvider } from "@/components/providers/ToastProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return <ToastProvider>{children}</ToastProvider>;
}
