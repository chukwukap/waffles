"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { sendUSDC } from "@/lib/payments";
import { useAuthStore } from "@/stores/authStore";
import { useTicketStore } from "@/stores/ticketStore";

export default function BuyPage() {
  const { address } = useAccount();
  const { fid } = useAuthStore();
  const { ticket, purchaseStatus, buyTicket } = useTicketStore();

  const [amount] = useState("50");
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState("");

  const handleBuy = async () => {
    if (!address || !fid) return alert("Wallet or user not detected");
    try {
      setLoading(true);
      const hash = await sendUSDC(amount);
      setTxHash(hash);
      await buyTicket(fid, 1, parseFloat(amount)); // assume gameId = 1
    } catch (err) {
      console.error(err);
      alert("Transaction failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen gap-4">
      <h1 className="text-2xl font-bold">Buy Your Waffle 🎟️</h1>
      <p className="text-gray-300">Entry Fee: {amount} USDC</p>

      <button
        disabled={loading}
        onClick={handleBuy}
        className="bg-blue-600 px-5 py-3 rounded-lg hover:bg-blue-700"
      >
        {loading ? "Processing..." : "Buy Ticket"}
      </button>

      {txHash && (
        <p className="mt-3 text-xs text-gray-400">
          TX Hash: {txHash.slice(0, 8)}...
        </p>
      )}

      {purchaseStatus === "confirmed" && (
        <a
          href="/confirm"
          className="mt-4 bg-green-600 px-4 py-2 rounded-lg hover:bg-green-700"
        >
          View Confirmation
        </a>
      )}
    </main>
  );
}
