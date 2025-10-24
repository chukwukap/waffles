// ───────────────────────── src/app/lobby/confirm/_components/ConfirmScreen.tsx ─────────────────────────
"use client";

import React, { useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { FancyBorderButton } from "@/components/buttons/FancyBorderButton";
import { useLobbyStore } from "@/stores/lobbyStore";

export default function ConfirmPage() {
  const router = useRouter();
  const ticket = useLobbyStore((state) => state.ticket);

  const shareButtonRef = useRef<HTMLButtonElement | null>(null);

  // Redirect if no ticket
  useEffect(() => {
    if (!ticket) {
      router.replace("/lobby/buy");
    }
  }, [ticket, router]);

  // Autofocus share
  useEffect(() => {
    shareButtonRef.current?.focus();
  }, []);

  const handleShare = async () => {
    if (!ticket) return;
    const shareData = {
      title: "Waffle Secured!",
      text: "I just grabbed my Waffle ticket for the next on-chain game. See you Friday!",
      url:
        typeof window !== "undefined" ? window.location.origin + "/lobby" : "",
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareData.url);
        alert("Link copied to clipboard!");
      }
      router.replace("/game"); // ✅ Must share before returning
    } catch (err) {
      console.error("Share failed:", err);
      alert("Please share to continue!");
    }
  };

  if (!ticket) return null;

  return (
    <div className="bg-figma noise min-h-[100svh] w-full px-5 py-8">
      {/* HERO */}
      <div className="mx-auto flex max-w-md flex-col items-center gap-3 animate-up">
        <Image
          src="/images/illustration/waffle-ticket.png"
          alt="Waffle"
          width={220}
          height={140}
          priority
          style={{ imageRendering: "pixelated" }}
        />
        <h1 className="text-center font-[var(--font-body)] text-4xl tracking-tight uppercase">
          WAFFLE SECURED!
        </h1>
        <p className="text-center text-[13px] text-muted">
          You&apos;re in. See you Friday.
        </p>
      </div>

      {/* TICKET CARD */}
      <div
        className="mx-auto mt-6 w-full max-w-md rounded-[16px] border border-[color:var(--color-waffle-gold)] bg-[color:var(--white-a10)] p-4 animate-up"
        style={{ animationDelay: "60ms" }}
      >
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="/images/avatars/a.png"
              alt="Avatar"
              width={48}
              height={48}
              className="rounded-full"
            />
            <span className="font-[var(--font-body)] text-lg">POTAT0X</span>
          </div>
          <div className="pixel-corners bg-[color:var(--color-waffle-gold)] px-3 py-2">
            <span className="font-[var(--font-body)] text-[12px] text-black uppercase">
              TICKET #{ticket.id}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <Image
              src="/images/icons/icon-prizepool-cash.png"
              alt="Prize pool"
              width={24}
              height={24}
            />
            <div className="flex flex-col">
              <span className="text-[11px] text-muted">Prize pool</span>
              <span className="font-[var(--font-body)]">$12,500</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Image
              src="/images/icons/icon-theme-football.png"
              alt="Theme"
              width={24}
              height={24}
            />
            <div className="flex flex-col">
              <span className="text-[11px] text-muted">Theme</span>
              <span className="font-[var(--font-body)]">Football</span>
            </div>
          </div>
        </div>
      </div>

      {/* MANDATORY SHARE CTA */}
      <div className="mx-auto mt-6 max-w-md">
        <FancyBorderButton
          ref={shareButtonRef as React.RefObject<HTMLButtonElement>}
          aria-label="Share Ticket"
          onClick={handleShare}
          className="h-[64px] bg-white text-[color:var(--color-neon-pink)]"
        >
          <span className="font-[var(--font-body)] text-2xl">SHARE TICKET</span>
        </FancyBorderButton>
      </div>

      {/* Back Button — now hidden until share */}
      <div className="mx-auto mt-4 flex max-w-md justify-center opacity-40 select-none pointer-events-none">
        <button className="text-[color:var(--color-neon-cyan)] font-[var(--font-body)] text-base uppercase">
          BACK TO HOME
        </button>
      </div>
    </div>
  );
}
