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

    // Variant-specific styles
    const variantStyles = {
        warning: {
            iconBg: "bg-[#FFC931]/20",
            iconColor: "text-[#FFC931]",
            buttonBg: "bg-[#FFC931] hover:bg-[#FFD966]",
            buttonText: "text-black",
            Icon: ExclamationTriangleIcon,
        },
        success: {
            iconBg: "bg-[#14B985]/20",
            iconColor: "text-[#14B985]",
            buttonBg: "bg-[#14B985] hover:bg-[#1BF5B0]",
            buttonText: "text-black",
            Icon: CheckCircleIcon,
        },
        danger: {
            iconBg: "bg-red-500/20",
            iconColor: "text-red-400",
            buttonBg: "bg-red-500 hover:bg-red-400",
            buttonText: "text-white",
            Icon: ExclamationTriangleIcon,
        },
    };

    const styles = variantStyles[variant];
    const IconComponent = styles.Icon;

    return (
        <Fragment>
            {/* Backdrop with blur effect */}
            <div
                className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
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
                    className="relative w-full max-w-md transform overflow-hidden rounded-2xl bg-[#1A1A2E] border border-white/10 shadow-2xl shadow-black/50 animate-in zoom-in-95 slide-in-from-bottom-4 duration-300"
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
                        {/* Icon */}
                        <div className="flex justify-center mb-5">
                            <div className={`p-4 rounded-2xl ${styles.iconBg}`}>
                                <IconComponent className={`h-10 w-10 ${styles.iconColor}`} />
                            </div>
                        </div>

                        {/* Title */}
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

                        {/* Preview items (if any) */}
                        {previewItems && previewItems.length > 0 && (
                            <div className="bg-white/5 rounded-xl p-4 mb-6 border border-white/10">
                                <div className="space-y-2.5">
                                    {previewItems.map((item, index) => (
                                        <div
                                            key={index}
                                            className="flex items-center justify-between text-sm"
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

                    {/* Actions */}
                    <div className="px-6 pb-6 flex gap-3">
                        <button
                            onClick={onClose}
                            disabled={isLoading}
                            className="flex-1 px-4 py-3 rounded-xl font-medium text-white/70 bg-white/5 hover:bg-white/10 border border-white/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {cancelText}
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={isLoading}
                            className={`flex-1 px-4 py-3 rounded-xl font-bold transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-lg ${styles.buttonBg} ${styles.buttonText}`}
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

