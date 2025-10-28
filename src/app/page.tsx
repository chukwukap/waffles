import { redirect } from "next/navigation";

/**
 * Root page component for the application.
 * Immediately redirects users to the main lobby view ('/lobby').
 * This is handled server-side for efficiency.
 */
export default function Home() {
  redirect("/lobby");
}
