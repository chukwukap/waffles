"use client";
import React, { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import useLobbyStore from "@/stores/lobbyStore";

export default function ConfirmScreen() {
  const router = useRouter();
  const ticket = useLobbyStore((state) => state.purchasedTicket);
  const selectedType = useLobbyStore((state) => state.selectedWaffleType);
  const purchaseStatus = useLobbyStore((state) => state.purchaseStatus);
  const shareButtonRef = useRef<HTMLAnchorElement | null>(null);

  // Redirect to invite if accessed without completing purchase
  useEffect(() => {
    if (purchaseStatus !== "success" || !ticket) {
      router.replace("/lobby/invite");
    }
  }, [purchaseStatus, ticket, router]);

  // Auto-focus the share button on load
  useEffect(() => {
    shareButtonRef.current?.focus();
  }, []);

  if (!ticket || !selectedType) {
    return null;
  }

  const tweetText = `I just secured my spot in the Waffles tournament! See you in the next game.`;
  const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    tweetText
  )}`;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4 text-center">Waffle Secured!</h2>
      <p className="text-lg mb-2 text-center">
        You have successfully purchased a Waffles ticket.
      </p>
      <div className="mb-4 text-center">
        <p className="text-sm">
          Ticket ID: <span className="font-mono">{ticket.ticketId}</span>
        </p>
        <p className="text-sm">Waffle Type: {selectedType.name}</p>
      </div>
      <p className="mb-6 text-center">See you in the upcoming tournament!</p>
      <p className="mb-8 text-center text-xs text-gray-500">
        Our app is still in beta.
      </p>
      <div className="text-center">
        <a
          href={tweetUrl}
          target="_blank"
          rel="noopener noreferrer"
          ref={shareButtonRef}
          className="inline-block px-5 py-2 rounded-md border border-[#00cff2] text-[#00cff2] font-medium hover:bg-[#00cff2] hover:text-black focus:outline-none focus:ring-2 focus:ring-[#00cff2] focus:ring-offset-2 focus:ring-offset-black transition"
        >
          Share on Twitter
        </a>
      </div>
    </div>
  );
}
