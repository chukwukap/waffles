"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { EllipsisVerticalIcon, PencilIcon, TrashIcon, PlayIcon, StopIcon, DocumentDuplicateIcon, EyeIcon } from "@heroicons/react/24/outline";
import { startGameAction, endGameAction } from "@/actions/admin/games";
import { duplicateGameAction } from "@/actions/admin/duplicate-game";
import { DeleteGameButton } from "@/components/admin/DeleteGameButton";
import { notify } from "@/components/ui/Toaster";

interface GameActionsProps {
    game: {
        id: number;
        title: string;
        status: string;
        _count: {
            questions: number;
        };
    };
    onOpenChange?: (isOpen: boolean) => void;
}

export function GameActions({ game, onOpenChange }: GameActionsProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [position, setPosition] = useState({ top: 0, right: 0 });
    const buttonRef = useRef<HTMLButtonElement>(null);

    const toggleOpen = (open: boolean) => {
        setIsOpen(open);
        onOpenChange?.(open);
    };

    useEffect(() => {
        if (isOpen && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            setPosition({
                top: rect.bottom + window.scrollY + 4,
                right: window.innerWidth - rect.right - window.scrollX,
            });
        }
    }, [isOpen]);

    const handleStartGame = async () => {
        if (!confirm(`Start "${game.title}"? This will make it live for players.`)) {
            return;
        }

        setIsLoading(true);
        try {
            const result = await startGameAction(game.id);
            if (result.success) {
                notify.success("Game started successfully!");
                toggleOpen(false);
            } else {
                notify.error(result.error || "Failed to start game");
            }
        } catch (error) {
            notify.error("An error occurred while starting the game");
        } finally {
            setIsLoading(false);
        }
    };

    const handleEndGame = async () => {
        if (!confirm(`End "${game.title}"? This will stop the game and finalize results.`)) {
            return;
        }

        setIsLoading(true);
        try {
            const result = await endGameAction(game.id);
            if (result.success) {
                notify.success("Game ended successfully!");
                toggleOpen(false);
            } else {
                notify.error(result.error || "Failed to end game");
            }
        } catch (error) {
            notify.error("An error occurred while ending the game");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDuplicateGame = async () => {
        if (!confirm(`Duplicate "${game.title}"? This will create a copy with all questions.`)) {
            return;
        }

        setIsLoading(true);
        try {
            await duplicateGameAction(game.id);
            notify.success("Game duplicated successfully!");
            // Note: action redirects automatically
        } catch (error) {
            notify.error("Failed to duplicate game");
            setIsLoading(false);
        }
    };

    return (
        <>
            <button
                ref={buttonRef}
                onClick={() => toggleOpen(!isOpen)}
                className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded-lg transition-colors"
                title="More actions"
                disabled={isLoading}
            >
                <EllipsisVerticalIcon className="h-5 w-5" />
            </button>

            {isOpen && typeof document !== 'undefined' && createPortal(
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => toggleOpen(false)}
                    />

                    {/* Dropdown Menu */}
                    <div
                        className="fixed w-48 bg-slate-800 rounded-lg shadow-lg border border-slate-700 py-1 z-50"
                        style={{ top: `${position.top}px`, right: `${position.right}px` }}
                    >
                        <Link
                            href={`/admin/games/${game.id}`}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-[#FFC931] hover:bg-slate-700 transition-colors"
                            onClick={() => toggleOpen(false)}
                        >
                            <EyeIcon className="h-4 w-4" />
                            View Details
                        </Link>

                        <Link
                            href={`/admin/games/${game.id}/edit`}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 transition-colors"
                            onClick={() => toggleOpen(false)}
                        >
                            <PencilIcon className="h-4 w-4" />
                            Edit Game
                        </Link>

                        <Link
                            href={`/admin/games/${game.id}/questions`}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 transition-colors"
                            onClick={() => toggleOpen(false)}
                        >
                            <span className="text-xs font-bold border border-current rounded px-1.5 py-0.5">Q</span>
                            Manage Questions
                        </Link>

                        <div className="border-t border-slate-700 my-1" />

                        <button
                            onClick={handleDuplicateGame}
                            disabled={isLoading}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-blue-700 hover:bg-blue-50 transition-colors w-full disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <DocumentDuplicateIcon className="h-4 w-4" />
                            Duplicate Game
                        </button>

                        {game.status === "SCHEDULED" && (
                            <>
                                <div className="border-t border-slate-700 my-1" />
                                <button
                                    onClick={handleStartGame}
                                    disabled={isLoading || game._count.questions === 0}
                                    className="flex items-center gap-2 px-4 py-2 text-sm text-green-700 hover:bg-green-50 transition-colors w-full disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <PlayIcon className="h-4 w-4" />
                                    Start Game
                                </button>
                            </>
                        )}

                        {game.status === "LIVE" && (
                            <>
                                <div className="border-t border-slate-700 my-1" />
                                <button
                                    onClick={handleEndGame}
                                    disabled={isLoading}
                                    className="flex items-center gap-2 px-4 py-2 text-sm text-orange-700 hover:bg-orange-50 transition-colors w-full disabled:opacity-50"
                                >
                                    <StopIcon className="h-4 w-4" />
                                    End Game
                                </button>
                            </>
                        )}

                        <div className="border-t border-slate-700 my-1" />
                        <DeleteGameButton
                            gameId={game.id}
                            gameTitle={game.title}
                            onSuccess={() => toggleOpen(false)}
                            variant="dropdown"
                        />
                    </div>
                </>,
                document.body
            )}
        </>
    );
}
