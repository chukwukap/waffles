"use client";

import React, {
  useEffect,
  useState,
  useRef,
  useCallback,
  startTransition,
} from "react";
import Image from "next/image";

import { FancyBorderButton } from "@/components/buttons/FancyBorderButton";
import {
  validateReferralAction,
  type ValidateReferralResult,
} from "@/actions/invite";
import { useMiniKit, useComposeCast } from "@coinbase/onchainkit/minikit";
import { WaffleLoader } from "@/components/ui/WaffleLoader";
import { useActionState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { InvitePageHeader } from "./_components/InviteHeader";
import { InviteInput } from "./_components/InviteInput";
import { InfoButton, FailedIcon, SuccessIcon } from "./_components/InfoButton";
import { validateReferralSchema } from "@/lib/schemas";
export default function InvitePageClient() {
  const { context } = useMiniKit();
  const fid = context?.user?.fid;
  const router = useRouter();
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const searchParams = useSearchParams();
  const initialCode = searchParams.get("code") || searchParams.get("ref") || "";

  const [isLoading, setIsLoading] = useState(false); // Start false, no fetch needed
  const [status, setStatus] = useState<
    "idle" | "validating" | "success" | "failed"
  >("idle");
  const [inputCode, setInputCode] = useState(initialCode);
  const [error, setError] = useState<string | null>(null);
  console.log(error)

  const [validationState, validateAction, isPending] = useActionState<
    ValidateReferralResult | null,
    FormData
  >(validateReferralAction, null);

  // Auto-validate if code is present in URL
  useEffect(() => {
    if (initialCode && fid) {
      // Optional: Auto-submit if code is present? 
      // For now, just pre-fill. User clicks "Get In".
      // Or we can debounce validate.
      setInputCode(initialCode);
    }
  }, [initialCode, fid]);

  // Handle validation result
  useEffect(() => {
    if (validationState) {
      if (validationState.valid) {
        setError(null);
        setStatus("success");
        // Auto-redirect to game lobby after successful validation
        const redirectTimer = setTimeout(() => {
          router.push("/game");
        }, 1500); // Small delay to show success state

        return () => clearTimeout(redirectTimer);
      } else {
        setError(validationState.error);
        setStatus("failed");
      }
    }
  }, [validationState, router]);

  const runValidation = useCallback(
    (codeToValidate: string) => {
      if (!fid) return;

      const formData = new FormData();
      formData.append("code", codeToValidate);
      formData.append("fid", String(fid));

      startTransition(() => {
        validateAction(formData);
      });
    },
    [fid, validateAction]
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



  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedCode = inputCode.trim().toUpperCase();

    const validation = validateReferralSchema.shape.code.safeParse(trimmedCode);

    if (!validation.success) {
      setError(validation.error.issues[0].message);
      setStatus("failed");
      return;
    }

    if (!fid) {
      setError("User not identified.");
      setStatus("failed");
      return;
    }

    setStatus("validating");
    runValidation(trimmedCode);
  };

  return (
    <>
      <InvitePageHeader />

      <div className="flex-1 overflow-y-auto px-4 space-y-4">
        <div className="flex justify-center w-[95px] h-[113px] mx-auto my-8">
          <Image
            src="/images/illustrations/invite-key.png"
            alt="Invite Key"
            width={95}
            height={113}
            fetchPriority="high"
          />
        </div>
        <h2
          className="
            text-center
            font-normal
            font-body
            text-[44px]
            not-italic
            leading-[0.92]
            tracking-[-0.03em]
          "
        >
          ENTER YOUR <br /> INVITE CODE
        </h2>
        {isLoading ? (
          <div className="py-12">
            <WaffleLoader text="GENERATING CODE..." size={80} />
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="w-full  flex flex-col items-center gap-6"
            autoComplete="off"
          >
            <label htmlFor="inviteCodeInput" className="sr-only">
              Invite Code
            </label>
            <InviteInput
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
                inputCode.trim().length !== 6 ||
                isPending ||
                status === "validating"
              }
            >
              {isPending || status === "validating" ? "CHECKING..." : "GET IN"}
            </FancyBorderButton>
            {(isPending || status === "validating") && (
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
              <InfoButton
                text={"Invalid code"}
                onClick={() => { }}
                type="button"
                className="mt-15"
              >
                <FailedIcon className="h-[18px] w-[18px]" />
                <span>{"Invalid code"}</span>
              </InfoButton>
            )}

            {status === "success" && (
              <InfoButton
                text="Valid"
                onClick={() => { }}
                type="button"
                className="bg-[#27AE60]"
              >
                <SuccessIcon className="h-[18px] w-[18px]" />
                <span>Valid</span>
              </InfoButton>
            )}
          </form>
        )}
      </div>
    </>
  );
}
