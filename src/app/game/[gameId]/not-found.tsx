import Link from "next/link";
import { FancyBorderButton } from "@/components/buttons/FancyBorderButton";
import LogoIcon from "@/components/logo/LogoIcon";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80dvh] text-center px-4">
      <LogoIcon className="w-12 h-12 mb-4" />
      <h1 className="text-2xl font-bold text-foreground mb-2">
        Game Not Found
      </h1>
      <p className="text-md text-muted-foreground mb-8">
        Sorry, we couldn&apos;t find that game.
        <br />
        It may have ended, been cancelled, or does not exist.
      </p>
      <div className="flex flex-col sm:flex-row gap-4">
        <FancyBorderButton>
          <Link href="/lobby">Back to Lobby</Link>
        </FancyBorderButton>
        <FancyBorderButton>
          <Link href="/">Home</Link>
        </FancyBorderButton>
        <FancyBorderButton>
          <Link href="/waitlist">Join the Waitlist</Link>
        </FancyBorderButton>
      </div>
    </div>
  );
}
