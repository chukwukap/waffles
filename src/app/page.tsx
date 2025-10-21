import { redirect } from "next/navigation";

export default function HomePage() {
  // Redirect to onboarding for new users
  redirect("/onboarding");
}

// do not hardcode the figma values ofc -- make your coding of the figma codes responsive
