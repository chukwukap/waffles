import { Spinner } from "@/components/ui/spinner";

export default function JoinGameLoading() {
  return (
    <div className="w-full h-screen flex flex-col items-center justify-center gap-4">
      <Spinner className="size-10" />
      <p className="text-white/60 text-sm font-display">Joining Game</p>
    </div>
  );
}

