"use client";

import { useRouter, useSearchParams } from "next/navigation";

export function GameFilter({ games }: { games: { id: number; title: string }[] }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentGame = searchParams.get("game") || "";

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const url = new URL(window.location.href);
        if (e.target.value) {
            url.searchParams.set("game", e.target.value);
        } else {
            url.searchParams.delete("game");
        }
        router.push(url.pathname + url.search);
    };

    return (
        <select
            value={currentGame}
            onChange={handleChange}
            className="px-4 py-2 rounded-xl text-sm font-medium bg-white/5 text-white/60 border border-white/10 focus:outline-none focus:border-white/20"
        >
            <option value="">All Games</option>
            {games.map((game) => (
                <option key={game.id} value={game.id}>
                    {game.title}
                </option>
            ))}
        </select>
    );
}
