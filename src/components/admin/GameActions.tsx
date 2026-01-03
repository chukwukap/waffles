"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import {
  EllipsisVerticalIcon,
  PencilIcon,
  EyeIcon,
} from "@heroicons/react/24/outline";
import { DeleteGameButton } from "@/components/admin/DeleteGameButton";

interface GameActionsProps {
  game: {
    id: string;
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
  return (
    <>
      <button
        ref={buttonRef}
        onClick={() => toggleOpen(!isOpen)}
        className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded-lg transition-colors"
        title="More actions"
      >
        <EllipsisVerticalIcon className="h-5 w-5" />
      </button>

      {isOpen &&
        typeof document !== "undefined" &&
        createPortal(
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
                <span className="text-xs font-bold border border-current rounded px-1.5 py-0.5">
                  Q
                </span>
                Manage Questions
              </Link>

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
