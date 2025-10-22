"use client";
import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import useLobbyStore from "@/stores/lobbyStore";
import Image from "next/image";
import { PixelInput } from "@/components/inputs/PixelInput";
import { FancyBorderButton } from "@/components/buttons/FancyBorderButton";
import { PixelButton } from "@/components/buttons/PixelButton";

export default function InviteCodeScreen() {
  const router = useRouter();
  const inviteCode = useLobbyStore((state) => state.inviteCode);
  const status = useLobbyStore((state) => state.inviteCodeStatus);
  const error = useLobbyStore((state) => state.codeError);
  const setInviteCode = useLobbyStore((state) => state.setInviteCode);
  const validateInviteCode = useLobbyStore((state) => state.validateInviteCode);

  // Auto-validate invite code in "real-time" with debounce
  useEffect(() => {
    if (inviteCode.trim().length < 4) {
      // don't validate if code is too short
      return;
    }
    const timer = setTimeout(() => {
      validateInviteCode(inviteCode);
    }, 500);
    return () => clearTimeout(timer);
  }, [inviteCode, validateInviteCode]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode) return;
    // If not already valid, validate on submit
    if (status !== "valid") {
      await validateInviteCode(inviteCode);
      if (useLobbyStore.getState().inviteCodeStatus !== "valid") {
        // validation failed, do not proceed
        return;
      }
    }
    // If valid, proceed to next step
    router.push("/lobby/buy");
  };

  return (
    <div className="flex flex-col items-center justify-center py-16">
      {/* Key Icon */}
      <div className="mb-6">
        <Image
          src="/images/illustration/invite-key.png"
          alt="Invite Key"
          width={105}
          height={105}
          style={{ imageRendering: "pixelated" }}
        />
      </div>
      {/* Title */}
      <h2 className="mb-8 text-center text-3xl leading-tight font-bold uppercase tracking-wider">
        <span style={{ display: "block" }}>ENTER YOUR</span>
        <span style={{ display: "block" }}>INVITE CODE</span>
      </h2>
      {/* Form */}
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
          value={inviteCode}
          onChange={(e) => setInviteCode(e.target.value)}
          placeholder="INVITE CODE"
          maxLength={4}
          autoFocus
        />

        <FancyBorderButton disabled={inviteCode.trim().length !== 4}>
          GET IN
        </FancyBorderButton>

        {/* Status Messages */}
        {status === "checking" && (
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

        {status === "invalid" && error && (
          <PixelButton
            className="flex items-center gap-2 font-body"
            backgroundColor="#FF5252"
            borderColor="#FF5252"
            textColor="#FFFFFF"
            onClick={() => {}}
          >
            <Image
              src="/images/icons/icon-invalid.png"
              alt="Invalid Invite Code"
              width={20}
              height={20}
            />
            <span>Invalid</span>
          </PixelButton>
        )}
        {status === "valid" && (
          <PixelButton
            className="flex items-center gap-2 font-body"
            backgroundColor="#14B985"
            borderColor="#14B985"
            textColor="#FFFFFF"
            onClick={() => {}}
          >
            <Image
              src="/images/icons/icon-valid.png"
              alt="Invalid Invite Code"
              width={20}
              height={20}
            />
            <span>Valid</span>
          </PixelButton>
        )}
      </form>
    </div>
  );
}
