"use client";

import {
  useEffect,
  useState,
  useRef,
  useCallback,
  startTransition,
  useActionState,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";

import { useUser } from "@/hooks/useUser";
import { FancyBorderButton } from "@/components/buttons/FancyBorderButton";
import { WaffleLoader } from "@/components/ui/WaffleLoader";
import {
  validateReferralAction,
  type ValidateReferralResult,
} from "@/actions/invite";
import { validateReferralSchema } from "@/lib/schemas";

import { InvitePageHeader } from "./_components/InviteHeader";
import { InviteInput } from "./_components/InviteInput";
import { StatusMessage } from "./_components/StatusMessage";

type ValidationStatus = "idle" | "validating" | "success" | "failed";

export default function InvitePageClient() {
  const { user, isLoading: userLoading } = useUser();
  const fid = user?.fid;
  const router = useRouter();
  const searchParams = useSearchParams();

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const hasAutoValidatedRef = useRef(false);

  const initialCode = searchParams.get("code") || searchParams.get("ref") || "";

  const [status, setStatus] = useState<ValidationStatus>("idle");
  const [inputCode, setInputCode] = useState(initialCode);
  const [error, setError] = useState<string | null>(null);

  const [validationState, validateAction, isPending] = useActionState<
    ValidateReferralResult | null,
    FormData
  >(validateReferralAction, null);

  // Auto-validate initial code from URL (only once when fid is available)
  useEffect(() => {
    if (
      initialCode &&
      fid &&
      initialCode.length === 6 &&
      !hasAutoValidatedRef.current
    ) {
      hasAutoValidatedRef.current = true;
      setInputCode(initialCode.toUpperCase());
      setStatus("validating");

      const formData = new FormData();
      formData.append("code", initialCode.toUpperCase());
      formData.append("fid", String(fid));

      startTransition(() => {
        validateAction(formData);
      });
    }
  }, [initialCode, fid, validateAction]);

  // Handle validation result - only update status when result arrives
  useEffect(() => {
    if (!validationState) return;

    if (validationState.valid) {
      setError(null);
      setStatus("success");

      // Auto-redirect to game lobby after successful validation
      const redirectTimer = setTimeout(() => {
        router.push("/game");
      }, 1500);

      return () => clearTimeout(redirectTimer);
    } else {
      setError(validationState.error);
      setStatus("failed");
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

  // Auto-validate when exactly 6 characters are entered
  useEffect(() => {
    // Clear any pending debounce
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    const trimmedCode = inputCode.trim().toUpperCase();

    // Reset error state when user starts typing again
    if (trimmedCode.length < 6) {
      if (error || status === "failed") {
        setError(null);
        setStatus("idle");
      }
      return;
    }

    // Only auto-validate when exactly 6 characters and not already processing
    if (trimmedCode.length === 6 && status !== "success" && status !== "validating") {
      setStatus("validating");

      // Dismiss keyboard so user can see validation result
      inputRef.current?.blur();

      debounceTimerRef.current = setTimeout(() => {
        runValidation(trimmedCode);
      }, 300);
    }

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [inputCode, runValidation, error, status]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Don't submit if already processing or succeeded
    if (status === "validating" || status === "success" || isPending) return;

    const trimmedCode = inputCode.trim().toUpperCase();

    const validation = validateReferralSchema.shape.code.safeParse(trimmedCode);

    if (!validation.success) {
      setError(validation.error.issues[0].message);
      setStatus("failed");
      return;
    }

    if (!fid) {
      setError("Please wait, loading user data...");
      setStatus("failed");
      return;
    }

    setStatus("validating");
    runValidation(trimmedCode);
  };

  // Show loader while user data is loading
  if (userLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <WaffleLoader text="" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <InvitePageHeader />

      <div className="flex-1 overflow-y-auto px-4 space-y-4 pb-safe">
        <div className="flex justify-center w-[95px] h-[113px] mx-auto my-8">
          <Image
            src="/images/illustrations/invite-key.png"
            alt="Invite Key"
            width={95}
            height={113}
            priority
          />
        </div>

        <h2 className="text-center font-normal font-body text-[44px] not-italic leading-[0.92] tracking-[-0.03em]">
          ENTER YOUR <br /> INVITE CODE
        </h2>

        <form
          onSubmit={handleSubmit}
          className="w-full flex flex-col items-center gap-6"
          autoComplete="off"
        >
          <label htmlFor="inviteCodeInput" className="sr-only">
            Invite Code
          </label>

          <InviteInput
            ref={inputRef}
            id="inviteCodeInput"
            type="text"
            value={inputCode}
            onChange={(e) => {
              setInputCode(e.target.value);
            }}
            placeholder="INVITE CODE"
            maxLength={6}
            autoFocus={!initialCode}
            style={{ textTransform: "uppercase" }}
            inputMode="text"
            autoCapitalize="characters"
          />

          <FancyBorderButton
            disabled={inputCode.trim().length !== 6 || isPending || status === "validating"}
          >
            {isPending || status === "validating" ? "CHECKING..." : "GET IN"}
          </FancyBorderButton>

          <StatusMessage status={status} error={error} isPending={isPending} />
        </form>
      </div>
    </div>
  );
}
