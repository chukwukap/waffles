import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export default function AuthenticatedLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className={cn("min-h-dvh", "bg-figma noise", "text-foreground")}>
      {children}
    </div>
  );
}
