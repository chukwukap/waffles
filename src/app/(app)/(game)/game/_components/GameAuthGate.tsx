"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/hooks/useUser";
import { WaffleLoader } from "@/components/ui/WaffleLoader";

/**
 * GameAuthGate - Protects game routes.
 * Only users with status "ACTIVE" (invited) can access.
 */
export function GameAuthGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { user, isLoading } = useUser();

  const isAuthorized = user?.status === "ACTIVE";

  useEffect(() => {
    // Once loaded, redirect if not authorized
    if (!isLoading && !isAuthorized) {
      router.replace("/invite");
    }
  }, [isLoading, isAuthorized, router]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <WaffleLoader text="CHECKING ACCESS..." />
      </div>
    );
  }

  // Not authorized → redirecting
  if (!isAuthorized) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <WaffleLoader text="REDIRECTING..." />
      </div>
    );
  }

  // Authorized → render game
  return <>{children}</>;
}

