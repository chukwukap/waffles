"use client";

import { useState } from "react";
import { GameActions } from "@/components/admin/GameActions";

function GameStatusBadge({ status }: { status: string }) {
    const colors = {
        SCHEDULED: "bg-blue-100 text-blue-800",
        LIVE: "bg-green-100 text-green-800",
        ENDED: "bg-gray-100 text-slate-200",
        CANCELLED: "bg-red-100 text-red-800",
    };

    return (
        <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[status as keyof typeof colors]
                }`}
        >
            {status}
        </span>
    );
}

export function GameRow({ game }: { game: any }) {
    const [isActionsOpen, setIsActionsOpen] = useState(false);

    return (
        <tr className={`hover:bg-slate-700 transition-colors ${isActionsOpen ? 'relative z-50' : ''}`}>
            <td className="px-6 py-4 whitespace-nowrap">
                <div className="font-medium text-slate-100 text-base">{game.title}</div>
                <div className="text-xs text-slate-400 capitalize mt-0.5 bg-slate-700 inline-block px-2 py-0.5 rounded-md">
                    {game.theme.toLowerCase()}
                </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
                <GameStatusBadge status={game.status} />
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                {new Date(game.startsAt).toLocaleString()}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                <div className="font-medium">{game._count.players} players</div>
                <div className="text-xs text-slate-400">{game._count.tickets} tickets</div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                {game._count.questions} questions
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm relative">
                <GameActions game={game} onOpenChange={setIsActionsOpen} />
            </td>
        </tr>
    );
}
