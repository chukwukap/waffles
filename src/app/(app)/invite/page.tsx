import { minikitConfig } from "../../../../minikit.config";
import InvitePageClient from "./client";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: minikitConfig.miniapp.name,
  description: "You're invited to join the waitlist.",
};

export default function InvitePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#191919]" />}>
      <InvitePageClient />
    </Suspense>
  );
}
