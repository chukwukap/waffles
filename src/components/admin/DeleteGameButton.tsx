"use client";

import { TrashIcon } from "@heroicons/react/24/outline";
import { deleteGameAction } from "@/actions/admin/games";

interface DeleteGameButtonProps {
    gameId: number;
    gameTitle: string;
    onSuccess?: () => void;
    variant?: "button" | "dropdown";
}

export function DeleteGameButton({
    gameId,
    gameTitle,
    onSuccess,
    variant = "button"
}: DeleteGameButtonProps) {
    const handleDelete = async (e: React.FormEvent) => {
        if (!confirm(`Delete "${gameTitle}"?`)) {
            e.preventDefault();
            return;
        }

        // If variant is dropdown, prevent default and handle manually
        if (variant === "dropdown") {
            e.preventDefault();
            try {
                await deleteGameAction(gameId);
                onSuccess?.();
            } catch (error) {
                console.error("Delete failed:", error);
            }
        }
    };

    if (variant === "dropdown") {
        return (
            <form onSubmit={handleDelete} className="w-full">
                <button
                    type="submit"
                    className="flex items-center gap-2 px-4 py-2 text-sm text-red-700 hover:bg-red-50 transition-colors w-full text-left"
                >
                    <TrashIcon className="h-4 w-4" />
                    Delete Game
                </button>
            </form>
        );
    }

    return (
        <form action={deleteGameAction.bind(null, gameId)}>
            <button
                type="submit"
                className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                onClick={(e) => {
                    if (!confirm(`Delete "${gameTitle}"?`)) {
                        e.preventDefault();
                    }
                }}
                title="Delete Game"
            >
                <TrashIcon className="h-5 w-5" />
            </button>
        </form>
    );
}
