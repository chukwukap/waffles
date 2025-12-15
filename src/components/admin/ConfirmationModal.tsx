"use client";

import { Fragment, useEffect, useRef } from "react";
import {
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

export type ConfirmationVariant = "warning" | "success" | "danger";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmationVariant;
  isLoading?: boolean;
  /** Optional list of items to preview before confirming */
  previewItems?: { label: string; value: string }[];
}

/**
 * A beautiful confirmation modal component for admin actions.
 * Matches the Waffles admin dashboard theme with glassmorphism.
 * Supports different variants: warning, success, danger
 */
export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "warning",
  isLoading = false,
  previewItems,
}: ConfirmationModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isLoading) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, isLoading, onClose]);

  // Focus trap
  useEffect(() => {
    if (isOpen && modalRef.current) {
      modalRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Variant-specific styles matching admin theme
  const variantStyles = {
    warning: {
      iconBg: "bg-[#FFC931]/15",
      iconColor: "text-[#FFC931]",
      buttonBg:
        "bg-[#FFC931] hover:bg-[#FFD966] shadow-lg shadow-[#FFC931]/20",
      buttonText: "text-black",
      glowColor: "rgba(255, 201, 49, 0.1)",
      Icon: ExclamationTriangleIcon,
    },
    success: {
      iconBg: "bg-[#14B985]/15",
      iconColor: "text-[#14B985]",
      buttonBg:
        "bg-[#14B985] hover:bg-[#1BF5B0] shadow-lg shadow-[#14B985]/20",
      buttonText: "text-black",
      glowColor: "rgba(20, 185, 133, 0.1)",
      Icon: CheckCircleIcon,
    },
    danger: {
      iconBg: "bg-red-500/15",
      iconColor: "text-red-400",
      buttonBg: "bg-red-500 hover:bg-red-400 shadow-lg shadow-red-500/20",
      buttonText: "text-white",
      glowColor: "rgba(239, 68, 68, 0.1)",
      Icon: ExclamationTriangleIcon,
    },
  };

  const styles = variantStyles[variant];
  const IconComponent = styles.Icon;

  return (
    <Fragment>
      {/* Backdrop with blur effect - matches admin-background overlay */}
      <div
        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
        style={{
          animation: "fadeIn 0.2s ease-out forwards",
        }}
        onClick={() => !isLoading && onClose()}
        aria-hidden="true"
      />

      {/* Modal container */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          ref={modalRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          tabIndex={-1}
          className="relative w-full max-w-md transform overflow-hidden admin-panel"
          style={{
            animation: "slideUp 0.3s ease-out forwards",
            boxShadow: `0 0 40px ${styles.glowColor}, 0 25px 50px -12px rgba(0, 0, 0, 0.5)`,
          }}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            disabled={isLoading}
            className="absolute right-4 top-4 p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Close modal"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>

          {/* Content */}
          <div className="p-6 pt-8">
            {/* Icon with glow effect */}
            <div className="flex justify-center mb-5">
              <div
                className={`p-4 rounded-2xl ${styles.iconBg} relative`}
                style={{
                  boxShadow: `0 0 20px ${styles.glowColor}`,
                }}
              >
                <IconComponent className={`h-10 w-10 ${styles.iconColor}`} />
              </div>
            </div>

            {/* Title - uses font-display */}
            <h2
              id="modal-title"
              className="text-xl font-bold text-white text-center font-display mb-2"
            >
              {title}
            </h2>

            {/* Description */}
            <p className="text-white/60 text-center text-sm leading-relaxed mb-5">
              {description}
            </p>

            {/* Preview items (if any) - matches admin table styling */}
            {previewItems && previewItems.length > 0 && (
              <div className="bg-white/5 rounded-xl p-4 mb-6 border border-white/8">
                <div className="space-y-2.5">
                  {previewItems.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between text-sm admin-table-row py-1.5 last:border-b-0"
                    >
                      <span className="text-white/50">{item.label}</span>
                      <span className="text-white font-medium truncate max-w-[60%] text-right">
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Actions - matching admin button styles */}
          <div className="px-6 pb-6 flex gap-3">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-3 rounded-xl font-medium text-white/70 bg-white/5 hover:bg-white/10 border border-white/8 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className={`flex-1 px-4 py-3 rounded-xl font-bold transition-all disabled:opacity-70 disabled:cursor-not-allowed ${styles.buttonBg} ${styles.buttonText}`}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="animate-spin h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Processing...
                </span>
              ) : (
                confirmText
              )}
            </button>
          </div>
        </div>
      </div>
    </Fragment>
  );
}
