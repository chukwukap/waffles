import InvitePageClient from "./client";
import { minikitConfig } from "../../../../minikit.config";

import { Metadata } from "next";

export const metadata: Metadata = {
  title: minikitConfig.miniapp.name,
  description: "You're invited to join the waitlist.",
};

export default function InvitePage() {
  return <InvitePageClient />;
}
