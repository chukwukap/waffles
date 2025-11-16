import { Spinner } from "@/components/ui/spinner";

export default function InviteLoading() {
  return (
    <div className="w-full h-screen flex flex-col items-center justify-center gap-4">
      <Spinner className="size-10" />
      <p className="text-white/60 text-sm font-display">Invite Friends</p>
    </div>
  );
}

