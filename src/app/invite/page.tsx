"use client";
import { useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { useLobbyStore } from "@/store/lobbyStore";
import { neynar } from "@/lib/neynarClient";

export default function InvitePage() {
  const { fid, username } = useAuthStore();
  const { referralCode, referralStatus, createReferral, validateReferral } =
    useLobbyStore();
  const [inputCode, setInputCode] = useState("");
  const [message, setMessage] = useState("");

  const handleValidate = async () => {
    if (!fid) return;
    await validateReferral(inputCode, fid);
    setMessage(
      referralStatus === "success" ? "Referral accepted!" : "Invalid code."
    );
  };

  const handleCreate = async () => {
    if (!fid) return;
    await createReferral(fid);
    setMessage("Referral code created.");
  };

  const handleShare = async () => {
    if (!referralCode) return;
    const castText = `I just joined #Waffles 🎟️ — get your invite: waffles.app/invite/${referralCode}`;
    await neynar.publishCast(fid!, castText);
    setMessage("Shared on Farcaster!");
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen gap-4">
      <h1 className="text-2xl font-bold">Invite Friends to Waffles</h1>

      <div className="flex gap-2">
        <input
          className="px-3 py-2 border rounded-lg text-black"
          placeholder="Enter invite code"
          value={inputCode}
          onChange={(e) => setInputCode(e.target.value)}
        />
        <button
          onClick={handleValidate}
          className="bg-green-600 px-3 py-2 rounded-lg"
        >
          Join
        </button>
      </div>

      <hr className="w-64 border-gray-700 my-4" />

      <button
        onClick={handleCreate}
        className="bg-blue-600 px-4 py-2 rounded-lg"
      >
        Generate My Invite
      </button>

      {referralCode && (
        <div className="mt-4 text-center">
          <p>
            Your invite code: <b>{referralCode}</b>
          </p>
          <button
            onClick={handleShare}
            className="mt-2 bg-purple-600 px-3 py-2 rounded-lg"
          >
            Share on Farcaster
          </button>
        </div>
      )}

      {message && <p className="text-sm text-gray-300 mt-4">{message}</p>}
    </main>
  );
}
