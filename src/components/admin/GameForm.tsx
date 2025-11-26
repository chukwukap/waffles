"use client";

import { GameActionResult } from "@/actions/admin/games";
import Link from "next/link";
import { CalendarIcon, CurrencyDollarIcon, PuzzlePieceIcon, PhotoIcon } from "@heroicons/react/24/outline";
import { useActionState, useState } from "react";
import { MediaUpload } from "@/components/admin/MediaUpload";

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

export function GameForm({ action, initialData, isEdit = false }: GameFormProps) {
    const [state, formAction] = useActionState<GameActionResult | null, FormData>(action, null);
    const [selectedTheme, setSelectedTheme] = useState(initialData?.theme || "FOOTBALL");

    // Default times if not provided
    const now = new Date();
    const defaultStart = initialData?.startsAt
        ? new Date(initialData.startsAt).toISOString().slice(0, 16)
        : new Date(now.getTime() + 60 * 60 * 1000).toISOString().slice(0, 16);

    const defaultEnd = initialData?.endsAt
        ? new Date(initialData.endsAt).toISOString().slice(0, 16)
        : new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString().slice(0, 16);

    const currentTheme = THEMES.find(t => t.id === selectedTheme) || THEMES[0];

    return (
        <form action={formAction} className="space-y-8">
            {/* Basic Info Section */}
            <div className="bg-slate-800 shadow-sm rounded-xl border border-slate-700 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-700 bg-slate-900 flex items-center gap-2">
                    <PhotoIcon className="h-5 w-5 text-slate-400" />
                    <h3 className="font-semibold text-slate-100">Game Details</h3>
                </div>
                <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-2 space-y-4">
                            <div>
                                <label htmlFor="title" className="block text-sm font-medium text-slate-300 mb-1">
                                    Game Title *
                                </label>
                                <input
                                    type="text"
                                    id="title"
                                    name="title"
                                    required
                                    defaultValue={initialData?.title}
                                    className="w-full px-4 py-2 border border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    placeholder="e.g., Friday Night Football Trivia"
                                />
                            </div>
                            <div>
                                <label htmlFor="description" className="block text-sm font-medium text-slate-300 mb-1">
                                    Description
                                </label>
                                <textarea
                                    id="description"
                                    name="description"
                                    rows={3}
                                    defaultValue={initialData?.description || ""}
                                    className="w-full px-4 py-2 border border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    placeholder="Brief description of the game..."
                                />
                            </div>

                            <div className="pt-2">
                                <MediaUpload
                                    label="Cover Image *"
                                    name="coverUrl"
                                    defaultValue={initialData?.coverUrl}
                                    maxSizeMB={4}
                                    accept="image/*"
                                    required
                                />
                            </div>
                        </div>

                        {/* Theme Selection with Preview */}
                        <div className="space-y-4">
                            <label htmlFor="theme" className="block text-sm font-medium text-slate-300 mb-1">
                                Theme *
                            </label>
                            <select
                                id="theme"
                                name="theme"
                                required
                                value={selectedTheme}
                                onChange={(e) => setSelectedTheme(e.target.value)}
                                className="w-full px-4 py-2 border border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent mb-4"
                            >
                                {THEMES.map((theme) => (
                                    <option key={theme.id} value={theme.id}>
                                        {theme.label}
                                    </option>
                                ))}
                            </select>

                            {/* Theme Preview Card */}
                            <div className={`rounded-xl p-4 text-white ${currentTheme.color} shadow-lg transition-colors duration-300`}>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-2xl">{currentTheme.icon}</span>
                                    <span className="text-xs font-bold bg-slate-800/20 px-2 py-1 rounded-full">PREVIEW</span>
                                </div>
                                <div className="font-bold text-lg mb-1">Game Title</div>
                                <div className="text-white/80 text-xs">50 USDC Prize Pool</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Schedule Section */}
            <div className="bg-slate-800 shadow-sm rounded-xl border border-slate-700 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-700 bg-slate-900 flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5 text-slate-400" />
                    <h3 className="font-semibold text-slate-100">Schedule</h3>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="startsAt" className="block text-sm font-medium text-slate-300 mb-1">
                            Start Time *
                        </label>
                        <input
                            type="datetime-local"
                            id="startsAt"
                            name="startsAt"
                            required
                            defaultValue={defaultStart}
                            className="w-full px-4 py-2 border border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                    </div>
                    <div>
                        <label htmlFor="endsAt" className="block text-sm font-medium text-slate-300 mb-1">
                            End Time *
                        </label>
                        <input
                            type="datetime-local"
                            id="endsAt"
                            name="endsAt"
                            required
                            defaultValue={defaultEnd}
                            className="w-full px-4 py-2 border border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                    </div>
                </div>
            </div>

            {/* Configuration Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Economics */}
                <div className="bg-slate-800 shadow-sm rounded-xl border border-slate-700 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-700 bg-slate-900 flex items-center gap-2">
                        <CurrencyDollarIcon className="h-5 w-5 text-slate-400" />
                        <h3 className="font-semibold text-slate-100">Economics</h3>
                    </div>
                    <div className="p-6 space-y-4">
                        <div>
                            <label htmlFor="entryFee" className="block text-sm font-medium text-slate-300 mb-1">
                                Entry Fee (USDC) *
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                                <input
                                    type="number"
                                    id="entryFee"
                                    name="entryFee"
                                    required
                                    defaultValue={initialData?.entryFee ?? 50}
                                    min={0}
                                    className="w-full pl-8 pr-4 py-2 border border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                />
                            </div>
                        </div>
                        <div>
                            <label htmlFor="prizePool" className="block text-sm font-medium text-slate-300 mb-1">
                                Prize Pool (USDC) *
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                                <input
                                    type="number"
                                    id="prizePool"
                                    name="prizePool"
                                    required
                                    defaultValue={initialData?.prizePool ?? 0}
                                    min={0}
                                    className="w-full pl-8 pr-4 py-2 border border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Gameplay */}
                <div className="bg-slate-800 shadow-sm rounded-xl border border-slate-700 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-700 bg-slate-900 flex items-center gap-2">
                        <PuzzlePieceIcon className="h-5 w-5 text-slate-400" />
                        <h3 className="font-semibold text-slate-100">Gameplay</h3>
                    </div>
                    <div className="p-6 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="roundDurationSec" className="block text-sm font-medium text-slate-300 mb-1">
                                    Round Duration (s)
                                </label>
                                <input
                                    type="number"
                                    id="roundDurationSec"
                                    name="roundDurationSec"
                                    required
                                    defaultValue={initialData?.roundDurationSec ?? 15}
                                    min={5}
                                    className="w-full px-4 py-2 border border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label htmlFor="maxPlayers" className="block text-sm font-medium text-slate-300 mb-1">
                                    Max Players
                                </label>
                                <input
                                    type="number"
                                    id="maxPlayers"
                                    name="maxPlayers"
                                    required
                                    defaultValue={initialData?.maxPlayers ?? 200}
                                    min={2}
                                    className="w-full px-4 py-2 border border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {state && !state.success && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-800">
                    <span className="text-xl">⚠️</span>
                    <p className="text-sm font-medium">{state.error}</p>
                </div>
            )}

            <div className="flex gap-4 pt-4">
                <button
                    type="submit"
                    className="px-8 py-3 bg-linear-to-r from-purple-600 to-pink-600 text-white font-medium rounded-xl hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                    {isEdit ? "Save Changes" : "Create Game"}
                </button>
                <Link
                    href="/admin/games"
                    className="px-6 py-3 border border-slate-600 text-slate-300 font-medium rounded-lg hover:bg-slate-700 transition-colors"
                >
                    Cancel
                </Link>
            </div>
        </form>
    );
}
