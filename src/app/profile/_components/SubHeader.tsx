import { ArrowLeftIcon } from "@/components/icons";
import Link from "next/link";

export const SubHeader = ({ title }: { title: string }) => (
  <div className="mx-auto flex w-full max-w-lg items-center justify-between px-4 pt-4">
    <Link
      href="/profile"
      className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-white/15 transition-opacity hover:opacity-80"
      aria-label="Back to profile"
    >
      <ArrowLeftIcon />
    </Link>
    <h1
      className="grow text-center text-white font-body"
      style={{
        fontWeight: 400,
        fontSize: "clamp(1.25rem, 4.5vw, 1.375rem)",
        lineHeight: ".92",
        letterSpacing: "-0.03em",
      }}
    >
      {title}
    </h1>
    <div className="h-[34px] w-[34px]" aria-hidden="true" />
  </div>
);
