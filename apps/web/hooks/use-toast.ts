import { useState, useCallback } from "react";

export interface Toast {
  id: string;
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
}

type ToastVariant = "success" | "error" | "info";

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback(
    (message: string, variant: ToastVariant = "info") => {
      const id = Math.random().toString(36).substring(7);
      const mappedVariant = variant === "error" ? "destructive" : "default";
      setToasts((prev) => [
        ...prev,
        { id, title: message, variant: mappedVariant },
      ]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 5000);
    },
    [],
  );

  return { showToast, toasts };
}
