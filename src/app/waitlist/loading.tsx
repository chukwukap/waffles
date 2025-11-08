import { Spinner } from "@/components/ui/spinner";

export default function WaitlistLoading() {
  return (
    <div className="w-full h-screen flex items-center justify-center">
      <Spinner className="size-10" />
    </div>
  );
}
