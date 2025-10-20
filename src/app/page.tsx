import { redirect } from "next/navigation";

export default function HomePage() {
  // Redirect to onboarding for new users
  redirect("/onboarding");
}
