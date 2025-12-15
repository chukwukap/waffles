"use client";

import { GameActionResult } from "@/actions/admin/games";
import Link from "next/link";
import { CalendarIcon, CurrencyDollarIcon, PuzzlePieceIcon, PhotoIcon, SparklesIcon } from "@heroicons/react/24/outline";
import { useActionState, useState } from "react";
import { MediaPicker } from "@/components/admin/MediaPicker";

interface GameFormProps {
    action: (prevState: GameActionResult | null, formData: FormData) => Promise<GameActionResult>;
    initialData?: {
        title: string;
        description?: string | null;
        theme: string;
        coverUrl?: string | null;
        startsAt: Date;
        endsAt: Date;
        entryFee: number;
        prizePool: number;
        roundDurationSec: number;
        maxPlayers: number;
    };
    isEdit?: boolean;
}

const THEMES = [
    { id: "FOOTBALL", label: "Football", color: "bg-green-600", icon: "⚽" },
    { id: "MOVIES", label: "Movies", color: "bg-red-600", icon: "🎬" },
    { id: "ANIME", label: "Anime", color: "bg-pink-600", icon: "🎌" },
    { id: "POLITICS", label: "Politics", color: "bg-blue-800", icon: "🏛️" },
    { id: "CRYPTO", label: "Crypto", color: "bg-orange-500", icon: "₿" },
];

function SectionHeader({ number, icon: Icon, title, description }: {
    number: number;
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    description: string;
}) {
    return (
        <div className="flex items-start gap-4 mb-5">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#FFC931]/20 flex items-center justify-center text-[#FFC931] font-bold text-sm">
                {number}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <Icon className="h-5 w-5 text-[#FFC931]" />
                    <h3 className="font-semibold text-white font-display">{title}</h3>
                </div>
                <p className="text-sm text-white/50 mt-0.5">{description}</p>
            </div>
        </div>
    );
}

