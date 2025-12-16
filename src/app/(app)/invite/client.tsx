"use client";

import {
  useEffect,
  useState,
  useRef,
  useCallback,
  startTransition,
  useActionState,
} from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { motion, useAnimation } from "framer-motion";

import { useUser } from "@/hooks/useUser";
import { FancyBorderButton } from "@/components/buttons/FancyBorderButton";
import {
  redeemInviteCodeAction,
  type ValidateReferralResult,
} from "@/actions/invite";
import { validateReferralSchema } from "@/lib/schemas";

import { InvitePageHeader } from "./_components/InviteHeader";
import { InviteInput } from "./_components/InviteInput";
import { StatusMessage } from "./_components/StatusMessage";

type ValidationStatus = "idle" | "validating" | "success" | "failed";

// Shared spring config
const spring = { type: "spring" as const, stiffness: 200, damping: 20 };

interface InvitePageClientProps {
  /** Called when invite validation succeeds - allows parent to update state */
  onSuccess?: () => void;
}

export default function InvitePageClient({ onSuccess }: InvitePageClientProps) {
  const { user } = useUser();
  const searchParams = useSearchParams();
  const inputControls = useAnimation();

  // Animate input in on mount
  useEffect(() => {
    inputControls.start({ opacity: 1, y: 0 });
  }, [inputControls]);

  const fid = user?.fid;
  const initialCode = searchParams.get("code") || searchParams.get("ref") || "";

  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const hasAutoValidated = useRef(false);

  const [status, setStatus] = useState<ValidationStatus>("idle");
  const [inputCode, setInputCode] = useState(initialCode);
  const [error, setError] = useState<string | null>(null);

  const [validationState, validateAction, isPending] = useActionState<
    ValidateReferralResult | null,
    FormData
  >(redeemInviteCodeAction, null);

  const runValidation = useCallback(
    (code: string) => {
      if (!fid) return;
      const formData = new FormData();
      formData.append("inviteCode", code);
      formData.append("userFid", String(fid));
      startTransition(() => validateAction(formData));
    },
    [fid, validateAction]
  );

  // Auto-validate URL code on mount
  useEffect(() => {
    if (initialCode?.length === 6 && fid && !hasAutoValidated.current) {
      hasAutoValidated.current = true;
      setInputCode(initialCode);
      runValidation(initialCode.toUpperCase());
    }
  }, [initialCode, fid, runValidation]);

  // Handle validation result
  useEffect(() => {
    if (!validationState) return;

    if (validationState.valid) {
      setError(null);
      setStatus("success");
      // Call parent's callback to update user state
      // GameAuthGate will automatically show game content when status changes
      onSuccess?.();
      return;
    }

    setError(validationState.error);
    setStatus("failed");
    inputControls.start({
      x: [-8, 8, -6, 6, -4, 4, 0],
      transition: { duration: 0.4 },
    });
  }, [validationState, onSuccess, inputControls]);

  // Auto-validate on 6 char input
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const code = inputCode.trim().toUpperCase();

    if (code.length < 6 && error) {
      setError(null);
      setStatus("idle");
    }

    if (code.length === 6) {
      setStatus("validating");
      inputRef.current?.blur();
      debounceRef.current = setTimeout(() => runValidation(code), 300);
    }

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [inputCode, runValidation, error]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = inputCode.trim().toUpperCase();

    const result = validateReferralSchema.shape.code.safeParse(code);
    if (!result.success) {
      setError(result.error.issues[0].message);
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
    runValidation(code);
  };

  const isDisabled =
    inputCode.trim().length !== 6 || isPending || status === "validating";

  return (
    <div className="flex flex-col h-full">
      <InvitePageHeader />

      <div className="flex-1 overflow-y-auto px-4 space-y-4 pb-safe">
        {/* Key illustration */}
        <motion.div
          className="flex justify-center w-[95px] h-[113px] mx-auto my-8"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={spring}
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

        {/* Title */}
        <motion.h2
          className="text-center font-normal font-body text-[44px] leading-[0.92] tracking-[-0.03em]"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring, delay: 0.1 }}
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

          {/* Input */}
          <motion.div
            animate={inputControls}
            initial={{ opacity: 0, y: 10 }}
            transition={{ ...spring, delay: 0.15 }}
          >
            <InviteInput
              ref={inputRef}
              id="inviteCodeInput"
              type="text"
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value)}
              placeholder="INVITE CODE"
              maxLength={6}
              autoFocus={!initialCode}
              style={{ textTransform: "uppercase" }}
              inputMode="text"
              autoCapitalize="characters"
            />
          </motion.div>

          {/* Button */}
          <motion.div
            className="w-full"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring, delay: 0.2 }}
          >
            <FancyBorderButton disabled={isDisabled}>
              {isPending || status === "validating" ? "CHECKING..." : "GET IN"}
            </FancyBorderButton>
          </motion.div>

          <StatusMessage status={status} error={error} />
        </form>
      </div>
    </div>
  );
}
