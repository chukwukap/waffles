"use client";

import { type ReactNode } from "react";
import { useUser } from "@/hooks/useUser";
import { WaffleLoader } from "@/components/ui/WaffleLoader";
import InvitePageClient from "@/app/(app)/invite/client";

/**
 * GameAuthGate - Protects game routes.
 * If user is ACTIVE: render game content.
 * If user is NOT ACTIVE: render invite form inline (no redirects).
 */
export function GameAuthGate({ children }: { children: ReactNode }) {
  const { user, isLoading, refetch } = useUser();

  const isAuthorized = user?.hasGameAccess && !user?.isBanned;

  // Loading state
  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <WaffleLoader text="LOADING..." />
      </div>
    );
  }

  // Not authorized → show invite form inline (no redirect)
  // Pass refetch so child can update parent's user state
  if (!isAuthorized) {
    return <InvitePageClient onSuccess={refetch} />;
  }

  // Authorized → render game
  return <>{children}</>;
}

