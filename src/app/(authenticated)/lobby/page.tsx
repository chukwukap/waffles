import { redirect } from "next/navigation";

export default function LobbyPage() {
  redirect("/game");
  return null;
}
