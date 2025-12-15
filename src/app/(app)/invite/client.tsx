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
import { motion, AnimatePresence, useAnimation } from "framer-motion";
import confetti from "canvas-confetti";

import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { useUser } from "@/hooks/useUser";
import { FancyBorderButton } from "@/components/buttons/FancyBorderButton";
import { WaffleLoader } from "@/components/ui/WaffleLoader";
import {
  validateReferralAction,
  type ValidateReferralResult,
} from "@/actions/invite";
import { validateReferralSchema } from "@/lib/schemas";
import { springs } from "@/lib/animations";

type ValidationStatus = "idle" | "validating" | "success" | "failed";

// ============================================
// FLOATING PARTICLES - Background magic
// ============================================
function FloatingParticles() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {[...Array(10)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full"
          style={{
            background: i % 3 === 0 ? "#FFC931" : i % 3 === 1 ? "#00CFF2" : "#8B5CF6",
            left: `${10 + i * 9}%`,
            top: `${20 + (i % 4) * 20}%`,
          }}
          animate={{
            y: [0, -25, 0],
            x: [0, i % 2 === 0 ? 8 : -8, 0],
            opacity: [0.15, 0.5, 0.15],
            scale: [1, 1.3, 1],
          }}
          transition={{
            duration: 3 + (i % 3),
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.25,
          }}
        />
      ))}
      {/* Glowing orbs */}
      <motion.div
        className="absolute w-48 h-48 rounded-full blur-3xl"
        style={{
          background: "radial-gradient(circle, rgba(0,207,242,0.08) 0%, transparent 70%)",
          right: "-10%",
          top: "15%",
        }}
        animate={{ x: [0, 20, 0], y: [0, -15, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute w-40 h-40 rounded-full blur-3xl"
        style={{
          background: "radial-gradient(circle, rgba(255,201,49,0.06) 0%, transparent 70%)",
          left: "-5%",
          bottom: "20%",
        }}
        animate={{ x: [0, -15, 0], y: [0, 20, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}

// ============================================
// ANIMATED KEY ILLUSTRATION
// ============================================
function AnimatedKey({ status }: { status: ValidationStatus }) {
  return (
    <motion.div
      className="relative"
      initial={{ opacity: 0, y: 30, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.1 }}
    >
      {/* Glow effect */}
      <motion.div
        className="absolute inset-0 blur-2xl"
        style={{
          background:
            status === "success"
              ? "radial-gradient(circle, rgba(39,174,96,0.4) 0%, transparent 70%)"
              : status === "failed"
              ? "radial-gradient(circle, rgba(185,56,20,0.3) 0%, transparent 70%)"
              : "radial-gradient(circle, rgba(0,207,242,0.2) 0%, transparent 70%)",
        }}
        animate={{
          opacity: [0.4, 0.7, 0.4],
          scale: [1, 1.15, 1],
        }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        animate={
          status === "success"
            ? { rotate: [0, -10, 10, 0], scale: [1, 1.1, 1] }
            : status === "failed"
            ? { x: [-5, 5, -5, 5, 0] }
            : { y: [0, -5, 0] }
        }
        transition={
          status === "success"
            ? { duration: 0.5 }
            : status === "failed"
            ? { duration: 0.4 }
            : { duration: 3, repeat: Infinity, ease: "easeInOut" }
        }
      >
        <Image
          src="/images/illustrations/invite-key.png"
          alt="Invite Key"
          width={95}
          height={113}
          priority
          className="relative z-10"
        />
      </motion.div>
    </motion.div>
  );
}

// ============================================
// ANIMATED INPUT
// ============================================
function AnimatedInput({
  value,
  onChange,
  status,
  inputRef,
  autoFocus,
}: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  status: ValidationStatus;
  inputRef: React.RefObject<HTMLInputElement | null>;
  autoFocus: boolean;
}) {
  const controls = useAnimation();

  useEffect(() => {
    if (status === "failed") {
      controls.start({
        x: [-8, 8, -6, 6, -4, 4, 0],
        transition: { duration: 0.5 },
      });
    }
  }, [status, controls]);

  return (
    <motion.div
      animate={controls}
      className="relative"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ ...springs.gentle, delay: 0.2 }}
    >
      {/* Glow ring on success */}
      <AnimatePresence>
        {status === "success" && (
          <motion.div
            className="absolute -inset-1 rounded-xl bg-[#27AE60]/30 blur-md"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
          />
        )}
        {status === "failed" && (
          <motion.div
            className="absolute -inset-1 rounded-xl bg-[#B93814]/30 blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.5, 0.8, 0.5] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1, repeat: Infinity }}
          />
        )}
      </AnimatePresence>

      <div
        className={`relative flex h-[56px] w-[320px] max-w-full items-center justify-center
          rounded-xl px-3 transition-all duration-300
          ${
            status === "success"
              ? "bg-[#27AE60]/20 border-2 border-[#27AE60]"
              : status === "failed"
              ? "bg-[#B93814]/20 border-2 border-[#B93814]"
              : "bg-white/10 border border-white/20 focus-within:border-white/50"
          }`}
      >
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={onChange}
          placeholder="XXXXXX"
          maxLength={6}
          autoFocus={autoFocus}
          autoCapitalize="characters"
          inputMode="text"
          style={{ textTransform: "uppercase" }}
          className="h-full w-full border-none bg-transparent p-0 text-center outline-none
            text-[32px] font-body leading-[1.3] tracking-[0.3em] text-white
            placeholder:text-white/30 placeholder:tracking-[0.3em]"
        />
      </div>
    </motion.div>
  );
}

// ============================================
// STATUS MESSAGE
// ============================================
function StatusMessage({
  status,
  error,
}: {
  status: ValidationStatus;
  error: string | null;
}) {
  return (
    <div className="h-16 flex items-center justify-center">
      <AnimatePresence mode="wait">
        {status === "validating" && (
          <motion.div
            key="validating"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-2"
          >
            <motion.div
              className="w-4 h-4 border-2 border-white/30 border-t-cyan-400 rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
            />
            <span className="text-white/60 font-display text-sm">Checking code...</span>
          </motion.div>
        )}

        {status === "failed" && error && (
          <motion.div
            key="failed"
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -10 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#B93814]/20 border border-[#B93814]/50"
          >
            <motion.span
              initial={{ rotate: 0 }}
              animate={{ rotate: [0, -10, 10, 0] }}
              transition={{ duration: 0.3 }}
              className="text-lg"
            >
              ❌
            </motion.span>
            <span className="text-[#FF6B4A] font-display text-sm">{error}</span>
          </motion.div>
        )}

        {status === "success" && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -10 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#27AE60]/20 border border-[#27AE60]/50"
          >
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.3, 1] }}
              transition={{ duration: 0.4 }}
              className="text-lg"
            >
              ✅
            </motion.span>
            <span className="text-[#4ADE80] font-display text-sm">
              Welcome aboard! Redirecting...
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================
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

  // Auto-validate initial code from URL
  useEffect(() => {
    if (
      initialCode &&
      fid &&
      initialCode.length === 6 &&
      !hasAutoValidatedRef.current
    ) {
      setInputCode(initialCode.toUpperCase());
      hasAutoValidatedRef.current = true;
      setStatus("validating");

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

        // Celebration! 🎉
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#27AE60", "#4ADE80", "#FFC931", "#00CFF2"],
        });

        // Redirect to game after celebration
        const redirectTimer = setTimeout(() => {
          router.push("/game");
        }, 2000);

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

      setStatus("validating");

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
    if (trimmedCode.length < 6 && (error || status === "failed")) {
      setError(null);
      setStatus("idle");
    }

    // Only auto-validate when exactly 6 characters
    if (trimmedCode.length === 6 && status !== "success") {
      // Dismiss keyboard
      if (inputRef.current) {
        inputRef.current.blur();
      }

      debounceTimerRef.current = setTimeout(() => {
        runValidation(trimmedCode);
      }, 400);
    }

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [inputCode, runValidation, error, status]);

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
      setError("Please wait, loading user data...");
      setStatus("failed");
      return;
    }

    runValidation(trimmedCode);
  };

  // Loading state
  if (userLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <WaffleLoader text="" />
      </div>
    );
  }

  return (
    <motion.div
      className="relative flex flex-col h-full overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <FloatingParticles />

      {/* Header */}
      <motion.header
        className="w-full max-w-lg h-[48px] border-b border-white/10 shrink-0 px-4 mx-auto flex items-center justify-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...springs.gentle }}
      >
        <motion.div
          className="relative w-[122px] h-[23px]"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Image src="/logo-onboarding.png" alt="Waffles Logo" fill priority />
        </motion.div>
      </motion.header>

      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 pb-safe">
        {/* Key Illustration */}
        <div className="mb-8">
          <AnimatedKey status={status} />
        </div>

        {/* Title */}
        <motion.h1
          className="text-center font-body text-[40px] leading-[0.95] tracking-[-0.03em] mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springs.gentle, delay: 0.15 }}
        >
          ENTER YOUR
          <br />
          <span className="text-cyan-400">INVITE CODE</span>
        </motion.h1>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="w-full flex flex-col items-center gap-6"
          autoComplete="off"
        >
          <AnimatedInput
            value={inputCode}
            onChange={(e) => setInputCode(e.target.value)}
            status={status}
            inputRef={inputRef}
            autoFocus={!initialCode}
          />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...springs.gentle, delay: 0.25 }}
          >
            <FancyBorderButton
              disabled={
                inputCode.trim().length !== 6 ||
                isPending ||
                status === "validating" ||
                status === "success"
              }
            >
              <AnimatePresence mode="wait">
                <motion.span
                  key={status}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.15 }}
                >
                  {isPending || status === "validating"
                    ? "CHECKING..."
                    : status === "success"
                    ? "YOU'RE IN! 🎉"
                    : "GET IN"}
                </motion.span>
              </AnimatePresence>
            </FancyBorderButton>
          </motion.div>

          <StatusMessage status={status} error={error} />
        </form>
      </div>
    </motion.div>
  );
}
