"use client";

import { createGameAction } from "@/actions/admin/games";
import { GameForm } from "@/components/admin/GameForm";
import Link from "next/link";

export default function CreateGamePage() {
    return (
        <div className="max-w-4xl space-y-6">
            <div className="flex items-center gap-4">
                <Link
                    href="/admin/games"
                    className="text-slate-400 hover:text-slate-100 font-medium"
                >
                    ← Back
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-slate-100">Create New Game</h1>
                    <p className="text-slate-400 mt-1">Set up a new trivia game</p>
                </div>
            </div>

            <GameForm action={createGameAction} />
        </div>
    );
}
