"use client";

import type React from "react";

import { useState } from "react";
import Logo from "@/components/logo/Logo";
import { Key, Ticket } from "lucide-react";
import { InviteShareModal } from "@/components/modals/InviteShareModal";

type LobbyStep = "invite" | "purchase" | "theme" | "secured";

export default function LobbyPage() {
  const [step, setStep] = useState<LobbyStep>("invite");
  const [inviteCode, setInviteCode] = useState("");
  const [selectedTheme, setSelectedTheme] = useState<string>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [showShareModal, setShowShareModal] = useState(false);

  // Mock data
  const prizePool = "$2,500";
  const ticketPrice = "50 USDC";
  const userBalance = "$703.23";
  const themes = [
    { id: "football", name: "FOOTBALL", icon: "⚽", emoji: "⚽" },
    { id: "basketball", name: "BASKETBALL", icon: "🏀", emoji: "🏀" },
    { id: "movies", name: "MOVIES", icon: "🎬", emoji: "🎬" },
  ];

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(undefined);

    await new Promise((resolve) => setTimeout(resolve, 800));

    if (inviteCode.length >= 2) {
      setStep("purchase");
    } else {
      setError("Invalid code");
    }
    setIsLoading(false);
  };

  const handlePurchase = async () => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setStep("theme");
    setIsLoading(false);
  };

  const handleThemeSelect = async (themeId: string) => {
    setSelectedTheme(themeId);
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 800));
    setStep("secured");
    setIsLoading(false);
  };

  const handleShareInvite = () => {
    const text = encodeURIComponent(
      "Join me on Waffles! Use my code: " + inviteCode
    );
    const url = `https://twitter.com/intent/tweet?text=${text}`;
    window.open(url, "_blank");
  };

  return (
    <div className="min-h-screen  flex flex-col">
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-gray-900">
        <Logo />
        <div className="text-waffle-gold font-bold font-mono text-sm">
          💎 {userBalance}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Step 1: Enter Invite Code */}
          {step === "invite" && (
            <div className="space-y-8 animate-fade-in">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 mb-6">
                  <Key className="w-14 h-14 text-[#ff6b4a]" strokeWidth={2.5} />
                </div>
                <h1
                  className="text-white font-black text-2xl tracking-tight"
                  style={{ fontFamily: "monospace" }}
                >
                  ENTER YOUR
                </h1>
                <h1
                  className="text-white font-black text-2xl tracking-tight"
                  style={{ fontFamily: "monospace" }}
                >
                  INVITE CODE
                </h1>
              </div>

              <form onSubmit={handleInviteSubmit} className="space-y-4">
                <div className="relative">
                  <input
                    type="text"
                    value={inviteCode}
                    onChange={(e) =>
                      setInviteCode(e.target.value.toUpperCase())
                    }
                    placeholder="C1"
                    className="w-full bg-[#0a0a0a] border-2 border-gray-800 rounded-xl px-6 py-5 text-center text-3xl font-black text-white tracking-widest focus:border-[#ff6b4a] focus:outline-none transition-colors placeholder:text-gray-700"
                    style={{ fontFamily: "monospace" }}
                  />
                  {error && (
                    <p className="absolute -bottom-6 left-0 right-0 text-center text-sm text-red-500 font-mono">
                      {error}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={!inviteCode || isLoading}
                  className="w-full bg-white text-black font-black text-lg py-4 rounded-xl hover:bg-gray-100 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{ fontFamily: "monospace" }}
                >
                  {isLoading ? "CHECKING..." : "GET IN"}
                </button>
              </form>

              <div className="text-center">
                <button
                  onClick={handleShareInvite}
                  className="text-[#ff6b4a] font-bold text-sm hover:text-[#ff8a6a] transition-colors"
                  style={{ fontFamily: "monospace" }}
                >
                  🔗 SHARE ON X
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Get Your Waffle (Purchase) */}
          {step === "purchase" && (
            <div className="space-y-8 animate-fade-in">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-32 h-32 mb-6">
                  <div className="relative w-full h-full">
                    <div className="absolute inset-0 bg-gradient-to-br from-waffle-gold via-orange-400 to-waffle-gold rounded-2xl transform rotate-3" />
                    <div className="absolute inset-2 bg-gradient-to-br from-yellow-300 via-waffle-gold to-orange-500 rounded-xl flex items-center justify-center">
                      <Ticket
                        className="w-12 h-12 text-white"
                        strokeWidth={2.5}
                      />
                    </div>
                  </div>
                </div>
                <h1
                  className="text-white font-black text-2xl mb-2"
                  style={{ fontFamily: "monospace" }}
                >
                  GET YOUR
                </h1>
                <h1
                  className="text-white font-black text-2xl mb-6"
                  style={{ fontFamily: "monospace" }}
                >
                  WAFFLE
                </h1>
              </div>

              <div className="space-y-4">
                <button
                  onClick={handlePurchase}
                  disabled={isLoading}
                  className="w-full bg-white text-black font-black text-lg py-5 rounded-xl hover:bg-gray-100 transition-all disabled:opacity-50"
                  style={{ fontFamily: "monospace" }}
                >
                  {isLoading ? "PROCESSING..." : "BUY WAFFLE"}
                </button>

                <div className="text-center space-y-2">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-8 h-6 bg-gradient-to-r from-waffle-gold via-orange-400 to-waffle-gold rounded" />
                    <div className="w-8 h-6 bg-gradient-to-r from-waffle-gold via-orange-400 to-waffle-gold rounded" />
                    <div className="w-8 h-6 bg-gradient-to-r from-waffle-gold via-orange-400 to-waffle-gold rounded" />
                  </div>
                  <p
                    className="text-cyan-400 font-black text-xl"
                    style={{ fontFamily: "monospace" }}
                  >
                    {ticketPrice}
                  </p>
                  <p className="text-gray-500 text-xs font-mono">
                    Prize pool: {prizePool}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Theme Selection */}
          {step === "theme" && (
            <div className="space-y-8 animate-fade-in">
              <div className="text-center">
                <h1
                  className="text-white font-black text-3xl mb-8"
                  style={{ fontFamily: "monospace" }}
                >
                  {selectedTheme
                    ? themes.find((t) => t.id === selectedTheme)?.name
                    : "FOOTBALL"}
                </h1>
                <div className="text-8xl mb-8">
                  {selectedTheme
                    ? themes.find((t) => t.id === selectedTheme)?.emoji
                    : "⚽"}
                </div>
              </div>

              <div className="space-y-4">
                <div className="text-center space-y-2 mb-6">
                  <p className="text-gray-400 text-sm font-mono">Prize pool</p>
                  <p
                    className="text-cyan-400 font-black text-2xl"
                    style={{ fontFamily: "monospace" }}
                  >
                    {prizePool}
                  </p>
                </div>

                <button
                  onClick={() => handleThemeSelect("football")}
                  disabled={isLoading}
                  className="w-full bg-white text-black font-black text-lg py-5 rounded-xl hover:bg-gray-100 transition-all disabled:opacity-50"
                  style={{ fontFamily: "monospace" }}
                >
                  {isLoading ? "SECURING..." : `BUY WAFFLE ${ticketPrice}`}
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Waffle Secured */}
          {step === "secured" && (
            <div className="space-y-8 animate-fade-in">
              <div className="text-center">
                <h1
                  className="text-waffle-gold font-black text-2xl mb-8"
                  style={{ fontFamily: "monospace" }}
                >
                  WAFFLE SECURED!
                </h1>

                <div className="bg-[#0a0a0a] border-2 border-waffle-gold rounded-2xl p-6 space-y-6">
                  {/* User info */}
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-2xl">
                      👤
                    </div>
                    <div className="text-left">
                      <p
                        className="text-white font-black text-lg"
                        style={{ fontFamily: "monospace" }}
                      >
                        @username
                      </p>
                      <p className="text-gray-500 text-sm font-mono">
                        Ticket #12
                      </p>
                    </div>
                  </div>

                  {/* Theme */}
                  <div className="flex items-center justify-between py-4 border-t border-b border-gray-800">
                    <div className="flex items-center gap-3">
                      <div className="text-3xl">⚽</div>
                      <span className="text-white font-bold font-mono">
                        FOOTBALL
                      </span>
                    </div>
                  </div>

                  {/* Prize pool */}
                  <div className="text-center">
                    <p className="text-gray-400 text-sm font-mono mb-1">
                      Prize pool
                    </p>
                    <p
                      className="text-cyan-400 font-black text-2xl"
                      style={{ fontFamily: "monospace" }}
                    >
                      {prizePool}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => setShowShareModal(true)}
                  className="w-full bg-waffle-gold text-black font-black text-base py-4 rounded-xl hover:bg-yellow-500 transition-all"
                  style={{ fontFamily: "monospace" }}
                >
                  SHARE INVITE
                </button>
                <button
                  onClick={() => (window.location.href = "/game")}
                  className="w-full bg-white text-black font-black text-base py-4 rounded-xl hover:bg-gray-100 transition-all"
                  style={{ fontFamily: "monospace" }}
                >
                  GO TO LOBBY
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Share modal */}
      <InviteShareModal
        open={showShareModal}
        onOpenChange={setShowShareModal}
        inviteCode={inviteCode || "EVWE"}
      />
    </div>
  );
}
