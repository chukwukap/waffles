// ───────────────────────── src/app/lobby/invite/_components/InviteCodeScreen.tsx ─────────────────────────
"use client";
import LogoIcon from "@/components/logo/LogoIcon";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useLobbyStore } from "@/stores/lobbyStore";
import { PixelInput } from "@/components/inputs/PixelInput";
import { FancyBorderButton } from "@/components/buttons/FancyBorderButton";
import { PixelButton } from "@/components/buttons/PixelButton";

// ───────────────────────── COMPONENT ─────────────────────────

export default function InviteCodePage() {
  const router = useRouter();

  // ───────────────────────── STATE ─────────────────────────
  const {
    referralCode,
    validateReferral,
    referralData,
    referralStatus: status,
  } = useLobbyStore();

  const [inputCode, setInputCode] = useState(referralCode || "");
  const [error, setError] = useState<string | null>(null);

  // ───────────────────────── DEBOUNCED VALIDATION ─────────────────────────
  useEffect(() => {
    if (inputCode.trim().length < 4) {
      setError(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        await validateReferral(inputCode, 1); // ✅ inviteeId = 1 placeholder (auth to replace later)
      } catch (err) {
        console.log(err);
        setError("Validation failed");
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [inputCode, validateReferral]);

  // ───────────────────────── HANDLE SUBMIT ─────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inputCode.trim()) return;

    // Trigger validation if not valid yet
    if (status !== "success") {
      await validateReferral(inputCode, 1);
      if (useLobbyStore.getState().referralStatus !== "success") {
        setError("Invalid code");
        return;
      }
    }

    // ✅ Proceed only if valid
    router.push("/lobby/buy");
  };

  // ───────────────────────── RENDER ─────────────────────────

  return (
    <div className="min-h-screen  flex flex-col">
      <div
        className={
          "p-4 flex items-center justify-center border-y border-border bg-figma-gradient"
        }
      >
        <LogoIcon />
      </div>
      <div className="flex flex-col items-center justify-center py-16">
        {/* ICON */}
        <div className="mb-6">
          <Image
            src="/images/illustration/invite-key.png"
            alt="Invite Key"
            width={105}
            height={105}
            style={{ imageRendering: "pixelated" }}
          />
        </div>

        {/* TITLE */}
        <h2 className="mb-8 text-center text-3xl leading-tight font-bold uppercase tracking-wider">
          <span className="block">ENTER YOUR</span>
          <span className="block">INVITE CODE</span>
        </h2>

        {/* FORM */}
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-md flex flex-col items-center gap-6"
          autoComplete="off"
        >
          <label htmlFor="inviteCodeInput" className="sr-only">
            Invite Code
          </label>

          <PixelInput
            id="inviteCodeInput"
            type="text"
            value={inputCode}
            onChange={(e) => setInputCode(e.target.value.toUpperCase())}
            placeholder="INVITE CODE"
            maxLength={4}
            autoFocus
          />

          <FancyBorderButton disabled={inputCode.trim().length !== 4}>
            GET IN
          </FancyBorderButton>

          {/* STATUS */}
          {status === "validating" && (
            <p
              className="text-xs mt-2"
              style={{
                color: "#a0a0a0",
                fontFamily: "'Press Start 2P', 'Geist Mono', monospace",
                letterSpacing: "0.04em",
              }}
            >
              Validating...
            </p>
          )}

          {status === "failed" && (
            <PixelButton
              className="flex items-center gap-2 font-body"
              backgroundColor="#FF5252"
              borderColor="#FF5252"
              textColor="#FFFFFF"
              onClick={() => setError(null)}
            >
              <Image
                src="/images/icons/icon-invalid.png"
                alt="Invalid Invite Code"
                width={20}
                height={20}
              />
              <span>{error || "Invalid"}</span>
            </PixelButton>
          )}

          {status === "success" && referralData && (
            <PixelButton
              className="flex items-center gap-2 font-body"
              backgroundColor="#14B985"
              borderColor="#14B985"
              textColor="#FFFFFF"
              onClick={() => router.push("/lobby/buy")}
            >
              <Image
                src="/images/icons/icon-valid.png"
                alt="Valid Invite Code"
                width={20}
                height={20}
              />
              <span>Valid</span>
            </PixelButton>
          )}
        </form>
      </div>
    </div>
  );
}
