"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";

const THEMES = [
    { value: "", label: "All Themes" },
    { value: "FOOTBALL", label: "⚽ Football" },
    { value: "MOVIES", label: "🎬 Movies" },
    { value: "ANIME", label: "🎌 Anime" },
    { value: "POLITICS", label: "🏛️ Politics" },
    { value: "CRYPTO", label: "₿ Crypto" },
    { value: "GENERAL", label: "🌐 General" },
];

const DIFFICULTIES = [
    { value: "", label: "All Levels" },
    { value: "EASY", label: "Easy", color: "text-green-400" },
    { value: "MEDIUM", label: "Medium", color: "text-yellow-400" },
    { value: "HARD", label: "Hard", color: "text-red-400" },
];

interface QuestionBankFiltersProps {
    currentTheme?: string;
    currentDifficulty?: string;
    currentSearch?: string;
    themeCounts?: Record<string, number>;
}

export function QuestionBankFilters({
    currentTheme,
    currentDifficulty,
    currentSearch,
    themeCounts = {},
}: QuestionBankFiltersProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();
    const [searchInput, setSearchInput] = useState(currentSearch || "");

    const updateFilters = (updates: Record<string, string | undefined>) => {
        const params = new URLSearchParams(searchParams.toString());

        Object.entries(updates).forEach(([key, value]) => {
            if (value) {
                params.set(key, value);
            } else {
                params.delete(key);
            }
        });

        // Reset page when filters change
        params.delete("page");

        startTransition(() => {
            router.push(`/admin/questions?${params.toString()}`);
        });
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        updateFilters({ search: searchInput || undefined });
    };

    const clearSearch = () => {
        setSearchInput("");
        updateFilters({ search: undefined });
    };

    return (
        <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <form onSubmit={handleSearch} className="flex-1 min-w-[200px] max-w-md">
                <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                    <input
                        type="text"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        placeholder="Search questions..."
                        className="w-full pl-10 pr-10 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-white/30 focus:ring-2 focus:ring-[#FFC931]/50 focus:border-[#FFC931] transition-all"
                    />
                    {searchInput && (
                        <button
                            type="button"
                            onClick={clearSearch}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white"
                        >
                            <XMarkIcon className="h-4 w-4" />
                        </button>
                    )}
                </div>
            </form>

            {/* Theme Filter */}
            <select
                value={currentTheme || ""}
                onChange={(e) => updateFilters({ theme: e.target.value || undefined })}
                className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:ring-2 focus:ring-[#FFC931]/50 focus:border-[#FFC931] transition-all"
            >
                {THEMES.map((theme) => (
                    <option key={theme.value} value={theme.value} className="bg-[#0a0a0b]">
                        {theme.label}
                        {theme.value && themeCounts[theme.value]
                            ? ` (${themeCounts[theme.value]})`
                            : ""}
                    </option>
                ))}
            </select>

            {/* Difficulty Filter */}
            <select
                value={currentDifficulty || ""}
                onChange={(e) => updateFilters({ difficulty: e.target.value || undefined })}
                className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:ring-2 focus:ring-[#FFC931]/50 focus:border-[#FFC931] transition-all"
            >
                {DIFFICULTIES.map((diff) => (
                    <option key={diff.value} value={diff.value} className="bg-[#0a0a0b]">
                        {diff.label}
                    </option>
                ))}
            </select>

            {/* Loading indicator */}
            {isPending && (
                <div className="h-5 w-5 border-2 border-[#FFC931]/30 border-t-[#FFC931] rounded-full animate-spin" />
            )}
        </div>
    );
}
