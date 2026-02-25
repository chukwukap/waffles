import { minikitConfig } from "@minikit-config";
import InvitePageClient from "./client";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: minikitConfig.miniapp.name,
  description: "Enter your invite code to access the game.",
};

export default function InvitePage() {
  return <InvitePageClient />;
}
