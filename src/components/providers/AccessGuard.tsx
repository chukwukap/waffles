/**
 * AccessGuard - Game access control component
 *
 * Checks if user has game access and redirects to /redeem if not.
 * This is a standalone component that doesn't require WebSocket or game data.
 * Used at the layout level to protect all game routes.
 */

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/hooks/useUser";
import { WaffleLoader } from "@/components/ui/WaffleLoader";

interface AccessGuardProps {
  children: React.ReactNode;
}

export function AccessGuard({ children }: AccessGuardProps) {
  const router = useRouter();
  const { user, isLoading } = useUser();

  // Redirect if user doesn't have game access
  useEffect(() => {
    if (!isLoading && (!user || !user.hasGameAccess || user.isBanned)) {
      router.replace("/redeem");
    }
  }, [user, isLoading, router]);

  // Show loader while checking access
  if (isLoading) {
    return <WaffleLoader />;
  }

  // Don't render children if access denied (redirect will happen)
  if (!user || !user.hasGameAccess || user.isBanned) {
    return null;
  }

  return <>{children}</>;
}
