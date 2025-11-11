import { Spinner } from "@/components/ui/spinner";

export default function GameLoading() {
  return (
    <div className="w-full h-screen flex items-center justify-center">
      <Spinner className="size-10" />
    </div>
  );
}
