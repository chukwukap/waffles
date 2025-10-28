"use client";

import LogoIcon from "@/components/logo/LogoIcon";
import React, { useEffect, useState, useRef, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/state/store";
import { PixelInput } from "@/components/inputs/PixelInput";
import { FancyBorderButton } from "@/components/buttons/FancyBorderButton";
import { PixelButton } from "@/components/buttons/PixelButton";
import { useMiniUser } from "@/hooks/useMiniUser";
import { validateReferralAction } from "@/actions/invite";

type ValidationStatus = "idle" | "validating" | "success" | "failed";

export default function InviteCodePage() {
  const router = useRouter();
  const { invitedBy, ticket } = useAppStore();
  const user = useMiniUser();
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (ticket) {
      router.replace("/game");
    }
  }, [ticket, router]);

  const [inputCode, setInputCode] = useState(invitedBy?.code || "");
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<ValidationStatus>(
    invitedBy?.code ? "success" : "idle"
  );

  const runValidation = useCallback(
    async (codeToValidate: string) => {
      if (!user.fid) return;

      setStatus("validating");
      setError(null);

      const formData = new FormData();
      formData.append("code", codeToValidate);
      formData.append("fidString", String(user.fid));

      const result = await validateReferralAction(null, formData);

      if (result.valid) {
        setStatus("success");
        setError(null);
      } else {
        setStatus("failed");
        setError(result.error);
      }
    },
    [user.fid]
  );

  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    const trimmedCode = inputCode.trim().toUpperCase();

    if (trimmedCode.length === 0) {
      setStatus("idle");
      setError(null);
      return;
    }
    if (trimmedCode.length !== 6) {
      setStatus("idle");
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
    if (!user.fid) {
      setError("User not identified.");
      setStatus("failed");
      return;
    }

    await runValidation(trimmedCode);

    const formData = new FormData();
    formData.append("code", trimmedCode);
    formData.append("fidString", String(user.fid));
    const result = await validateReferralAction(null, formData);

    if (result.valid) {
      router.push("/buy");
    }
  };

  return (
    <div className="min-h-screen max-w-screen-sm mx-auto px-8 flex flex-col">
      <div
        className={
          "p-4 flex items-center justify-center border-y border-border bg-figma-gradient"
        }
      >
        <LogoIcon />
      </div>
      <div className="flex flex-col items-center justify-center py-16">
        <div className="mb-6">
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
            onChange={(e) => setInputCode(e.target.value)}
            placeholder="INVITE CODE"
            maxLength={6}
            autoFocus
            style={{ textTransform: "uppercase" }}
          />
          <FancyBorderButton
            disabled={inputCode.trim().length !== 6 || status === "validating"}
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
              onClick={() => router.push("/buy")}
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
  );
}
