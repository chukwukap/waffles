"use client";
import { Toaster, toast } from "sonner";

export const notify = {
  success: (msg: string) => toast.success(msg),
  error: (msg: string) => toast.error(msg),
  info: (msg: string) => toast(msg),
};

export default function GlobalToaster() {
  return <Toaster position="bottom-center" theme="dark" />;
}
