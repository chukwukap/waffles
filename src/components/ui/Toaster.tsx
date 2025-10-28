"use client";

import { Toaster as SonnerToaster, toast } from "sonner";

export const notify = {
  success: (msg: string, opts?: object) => toast.success(msg, opts),
  error: (msg: string, opts?: object) => toast.error(msg, opts),
  info: (msg: string, opts?: object) => toast.info(msg, opts),
};

export default function GlobalToaster() {
  return (
    <SonnerToaster
      position="bottom-center"
      theme="dark"
      toastOptions={{
        classNames: {
          toast:
            "bg-[color:var(--surface-card)] border border-[color:var(--surface-stroke)] text-[color:var(--text-primary)] font-display shadow-lg",
          success:
            "!bg-[color:var(--success)] !border-[color:var(--success)] !text-white",
          error:
            "!bg-[color:var(--danger)] !border-[color:var(--danger)] !text-white",
          info: "!bg-[color:var(--color-card)] !border-[color:var(--surface-stroke)] !text-[color:var(--text-primary)]",
        },
      }}
      richColors
      duration={3000}
    />
  );
}
