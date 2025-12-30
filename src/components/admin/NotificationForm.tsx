"use client";

import { useActionState, useState, useEffect, useTransition } from "react";
import {
    BellIcon,
    PaperAirplaneIcon,
    UserGroupIcon,
    UserIcon,
    CheckCircleIcon,
    ExclamationCircleIcon,
    SparklesIcon,
    LinkIcon,
    ChatBubbleLeftIcon,
} from "@heroicons/react/24/outline";
import {
    sendAdminNotificationAction,
    getAudienceCount,
    NotificationResult,
} from "@/actions/admin/notifications";
import { ConfirmationModal } from "./ConfirmationModal";

const AUDIENCES = [
    {
        id: "all",
        label: "All Users",
        description: "Everyone with notifications enabled",
        icon: UserGroupIcon,
        color: "from-[#FFC931] to-[#FF9500]",
    },
    {
        id: "active",
        label: "Active Players",
        description: "Users with game access",
        icon: SparklesIcon,
        color: "from-[#14B985] to-[#0D8C65]",
    },
    {
        id: "waitlist",
        label: "Waitlist",
        description: "Users waiting for access",
        icon: UserIcon,
        color: "from-[#00CFF2] to-[#0099B8]",
    },
    {
        id: "no_quests",
        label: "No Quests Completed",
        description: "Users who haven't done any quests",
        icon: ExclamationCircleIcon,
        color: "from-[#FF6B6B] to-[#EE5A5A]",
    },
];

