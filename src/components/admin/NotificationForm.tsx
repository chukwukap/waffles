"use client";

import { useActionState, useState, useEffect, useTransition } from "react";
import {
    BellIcon,
    PaperAirplaneIcon,
    CheckCircleIcon,
    ChatBubbleLeftIcon,
} from "@heroicons/react/24/outline";
import {
    sendAdminNotificationAction,
    NotificationResult,
} from "@/actions/admin/notifications";
import { ConfirmationModal } from "./ConfirmationModal";

const TITLE_MAX = 65;
const BODY_MAX = 240;

export function NotificationForm() {
    const [state, formAction] = useActionState<NotificationResult | null, FormData>(
        sendAdminNotificationAction,
        null
    );

    const [title, setTitle] = useState("");
    const [body, setBody] = useState("");
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [pendingFormData, setPendingFormData] = useState<FormData | null>(null);
    const [isPending, startTransition] = useTransition();

    // Reset form on success
    useEffect(() => {
        if (state?.success) {
            setTitle("");
            setBody("");
        }
    }, [state]);

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!title.trim() || !body.trim()) return;
        const formData = new FormData(e.currentTarget);
        setPendingFormData(formData);
        setShowConfirmation(true);
    };

    const handleConfirmSend = () => {
        if (!pendingFormData) return;
        startTransition(async () => {
            formAction(pendingFormData);
            setShowConfirmation(false);
            setPendingFormData(null);
        });
    };

    return (
        <>
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Success/Error Messages */}
                {state?.success && (
                    <div className="p-4 bg-[#14B985]/10 border border-[#14B985]/30 rounded-2xl flex items-center gap-3">
                        <CheckCircleIcon className="h-5 w-5 text-[#14B985] shrink-0" />
                        <div>
                            <p className="text-sm font-medium text-[#14B985]">Notifications sent!</p>
                            <p className="text-xs text-[#14B985]/70 mt-0.5">
                                {state.sent} of {state.total} delivered
                                {state.failed > 0 && ` • ${state.failed} failed`}
                            </p>
                        </div>
                    </div>
                )}

                {state && !state.success && "error" in state && (
                    <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center gap-3">
                        <ExclamationCircleIcon className="h-5 w-5 text-red-400 shrink-0" />
                        <p className="text-sm font-medium text-red-400">{state.error}</p>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - Compose */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Message Section */}
                        <section className="bg-linear-to-br from-[#FFC931]/5 to-transparent rounded-2xl border border-white/10 p-6">
                            <div className="flex items-center gap-3 mb-5">
                                <div className="p-2.5 rounded-xl bg-[#FFC931]/15">
                                    <ChatBubbleLeftIcon className="h-5 w-5 text-[#FFC931]" />
                                </div>
                                <h3 className="font-bold text-white font-display">Message</h3>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="title" className="block text-sm font-medium text-white/70 mb-2">
                                        Title
                                    </label>
                                    <input
                                        type="text"
                                        id="title"
                                        name="title"
                                        required
                                        maxLength={TITLE_MAX}
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        className="w-full px-4 py-3.5 bg-transparent border border-white/10 rounded-xl text-white text-lg placeholder-white/30 focus:ring-2 focus:ring-[#FFC931]/50 focus:border-[#FFC931] transition-all font-medium"
                                        placeholder="🎉 New Game Starting Soon!"
                                    />
                                    <p className={`text-xs mt-2 text-right ${title.length >= TITLE_MAX ? "text-red-400" : "text-white/40"}`}>
                                        {title.length}/{TITLE_MAX}
                                    </p>
                                </div>

                                <div>
                                    <label htmlFor="body" className="block text-sm font-medium text-white/70 mb-2">
                                        Body
                                    </label>
                                    <textarea
                                        id="body"
                                        name="body"
                                        required
                                        maxLength={BODY_MAX}
                                        rows={3}
                                        value={body}
                                        onChange={(e) => setBody(e.target.value)}
                                        className="w-full px-4 py-3 bg-transparent border border-white/10 rounded-xl text-white placeholder-white/30 focus:ring-2 focus:ring-[#FFC931]/50 focus:border-[#FFC931] transition-all resize-none"
                                        placeholder="Don't miss out on the next big game!"
                                    />
                                    <p className={`text-xs mt-2 text-right ${body.length >= BODY_MAX ? "text-red-400" : "text-white/40"}`}>
                                        {body.length}/{BODY_MAX}
                                    </p>
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* Right Column - Preview & Send */}
                    <div className="space-y-6">
                        {/* Preview */}
                        <section className="bg-linear-to-br from-[#FB72FF]/5 to-transparent rounded-2xl border border-white/10 p-6">
                            <div className="flex items-center gap-3 mb-5">
                                <div className="p-2.5 rounded-xl bg-[#FB72FF]/15">
                                    <BellIcon className="h-5 w-5 text-[#FB72FF]" />
                                </div>
                                <h3 className="font-bold text-white font-display">Preview</h3>
                            </div>

                            {/* Mock Notification */}
                            <div className="bg-[#1C1C1E] rounded-2xl p-4 border border-white/10 shadow-xl">
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-[#FFC931] flex items-center justify-center shrink-0">
                                        <span className="text-lg">🧇</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-white text-sm">WAFFLES</span>
                                            <span className="text-xs text-white/40">now</span>
                                        </div>
                                        <p className="font-medium text-white text-sm mt-0.5 line-clamp-1">
                                            {title || "Notification Title"}
                                        </p>
                                        <p className="text-white/60 text-xs mt-1 line-clamp-2">
                                            {body || "Your message here..."}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="mt-4 space-y-2">
                                <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                                    <span className="text-sm text-white/60">Recipients</span>
                                    <span className="font-bold text-white">All Users</span>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                                    <span className="text-sm text-white/60">Destination</span>
                                    <span className="font-medium text-white/80">Game Lobby</span>
                                </div>
                            </div>
                        </section>

                        {/* Send Button */}
                        <button
                            type="submit"
                            disabled={isPending || !title.trim() || !body.trim()}
                            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-linear-to-r from-[#FFC931] to-[#FF9500] text-black rounded-2xl font-bold text-lg transition-all duration-300 hover:shadow-[0_0_30px_rgba(255,201,49,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isPending ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                                    Sending...
                                </>
                            ) : (
                                <>
                                    <PaperAirplaneIcon className="h-5 w-5" />
                                    Send Notification
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </form>

            <ConfirmationModal
                isOpen={showConfirmation}
                onClose={() => {
                    setShowConfirmation(false);
                    setPendingFormData(null);
                }}
                onConfirm={handleConfirmSend}
                title="Send Notification"
                description="This will send a notification to ALL users."
                confirmText="Send to Everyone"
                cancelText="Cancel"
                variant="warning"
                isLoading={isPending}
            />
        </>
    );
}

export default NotificationForm;
