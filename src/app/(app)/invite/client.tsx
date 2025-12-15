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
import { motion, useAnimation } from "framer-motion";

import { useUser } from "@/hooks/useUser";
import { FancyBorderButton } from "@/components/buttons/FancyBorderButton";
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
  const { user } = useUser();
  const fid = user?.fid;
  const router = useRouter();
  const searchParams = useSearchParams();

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const hasAutoValidatedRef = useRef(false);

  const initialCode = searchParams.get("code") || searchParams.get("ref") || "";

  const [status, setStatus] = useState<ValidationStatus>("idle");
  const [inputCode, setInputCode] = useState(initialCode);
  const [error, setError] = useState<string | null>(null);

  // Animation controls for shake effect
  const inputControls = useAnimation();

  const [validationState, validateAction, isPending] = useActionState<
    ValidateReferralResult | null,
    FormData
  >(validateReferralAction, null);

  // Auto-validate initial code from URL
  useEffect(() => {
    if (
      initialCode &&
      fid &&
      initialCode.length === 6 &&
      !hasAutoValidatedRef.current
    ) {
      setInputCode(initialCode);
      hasAutoValidatedRef.current = true;

      const formData = new FormData();
      formData.append("code", initialCode.toUpperCase());
      formData.append("fid", String(fid));

      startTransition(() => {
        validateAction(formData);
      });
    }
  }, [initialCode, fid, validateAction]);

  // Handle validation result
  useEffect(() => {
    if (validationState) {
      if (validationState.valid) {
        setError(null);
        setStatus("success");

        // Auto-redirect to game lobby after successful validation
        const redirectTimer = setTimeout(() => {
          router.push("/game");
        }, 1500);

        return () => {
          clearTimeout(redirectTimer);
        };
      } else {
        setError(validationState.error);
        setStatus("failed");
        // Shake input on error
        inputControls.start({
          x: [-8, 8, -6, 6, -4, 4, 0],
          transition: { duration: 0.4 },
        });
      }
    }
  }, [validationState, router, inputControls]);

  const runValidation = useCallback(
    (codeToValidate: string) => {
      if (!fid) {
        return;
      }

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
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    const trimmedCode = inputCode.trim().toUpperCase();

    // Reset error state when typing
    if (trimmedCode.length < 6 && error) {
      setError(null);
      setStatus("idle");
    }

    // Only auto-validate when exactly 6 characters
    if (trimmedCode.length === 6) {
      setStatus("validating");

      // Dismiss keyboard so user can see validation result
      if (inputRef.current) {
        inputRef.current.blur();
      }

      debounceTimerRef.current = setTimeout(() => {
        runValidation(trimmedCode);
      }, 300);
    }

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [inputCode, runValidation, error]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedCode = inputCode.trim().toUpperCase();

    const validation = validateReferralSchema.shape.code.safeParse(trimmedCode);

    if (!validation.success) {
      setError(validation.error.issues[0].message);
      setStatus("failed");
      inputControls.start({
        x: [-8, 8, -6, 6, -4, 4, 0],
        transition: { duration: 0.4 },
      });
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
    <div className="flex flex-col h-full">
      <InvitePageHeader />

      <div className="flex-1 overflow-y-auto px-4 space-y-4 pb-safe">
        {/* Key illustration with float animation */}
        <motion.div
          className="flex justify-center w-[95px] h-[113px] mx-auto my-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
        >
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            <Image
              src="/images/illustrations/invite-key.png"
              alt="Invite Key"
              width={95}
              height={113}
              priority
            />
          </motion.div>
        </motion.div>

        {/* Title with fade in */}
        <motion.h2
          className="text-center font-normal font-body text-[44px] not-italic leading-[0.92] tracking-[-0.03em]"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 200, damping: 20 }}
        >
          ENTER YOUR <br /> INVITE CODE
        </motion.h2>

        <form
          onSubmit={handleSubmit}
          className="w-full flex flex-col items-center gap-6"
          autoComplete="off"
        >
          <label htmlFor="inviteCodeInput" className="sr-only">
            Invite Code
          </label>

          {/* Input with shake animation on error */}
          <motion.div
            animate={inputControls}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, type: "spring", stiffness: 200, damping: 20 }}
          >
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
          </motion.div>

          {/* Button with entrance animation */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 20 }}
          >
            <FancyBorderButton
              disabled={
                inputCode.trim().length !== 6 ||
                isPending ||
                status === "validating"
              }
            >
              {isPending || status === "validating" ? "CHECKING..." : "GET IN"}
            </FancyBorderButton>
          </motion.div>

          <StatusMessage status={status} error={error} isPending={isPending} />
        </form>
      </div>
    </div>
  );
}