export function GameForm({ action, initialData, isEdit = false }: GameFormProps) {
    const [state, formAction] = useActionState<GameActionResult | null, FormData>(action, null);
    const [selectedTheme, setSelectedTheme] = useState(initialData?.theme || "");
    const [coverUrl, setCoverUrl] = useState(initialData?.coverUrl || "");

    // Format dates for datetime-local inputs (only if editing)
    const formatDateTime = (date?: Date) => date ? new Date(date).toISOString().slice(0, 16) : "";

    const currentTheme = THEMES.find(t => t.id === selectedTheme) || THEMES[0];

    return (
        <form action={formAction} className="space-y-8">
            {/* Error Display */}
            {state && !state.success && (
                <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-xl flex items-center gap-3 text-red-400">
                    <span className="text-xl">⚠️</span>
                    <p className="text-sm font-medium">{state.error}</p>
                </div>
            )}

            {/* Section 1: Basic Information */}
            <section className="admin-panel p-6">
                <SectionHeader
                    number={1}
                    icon={SparklesIcon}
                    title="Basic Information"
                    description="Set the game title, description, and theme"
                />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left: Title & Description */}
                    <div className="lg:col-span-2 space-y-5">
                        <div>
                            <label htmlFor="title" className="block text-sm font-medium text-white/70 mb-2">
                                Game Title <span className="text-red-400">*</span>
                            </label>
                            <input
                                type="text"
                                id="title"
                                name="title"
                                required
                                defaultValue={initialData?.title}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-lg placeholder-white/30 focus:ring-2 focus:ring-[#FFC931]/50 focus:border-[#FFC931] transition-all"
                                placeholder="e.g., Friday Night Football Trivia"
                            />
                        </div>
                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-white/70 mb-2">
                                Description <span className="text-white/30">(optional)</span>
                            </label>
                            <textarea
                                id="description"
                                name="description"
                                rows={3}
                                defaultValue={initialData?.description || ""}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:ring-2 focus:ring-[#FFC931]/50 focus:border-[#FFC931] transition-all resize-none"
                                placeholder="Describe what this game is about..."
                            />
                        </div>
                    </div>

                    {/* Right: Theme Selection */}
                    <div className="space-y-4">
                        <label className="block text-sm font-medium text-white/70">
                            Theme <span className="text-red-400">*</span>
                        </label>
                        <div className="grid grid-cols-5 gap-2">
                            {THEMES.map((theme) => (
                                <button
                                    key={theme.id}
                                    type="button"
                                    onClick={() => setSelectedTheme(theme.id)}
                                    className={`aspect - square rounded - xl text - xl sm: text - 2xl transition - all flex items - center justify - center ${selectedTheme === theme.id
                                        ? `${theme.color} ring-2 ring-white/50 scale-110 shadow-lg`
                                        : "bg-white/5 hover:bg-white/10 hover:scale-105"
                                        } `}
                                    title={theme.label}
                                >
                                    {theme.icon}
                                </button>
                            ))}
                        </div>
                        <input type="hidden" name="theme" value={selectedTheme} />
                        <div className={`rounded - xl p - 4 text - white ${currentTheme.color} text - center shadow - lg`}>
                            <span className="text-2xl mr-2">{currentTheme.icon}</span>
                            <span className="font-semibold">{currentTheme.label}</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Section 2: Cover Image */}
            <section className="admin-panel p-6">
                <SectionHeader
                    number={2}
                    icon={PhotoIcon}
                    title="Cover Image"
                    description="Choose an eye-catching image for the game card"
                />
                <MediaPicker
                    label=""
                    name="coverUrl"
                    accept="image"
                    onSelect={setCoverUrl}
                    selectedUrl={coverUrl}
                />
            </section>

            {/* Section 3: Schedule */}
            <section className="admin-panel p-6">
                <SectionHeader
                    number={3}
                    icon={CalendarIcon}
                    title="Schedule"
                    description="Set when the game starts and ends"
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="startsAt" className="block text-sm font-medium text-white/70 mb-2">
                            Start Time <span className="text-red-400">*</span>
                        </label>
                        <input
                            type="datetime-local"
                            id="startsAt"
                            name="startsAt"
                            required
                            defaultValue={formatDateTime(initialData?.startsAt)}
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-[#FFC931]/50 focus:border-[#FFC931] transition-all scheme-dark"
                        />
                    </div>
                    <div>
                        <label htmlFor="endsAt" className="block text-sm font-medium text-white/70 mb-2">
                            End Time <span className="text-red-400">*</span>
                        </label>
                        <input
                            type="datetime-local"
                            id="endsAt"
                            name="endsAt"
                            required
                            defaultValue={formatDateTime(initialData?.endsAt)}
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-[#FFC931]/50 focus:border-[#FFC931] transition-all scheme-dark"
                        />
                    </div>
                </div>
            </section>

            {/* Section 4: Economics & Gameplay */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Economics */}
                <section className="admin-panel p-6">
                    <SectionHeader
                        number={4}
                        icon={CurrencyDollarIcon}
                        title="Economics"
                        description="Entry fee and prize pool"
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="entryFee" className="block text-sm font-medium text-white/70 mb-2">
                                Entry Fee <span className="text-white/30">(USDC)</span>
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#FFC931] font-bold">$</span>
                                <input
                                    type="number"
                                    id="entryFee"
                                    name="entryFee"
                                    required
                                    defaultValue={initialData?.entryFee}
                                    min={0}
                                    step="0.01"
                                    className="w-full pl-8 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-[#FFC931]/50 focus:border-[#FFC931] transition-all"
                                />
                            </div>
                        </div>
                        <div>
                            <label htmlFor="prizePool" className="block text-sm font-medium text-white/70 mb-2">
                                Prize Pool <span className="text-white/30">(USDC)</span>
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#FFC931] font-bold">$</span>
                                <input
                                    type="number"
                                    id="prizePool"
                                    name="prizePool"
                                    required
                                    defaultValue={initialData?.prizePool}
                                    min={0}
                                    className="w-full pl-8 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-[#FFC931]/50 focus:border-[#FFC931] transition-all"
                                />
                            </div>
                        </div>
                    </div>
                </section>

                {/* Gameplay */}
                <section className="admin-panel p-6">
                    <SectionHeader
                        number={5}
                        icon={PuzzlePieceIcon}
                        title="Gameplay"
                        description="Round timing and player limits"
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="roundDurationSec" className="block text-sm font-medium text-white/70 mb-2">
                                Round Duration <span className="text-white/30">(seconds)</span>
                            </label>
                            <input
                                type="number"
                                id="roundDurationSec"
                                name="roundDurationSec"
                                required
                                defaultValue={initialData?.roundDurationSec}
                                min={5}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-[#FFC931]/50 focus:border-[#FFC931] transition-all"
                            />
                        </div>
                        <div>
                            <label htmlFor="maxPlayers" className="block text-sm font-medium text-white/70 mb-2">
                                Max Players
                            </label>
                            <input
                                type="number"
                                id="maxPlayers"
                                name="maxPlayers"
                                required
                                defaultValue={initialData?.maxPlayers}
                                min={2}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-[#FFC931]/50 focus:border-[#FFC931] transition-all"
                            />
                        </div>
                    </div>
                </section>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-white/10">
                <Link
                    href="/admin/games"
                    className="px-6 py-3 text-white/60 font-medium hover:text-white transition-colors"
                >
                    ← Cancel
                </Link>
                <button
                    type="submit"
                    className="px-10 py-3.5 bg-[#FFC931] text-black font-bold rounded-xl hover:bg-[#FFD966] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-[#FFC931] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#FFC931]/20 transition-all hover:scale-[1.02] active:scale-[0.98] font-display text-lg"
                >
                    {isEdit ? "Save Changes" : "Create Game →"}
                </button>
            </div>
        </form>
    );
}
