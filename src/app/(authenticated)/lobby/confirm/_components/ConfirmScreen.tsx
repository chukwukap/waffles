"use client";
import React, { useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import useLobbyStore from "@/stores/lobbyStore";
import { FancyBorderButton } from "@/components/buttons/FancyBorderButton";
// PixelButton not required here; using FancyBorderButton for CTA

export default function ConfirmScreen() {
  const router = useRouter();
  const ticket = useLobbyStore((state) => state.purchasedTicket);
  const selectedType = useLobbyStore((state) => state.selectedWaffleType);
  const purchaseStatus = useLobbyStore((state) => state.purchaseStatus);
  const selectWaffleType = useLobbyStore((state) => state.selectWaffleType);
  const purchaseWaffle = useLobbyStore((state) => state.purchaseWaffle);
  const shareButtonRef = useRef<HTMLAnchorElement | null>(null);

  // just for testing this page
  useEffect(() => {
    selectWaffleType("football");
    purchaseWaffle();
  }, [selectWaffleType, purchaseWaffle]);

  // Redirect to invite if accessed without completing purchase
  useEffect(() => {
    // if (purchaseStatus !== "success" || !ticket) {
    //   router.replace("/lobby/invite");
    // }
  }, [purchaseStatus, ticket, router]);

  // Auto-focus the share button on load
  useEffect(() => {
    shareButtonRef.current?.focus();
  }, []);

  if (!ticket || !selectedType) {
    return null;
  }

  function handleShare() {
    console.log("share");
  }

  return (
    <div className="bg-figma noise min-h-[100svh] w-full px-5 py-8">
      {/* Hero */}
      <div className="mx-auto flex max-w-md flex-col items-center gap-3 animate-up">
        <Image
          src="/images/illustration/waffle-ticket.png"
          alt="Waffle"
          width={220}
          height={140}
          priority
          style={{ imageRendering: "pixelated" }}
        />
        <h1
          className="text-center font-[var(--font-body)] text-4xl tracking-tight uppercase"
          style={{ letterSpacing: "0.02em" }}
        >
          WAFFLE SECURED!
        </h1>
        <p className="text-center text-[13px] text-muted">
          You&apos;re in. See you Friday.
        </p>
      </div>

      {/* Ticket Card */}
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
              TICKET #{ticket.ticketId}
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
              <span className="font-[var(--font-body)]">
                {selectedType.name}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Share CTA */}
      <div className="mx-auto mt-6 max-w-md">
        <FancyBorderButton
          aria-label="Share Ticket"
          onClick={handleShare}
          className="h-[64px] bg-white text-[color:var(--color-neon-pink)]"
          autoFocus
        >
          <span className="font-[var(--font-body)] text-2xl">SHARE TICKET</span>
        </FancyBorderButton>
      </div>

      {/* Back link */}
      <div className="mx-auto mt-4 flex max-w-md justify-center">
        <button
          onClick={() => router.replace("/game")}
          className="text-[color:var(--color-neon-cyan)] font-[var(--font-body)] text-base uppercase active:translate-y-[1px]"
        >
          BACK TO HOME
        </button>
      </div>
    </div>
  );
}
