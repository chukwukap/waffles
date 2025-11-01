import { redirect } from "next/navigation";
import { getCurrentUserFid } from "@/lib/auth";

/**
 * Root page component for the application.
 * Immediately redirects users to the main lobby view ('/lobby').
 * This is handled server-side for efficiency.
 */
export default async function Home() {
  console.log("fid in home page", await getCurrentUserFid());
  redirect("/lobby");
}
