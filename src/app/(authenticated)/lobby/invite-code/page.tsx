"use client";
import LogoIcon from "@/components/logo/LogoIcon";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useLobbyStore } from "@/stores/lobbyStore";
import { PixelInput } from "@/components/inputs/PixelInput";
import { FancyBorderButton } from "@/components/buttons/FancyBorderButton";
import { PixelButton } from "@/components/buttons/PixelButton";
import { useMiniUser } from "@/hooks/useMiniUser";

export default function InviteCodePage() {
  const router = useRouter();
  const {
    referralCode,
    validateReferral,
    referralData,
    referralStatus: status,
    ticket, // added to check if ticket already exists
  } = useLobbyStore();
  const user = useMiniUser();
  // If invite code is already valid, skip to Buy or directly into the game
  useEffect(() => {
    if (status === "success") {
      if (ticket) {
        // already have ticket: go straight into the game
        router.replace("/game");
      } else {
        // have code but no ticket: go to buy page
        router.replace("/lobby/buy");
      }
    }
  }, [status, ticket, router]);

  const [inputCode, setInputCode] = useState(referralCode || "");
  const [error, setError] = useState<string | null>(null);

  // Debounced code validation as user types
  useEffect(() => {
    if (inputCode.trim().length < 4 || !user.fid) {
      setError(null);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        if (!user.fid) {
          console.error("User FID is null");
          return;
        }
        await validateReferral(inputCode, user.fid);
      } catch (err) {
        console.log(err);
        setError("Validation failed");
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [inputCode, validateReferral, user.fid]);

  // On form submit: if code is valid, go to buy page
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCode.trim() || inputCode.trim().length !== 4) return;
    if (!user.fid) {
      console.error("User FID is null");
      return;
    }
    if (status !== "success") {
      if (!user.fid) {
        console.error("User FID is null");
        return;
      }
      await validateReferral(inputCode, user.fid);
      if (useLobbyStore.getState().referralStatus !== "success") {
        setError("Invalid code");
        return;
      }
    }
    router.push("/lobby/buy");
  };

  return (
    <div className="min-h-screen max-w-screen-sm mx-auto px-8 flex flex-col">
      <div
        className={
          "p-4 flex items-center justify-center border-y border-border bg-figmaYay-gradient"
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

          {/* STATUS MESSAGES */}
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
