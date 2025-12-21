"use client";

import { TrophyIcon, UsersIcon, TicketIcon, CurrencyDollarIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

interface GameData {
    id: number;
    title: string;
    theme: string;
    status: string;
    playerCount: number;
    ticketCount: number;
    revenue: number;
    avgScore: number;
}

interface GamePerformanceTableProps {
    games: GameData[];
}

const THEME_COLORS: Record<string, { bg: string; text: string }> = {
    FOOTBALL: { bg: "bg-green-500/20", text: "text-green-400" },
    MOVIES: { bg: "bg-red-500/20", text: "text-red-400" },
    ANIME: { bg: "bg-pink-500/20", text: "text-pink-400" },
    POLITICS: { bg: "bg-blue-500/20", text: "text-blue-400" },
    CRYPTO: { bg: "bg-orange-500/20", text: "text-orange-400" },
};

const THEME_ICONS: Record<string, string> = {
    FOOTBALL: "⚽",
    MOVIES: "🎬",
    ANIME: "🎌",
    POLITICS: "🏛️",
    CRYPTO: "₿",
};

export function GamePerformanceTable({ games }: GamePerformanceTableProps) {
    return (
        <div className="bg-linear-to-br from-[#14B985]/5 to-transparent rounded-2xl border border-white/10 overflow-hidden">
            <div className="px-6 py-4 border-b border-white/6 flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold text-white font-display">Game Performance</h3>
                    <p className="text-sm text-white/50">Top performing games by revenue</p>
                </div>
                <Link
                    href="/admin/games"
                    className="text-sm text-[#FFC931] hover:text-[#FFD966] font-medium transition-colors"
                >
                    View All →
                </Link>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full">
                    <thead className="bg-white/3">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-white/50 uppercase tracking-wider font-display">
                                Rank
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-white/50 uppercase tracking-wider font-display">
                                Game
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-white/50 uppercase tracking-wider font-display">
                                Theme
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-white/50 uppercase tracking-wider font-display">
                                Players
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-white/50 uppercase tracking-wider font-display">
                                Tickets
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-white/50 uppercase tracking-wider font-display">
                                Revenue
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-white/50 uppercase tracking-wider font-display">
                                Avg Score
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/6">
                        {games.map((game, index) => {
                            const themeStyle = THEME_COLORS[game.theme] || THEME_COLORS.FOOTBALL;
                            const themeIcon = THEME_ICONS[game.theme] || "🎮";

                            return (
                                <tr key={game.id} className="border-b border-white/4 hover:bg-white/3">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`text-xl font-bold font-body ${index === 0 ? "text-[#FFC931] " :
                                            index === 1 ? "text-[#C0C0C0]" :
                                                index === 2 ? "text-[#CD7F32]" :
                                                    "text-white/40"
                                            }`}>
                                            #{index + 1}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <Link
                                            href={`/admin/games/${game.id}`}
                                            className="font-medium text-white hover:text-[#FFC931] transition-colors"
                                        >
                                            {game.title}
                                        </Link>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${themeStyle.bg} ${themeStyle.text}`}>
                                            <span>{themeIcon}</span>
                                            {game.theme}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                        <div className="flex items-center justify-end gap-1.5">
                                            <UsersIcon className="h-4 w-4 text-[#00CFF2]" />
                                            <span className="text-[#00CFF2] font-medium">{game.playerCount}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                        <div className="flex items-center justify-end gap-1.5">
                                            <TicketIcon className="h-4 w-4 text-[#FB72FF]" />
                                            <span className="text-[#FB72FF] font-medium">{game.ticketCount}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                        <span className="text-[#FFC931] font-bold font-body">
                                            ${game.revenue.toFixed(2)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                        <span className="text-[#14B985] font-medium">
                                            {game.avgScore.toFixed(0)}
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                        {games.length === 0 && (
                            <tr>
                                <td colSpan={7} className="px-6 py-12 text-center">
                                    <TrophyIcon className="h-12 w-12 text-white/20 mx-auto mb-3" />
                                    <p className="text-white/50 font-display">No games yet</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
