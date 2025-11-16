"use client";

import React, { useEffect, useState, useRef, useCallback, use } from "react";
import Image from "next/image";
import { PixelInput } from "@/components/inputs/PixelInput";
import { FancyBorderButton } from "@/components/buttons/FancyBorderButton";
import { PixelButton } from "@/components/buttons/PixelButton";
import { validateReferralAction } from "@/actions/invite";
import { UserWithInviteData } from "../page";
import { useRouter } from "next/navigation";

export default function InvitePageClient({
  payloadPromise,
}: {
  payloadPromise: Promise<UserWithInviteData | null>;
}) {
  const payload = use(payloadPromise);
  const router = useRouter();
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [status, setStatus] = useState<
    "idle" | "validating" | "success" | "failed"
  >("idle");
  const [inputCode, setInputCode] = useState(
    payload?.referrals?.[0]?.code || ""
  );
  const [error, setError] = useState<string | null>(null);

  const runValidation = useCallback(
    async (codeToValidate: string) => {
      if (!payload?.fid) return;

      const formData = new FormData();
      formData.append("code", codeToValidate);
      formData.append("fid", String(payload.fid));

      const result = await validateReferralAction(null, formData);

      if (result.valid) {
        setError(null);
        console.log("Referral validated");
      } else {
        setError(result.error);
      }
    },
    [payload?.fid]
  );

  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    const trimmedCode = inputCode.trim().toUpperCase();

    if (trimmedCode.length === 0) {
      setError(null);
      return;
    }
    if (trimmedCode.length !== 6) {
      setError(null);
      return;
    }

    debounceTimerRef.current = setTimeout(() => {
      runValidation(trimmedCode);
    }, 500);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [inputCode, runValidation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedCode = inputCode.trim().toUpperCase();

    if (trimmedCode.length !== 6) {
      setError("Code must be 6 characters.");
      setStatus("failed");
      return;
    }
    if (!payload?.fid) {
      setError("User not identified.");
      setStatus("failed");
      return;
    }

    await runValidation(trimmedCode);

    const formData = new FormData();
    formData.append("code", trimmedCode);
    formData.append("fid", String(payload.fid));
    const result = await validateReferralAction(null, formData);

    if (result.valid) {
      setStatus("success");
    }
  };

  return (
    // Outer background container fills all available space and is absolutely positioned
    <div className="relative min-h-screen flex flex-col w-full">
      {/* BG layer (fills parent) */}
      <div
        className="absolute inset-0 w-full h-full app-background-gradient pointer-events-none z-0"
        aria-hidden="true"
      />

      {/* Main invite contents positioned with max width and centered */}
      <div className="z-10 relative flex flex-col flex-1 w-full min-h-screen">
        <div
          className={
            "p-4 flex items-center justify-center border-y border-border bg-transparent"
          }
        >
          <Image src="/images/logo.svg" alt="Logo" width={32} height={32} />
        </div>

        <div className="flex flex-col items-center justify-center flex-1 py-16 px-4">
          <div className="w-full max-w-md mx-auto">
            <div className="mb-6 flex justify-center">
              <Image
                src="/images/illustrations/invite-key.png"
                alt="Invite Key"
                width={105}
                height={105}
                style={{ imageRendering: "pixelated" }}
              />
            </div>
            <h2 className="mb-8 text-center text-3xl leading-tight font-bold uppercase tracking-wider">
              <span className="block">ENTER YOUR</span>
              <span className="block">INVITE CODE</span>
            </h2>
            <form
              onSubmit={handleSubmit}
              className="w-full  flex flex-col items-center gap-6"
              autoComplete="off"
            >
              <label htmlFor="inviteCodeInput" className="sr-only">
                Invite Code
              </label>
              <PixelInput
                id="inviteCodeInput"
                type="text"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value)}
                placeholder="INVITE CODE"
                maxLength={6}
                autoFocus
                style={{ textTransform: "uppercase" }}
              />
              <FancyBorderButton
                disabled={
                  inputCode.trim().length !== 6 || status === "validating"
                }
              >
                {status === "validating" ? "CHECKING..." : "GET IN"}
              </FancyBorderButton>
              {status === "validating" && (
                <p
                  className="text-xs mt-2 text-[#a0a0a0]"
                  style={{
                    fontFamily: "'Press Start 2P', 'Geist Mono', monospace",
                    letterSpacing: "0.04em",
                  }}
                >
                  Validating...
                </p>
              )}
              {status === "failed" && error && (
                <PixelButton
                  className="flex items-center gap-2 font-body"
                  backgroundColor="#FF5252"
                  borderColor="#FF5252"
                  textColor="#FFFFFF"
                  type="button"
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
              {status === "success" && (
                <PixelButton
                  className="flex items-center gap-2 font-body"
                  backgroundColor="#14B985"
                  borderColor="#14B985"
                  textColor="#FFFFFF"
                  onClick={() => router.push("/lobby")}
                  type="button"
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
      </div>
    </div>
  );
}
