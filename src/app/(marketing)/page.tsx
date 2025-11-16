import { redirect } from "next/navigation";

export default function Home() {
  // No landing page yet, redirect to /game
  redirect("/game");
}