export function NotificationForm() {
    const [state, formAction] = useActionState<NotificationResult | null, FormData>(
        sendAdminNotificationAction,
        null
    );

    // Form state
    const [title, setTitle] = useState("");
    const [body, setBody] = useState("");
    const [targetUrl, setTargetUrl] = useState("");
    const [audience, setAudience] = useState<"all" | "active" | "waitlist" | "single" | "no_quests">("all");
    const [targetFid, setTargetFid] = useState("");

    // UI state
    const [audienceCount, setAudienceCount] = useState<number>(0);
    const [isLoadingCount, setIsLoadingCount] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [pendingFormData, setPendingFormData] = useState<FormData | null>(null);
    const [isPending, startTransition] = useTransition();

    // Character limits
    const TITLE_MAX = 65;
    const BODY_MAX = 240;

    // Fetch audience count when audience changes
    useEffect(() => {
        if (audience === "single") {
            setAudienceCount(1);
            return;
        }

        setIsLoadingCount(true);
        getAudienceCount(audience)
            .then(setAudienceCount)
            .catch(() => setAudienceCount(0))
            .finally(() => setIsLoadingCount(false));
    }, [audience]);

    // Handle form submission
    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        // Validate
        if (!title.trim()) return;
        if (!body.trim()) return;
        if (audience === "single" && !targetFid.trim()) return;

        const formData = new FormData(e.currentTarget);
        setPendingFormData(formData);
        setShowConfirmation(true);
    };

    // Confirm and send
    const handleConfirmSend = () => {
        if (!pendingFormData) return;

        startTransition(async () => {
            try {
                await formAction(pendingFormData);
            } finally {
                setShowConfirmation(false);
                setPendingFormData(null);
            }
        });
    };

    // Reset form on success
    useEffect(() => {
        if (state?.success) {
            setTitle("");
            setBody("");
            setTargetUrl("");
            setTargetFid("");
        }
    }, [state]);

    const getPreviewItems = () => {
        const audienceData = AUDIENCES.find((a) => a.id === audience);
        return [
            { label: "Title", value: title || "(empty)" },
            { label: "Body", value: body.slice(0, 50) + (body.length > 50 ? "..." : "") || "(empty)" },
            {
                label: "Audience",
                value: audience === "single" ? `Single user (FID: ${targetFid})` : audienceData?.label || audience,
            },
            { label: "Recipients", value: audienceCount.toLocaleString() },
        ];
    };

    return (
        <>
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Success Message */}
                {state?.success && (
                    <div className="p-4 bg-[#14B985]/10 border border-[#14B985]/30 rounded-2xl flex items-center gap-3">
                        <CheckCircleIcon className="h-5 w-5 text-[#14B985] shrink-0" />
                        <div>
                            <p className="text-sm font-medium text-[#14B985]">Notifications sent successfully!</p>
                            <p className="text-xs text-[#14B985]/70 mt-0.5">
                                {state.sent} of {state.total} delivered
                                {state.failed > 0 && ` • ${state.failed} failed`}
                            </p>
                        </div>
                    </div>
                )}

                {/* Error Message */}
                {state && !state.success && "error" in state && (
                    <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center gap-3">
                        <ExclamationCircleIcon className="h-5 w-5 text-red-400 shrink-0" />
                        <p className="text-sm font-medium text-red-400">{state.error}</p>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - Compose */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Compose Section */}
                        <section className="bg-linear-to-br from-[#FFC931]/5 to-transparent rounded-2xl border border-white/10 p-6">
                            <div className="flex items-center gap-3 mb-5">
                                <div className="p-2.5 rounded-xl bg-[#FFC931]/15">
                                    <ChatBubbleLeftIcon className="h-5 w-5 text-[#FFC931]" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-white font-display">Compose Message</h3>
                                    <p className="text-sm text-white/50">Write your notification</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {/* Title */}
                                <div>
                                    <label htmlFor="title" className="block text-sm font-medium text-white/70 mb-2">
                                        Title <span className="text-red-400">*</span>
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
                                    <div className="flex justify-between mt-2">
                                        <p className="text-xs text-white/40">
                                            Keep it catchy and attention-grabbing
                                        </p>
                                        <p className={`text-xs ${title.length >= TITLE_MAX ? "text-red-400" : "text-white/40"}`}>
                                            {title.length}/{TITLE_MAX}
                                        </p>
                                    </div>
                                </div>

                                {/* Body */}
                                <div>
                                    <label htmlFor="body" className="block text-sm font-medium text-white/70 mb-2">
                                        Message Body <span className="text-red-400">*</span>
                                    </label>
                                    <textarea
                                        id="body"
                                        name="body"
                                        required
                                        maxLength={BODY_MAX}
                                        rows={4}
                                        value={body}
                                        onChange={(e) => setBody(e.target.value)}
                                        className="w-full px-4 py-3 bg-transparent border border-white/10 rounded-xl text-white placeholder-white/30 focus:ring-2 focus:ring-[#FFC931]/50 focus:border-[#FFC931] transition-all resize-none"
                                        placeholder="Don't miss out on the next big game! Join now and compete for amazing prizes..."
                                    />
                                    <div className="flex justify-between mt-2">
                                        <p className="text-xs text-white/40">
                                            Be clear and compelling
                                        </p>
                                        <p className={`text-xs ${body.length >= BODY_MAX ? "text-red-400" : "text-white/40"}`}>
                                            {body.length}/{BODY_MAX}
                                        </p>
                                    </div>
                                </div>

                                {/* Target URL */}
                                <div>
                                    <label htmlFor="targetUrl" className="block text-sm font-medium text-white/70 mb-2">
                                        <LinkIcon className="h-4 w-4 inline mr-1" />
                                        Target URL <span className="text-white/30">(optional)</span>
                                    </label>
                                    <input
                                        type="url"
                                        id="targetUrl"
                                        name="targetUrl"
                                        value={targetUrl}
                                        onChange={(e) => setTargetUrl(e.target.value)}
                                        className="w-full px-4 py-3 bg-transparent border border-white/10 rounded-xl text-white placeholder-white/30 focus:ring-2 focus:ring-[#FFC931]/50 focus:border-[#FFC931] transition-all"
                                        placeholder="https://waffles.fun/game/123"
                                    />
                                    <p className="text-xs text-white/40 mt-2">
                                        Where users go when they tap the notification. Defaults to app home.
                                    </p>
                                </div>
                            </div>
                        </section>

                        {/* Audience Section */}
                        <section className="bg-linear-to-br from-[#00CFF2]/5 to-transparent rounded-2xl border border-white/10 p-6">
                            <div className="flex items-center gap-3 mb-5">
                                <div className="p-2.5 rounded-xl bg-[#00CFF2]/15">
                                    <UserGroupIcon className="h-5 w-5 text-[#00CFF2]" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-white font-display">Select Audience</h3>
                                    <p className="text-sm text-white/50">Who should receive this?</p>
                                </div>
                            </div>

                            <input type="hidden" name="audience" value={audience} />

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                                {AUDIENCES.map((option) => (
                                    <button
                                        key={option.id}
                                        type="button"
                                        onClick={() => setAudience(option.id as typeof audience)}
                                        className={`relative p-4 rounded-xl border transition-all duration-200 text-left ${audience === option.id
                                            ? `border-white/30 bg-linear-to-br ${option.color} shadow-lg`
                                            : "border-white/10 bg-white/5 hover:bg-white/8 hover:border-white/20"
                                            }`}
                                    >
                                        {audience === option.id && (
                                            <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-white flex items-center justify-center">
                                                <CheckCircleIcon className="h-4 w-4 text-black" />
                                            </div>
                                        )}
                                        <option.icon
                                            className={`h-5 w-5 mb-2 ${audience === option.id ? "text-white" : "text-white/60"
                                                }`}
                                        />
                                        <div className="font-bold text-white text-sm">{option.label}</div>
                                        <div className="text-xs text-white/60 mt-0.5">{option.description}</div>
                                    </button>
                                ))}
                            </div>

                            {/* Single User Option */}
                            <div className="border-t border-white/10 pt-4 mt-4">
                                <button
                                    type="button"
                                    onClick={() => setAudience("single")}
                                    className={`w-full p-4 rounded-xl border transition-all duration-200 text-left flex items-center gap-4 ${audience === "single"
                                        ? "border-[#FB72FF]/50 bg-[#FB72FF]/10"
                                        : "border-white/10 bg-white/5 hover:bg-white/8"
                                        }`}
                                >
                                    <div className={`p-2 rounded-lg ${audience === "single" ? "bg-[#FB72FF]/20" : "bg-white/10"}`}>
                                        <UserIcon className={`h-5 w-5 ${audience === "single" ? "text-[#FB72FF]" : "text-white/60"}`} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-bold text-white text-sm">Single User</div>
                                        <div className="text-xs text-white/50">Send to a specific user by FID</div>
                                    </div>
                                    {audience === "single" && (
                                        <CheckCircleIcon className="h-5 w-5 text-[#FB72FF]" />
                                    )}
                                </button>

                                {audience === "single" && (
                                    <div className="mt-3">
                                        <input
                                            type="text"
                                            id="targetFid"
                                            name="targetFid"
                                            value={targetFid}
                                            onChange={(e) => setTargetFid(e.target.value.replace(/[^0-9]/g, ""))}
                                            className="w-full px-4 py-3 bg-transparent border border-white/10 rounded-xl text-white placeholder-white/30 focus:ring-2 focus:ring-[#FB72FF]/50 focus:border-[#FB72FF] transition-all"
                                            placeholder="Enter Farcaster ID (e.g., 12345)"
                                        />
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>

                    {/* Right Column - Preview & Send */}
                    <div className="space-y-6">
                        {/* Preview Card */}
                        <section className="bg-linear-to-br from-[#FB72FF]/5 to-transparent rounded-2xl border border-white/10 p-6">
                            <div className="flex items-center gap-3 mb-5">
                                <div className="p-2.5 rounded-xl bg-[#FB72FF]/15">
                                    <BellIcon className="h-5 w-5 text-[#FB72FF]" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-white font-display">Preview</h3>
                                    <p className="text-sm text-white/50">How it will appear</p>
                                </div>
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
                                            {body || "Your notification message will appear here..."}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Audience Count */}
                            <div className="mt-4 p-4 bg-white/5 rounded-xl border border-white/10">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-white/60">Recipients</span>
                                    <span className="font-bold text-white font-display">
                                        {isLoadingCount ? (
                                            <span className="text-white/40">Loading...</span>
                                        ) : (
                                            audienceCount.toLocaleString()
                                        )}
                                    </span>
                                </div>
                            </div>
                        </section>

                        {/* Send Button */}
                        <button
                            type="submit"
                            disabled={isPending || !title.trim() || !body.trim() || (audience === "single" && !targetFid.trim())}
                            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-linear-to-r from-[#FFC931] to-[#FF9500] text-black rounded-2xl font-bold text-lg transition-all duration-300 hover:shadow-[0_0_30px_rgba(255,201,49,0.3)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none"
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

                        {audienceCount > 100 && audience !== "single" && (
                            <p className="text-xs text-center text-white/40">
                                ⚠️ This will send to {audienceCount.toLocaleString()} users
                            </p>
                        )}
                    </div>
                </div>
            </form>

            {/* Confirmation Modal */}
            <ConfirmationModal
                isOpen={showConfirmation}
                onClose={() => {
                    setShowConfirmation(false);
                    setPendingFormData(null);
                }}
                onConfirm={handleConfirmSend}
                title="Send Notification"
                description={`Are you sure you want to send this notification to ${audienceCount.toLocaleString()} user${audienceCount !== 1 ? "s" : ""}?`}
                confirmText="Send Now"
                cancelText="Cancel"
                variant="warning"
                isLoading={isPending}
                previewItems={getPreviewItems()}
            />
        </>
    );
}

export default NotificationForm;
