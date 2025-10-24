"use client";

import { useIsMobile } from "@/hooks/useIsMobile";
import Image from "next/image";
import { useEffect } from "react";

type Props = {
  children: React.ReactNode;
  /** show a tiny bypass for QA in non-prod */
  continueAnyway?: boolean;
  /** optional store/deeplink helpers */
  appLinks?: {
    ios?: string;
    android?: string;
    webFallback?: string;
  };
  /** optional QR image path in /public (or remote) */
  qrSrc?: string;
};

export default function DeviceGate({
  children,
  continueAnyway = false,
  appLinks,
  qrSrc = "/qr-mobile.png",
}: Props) {
  const isMobile = useIsMobile();

  // lock background scroll when blocked
  useEffect(() => {
    if (!isMobile) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [isMobile]);

  if (isMobile) return <>{children}</>;

  return (
    <div className="relative min-h-dvh w-full bg-figma text-foreground noise">
      {/* subtle radial glow */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.06),transparent_60%)]" />

      <div className="mx-auto flex min-h-dvh max-w-screen-md items-center px-4 sm:px-6">
        <section
          role="dialog"
          aria-labelledby="dg-title"
          aria-describedby="dg-desc"
          className="w-full rounded-[var(--radius-md)] border border-[var(--surface-stroke)] bg-[var(--surface-card)]/95 backdrop-blur p-6 sm:p-8 animate-up"
        >
          <header className="flex items-center justify-between gap-4">
            <h1
              id="dg-title"
              className="text-xl sm:text-2xl font-semibold tracking-tight"
            >
              Open on your phone
            </h1>
            {/* badge */}
            <span className="hidden sm:inline-flex items-center rounded-full bg-[var(--white-a10)] px-3 py-1 text-xs text-[color:var(--text-muted)]">
              Mobile only
            </span>
          </header>

          <p
            id="dg-desc"
            className="mt-3 text-sm sm:text-base leading-6 text-[color:var(--text-muted)]"
          >
            This experience is optimized for mobile. Please scan the code or
            open the link on your phone.
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {/* QR / preview */}
            <div className="flex items-center justify-center rounded-[var(--radius-md)] border border-[var(--surface-stroke)] bg-black/40 p-4">
              {/* Replace with your QR; or remove block */}
              <Image
                src={qrSrc}
                alt="Open on mobile"
                width={160}
                height={160}
                className="rounded-md"
              />
            </div>

            <div className="flex flex-col justify-center gap-3">
              {appLinks?.ios && (
                <a
                  href={appLinks.ios}
                  className="inline-flex items-center justify-center rounded-full px-4 py-3 text-sm font-medium text-foreground bg-[var(--accent-soft)] hover:bg-[var(--white-a13)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-ring)]"
                >
                  Download on the App Store
                </a>
              )}
              {appLinks?.android && (
                <a
                  href={appLinks.android}
                  className="inline-flex items-center justify-center rounded-full px-4 py-3 text-sm font-medium text-foreground bg-[var(--accent-soft)] hover:bg-[var(--white-a13)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-ring)]"
                >
                  Get it on Google Play
                </a>
              )}
              {appLinks?.webFallback && (
                <a
                  href={appLinks.webFallback}
                  className="inline-flex items-center justify-center rounded-full px-4 py-3 text-sm font-medium text-foreground bg-[var(--accent-soft)] hover:bg-[var(--white-a13)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-ring)]"
                >
                  Send link to my phone
                </a>
              )}

              {continueAnyway && (
                <button
                  onClick={() => {
                    sessionStorage.setItem("forceDesktop", "1");
                    location.reload();
                  }}
                  className="mt-1 self-start text-xs text-[color:var(--text-muted)] underline underline-offset-4 hover:text-foreground"
                >
                  Continue on desktop (not supported)
                </button>
              )}
            </div>
          </div>

          <footer className="mt-6 text-center text-xs text-[color:var(--text-muted)]">
            If you’re already on mobile and still see this, disable desktop mode
            or try rotating your device.
          </footer>
        </section>
      </div>
    </div>
  );
}
