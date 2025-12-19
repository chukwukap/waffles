"use client";

import { useState } from "react";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { reorderQuestionsAction, deleteQuestionAction } from "@/actions/admin/questions";
import { TrashIcon, Bars3Icon, MusicalNoteIcon, PhotoIcon, CheckCircleIcon } from "@heroicons/react/24/outline";
import Image from "next/image";

interface Question {
    id: number;
    content: string;
    roundIndex: number;
    mediaUrl?: string | null;
    soundUrl?: string | null;
    options: string[];
    correctIndex: number;
    durationSec: number;
}

interface QuestionListProps {
    gameId: number;
    initialQuestions: Question[];
}

function SortableQuestionItem({ question, gameId }: { question: Question; gameId: number }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: question.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 1 : 0,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="bg-white/5 border border-white/[0.08] rounded-2xl backdrop-blur-lg p-4 flex items-start gap-4 group hover:border-[#FFC931]/30 transition-colors"
        >
            {/* Drag Handle */}
            <div
                {...attributes}
                {...listeners}
                className="mt-1 cursor-grab active:cursor-grabbing text-white/30 hover:text-white/60"
            >
                <Bars3Icon className="h-5 w-5" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                {/* Badges */}
                <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="text-xs font-bold text-[#FFC931] bg-[#FFC931]/10 px-2 py-0.5 rounded-full">
                        Q{question.roundIndex}
                    </span>
                    <span className="text-xs text-white/40">{question.durationSec}s</span>
                    {question.mediaUrl && (
                        <span className="text-xs flex items-center gap-1 text-[#00CFF2] bg-[#00CFF2]/10 px-2 py-0.5 rounded-full">
                            <PhotoIcon className="h-3 w-3" /> Image
                        </span>
                    )}
                    {question.soundUrl && (
                        <span className="text-xs flex items-center gap-1 text-[#FB72FF] bg-[#FB72FF]/10 px-2 py-0.5 rounded-full">
                            <MusicalNoteIcon className="h-3 w-3" /> Audio
                        </span>
                    )}
                </div>

                {/* Question Text */}
                <p className="text-white font-medium mb-3">{question.content}</p>

                {/* Options Grid */}
                <div className="grid grid-cols-2 gap-2 text-sm">
                    {question.options.map((opt, idx) => (
                        <div
                            key={idx}
                            className={`px-3 py-2 rounded-lg flex items-center gap-2 ${idx === question.correctIndex
                                    ? "bg-[#14B985]/20 border border-[#14B985]/30 text-[#14B985]"
                                    : "bg-white/5 border border-white/10 text-white/60"
                                }`}
                        >
                            <span className="font-bold text-white/40">{String.fromCharCode(65 + idx)}.</span>
                            <span className="truncate">{opt}</span>
                            {idx === question.correctIndex && (
                                <CheckCircleIcon className="h-4 w-4 ml-auto shrink-0" />
                            )}
                        </div>
                    ))}
                </div>

                {/* Media Previews */}
                {(question.mediaUrl || question.soundUrl) && (
                    <div className="mt-3 flex gap-3">
                        {question.mediaUrl && (
                            <div className="relative h-16 w-24 rounded-lg overflow-hidden border border-white/10 bg-black/30">
                                <Image
                                    src={question.mediaUrl}
                                    alt="Question media"
                                    fill
                                    className="object-cover"
                                    sizes="96px"
                                />
                            </div>
                        )}
                        {question.soundUrl && (
                            <div className="flex items-center h-16 px-3 rounded-lg border border-white/10 bg-black/30">
                                <audio controls className="h-8">
                                    <source src={question.soundUrl} />
                                </audio>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Delete Button */}
            <form action={deleteQuestionAction.bind(null, question.id, gameId)}>
                <button
                    type="submit"
                    className="p-2 text-white/30 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    title="Delete Question"
                >
                    <TrashIcon className="h-5 w-5" />
                </button>
            </form>
        </div>
    );
}

export function QuestionList({ gameId, initialQuestions }: QuestionListProps) {
    const [questions, setQuestions] = useState(initialQuestions);
    const [isSaving, setIsSaving] = useState(false);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            setQuestions((items) => {
                const oldIndex = items.findIndex((q) => q.id === active.id);
                const newIndex = items.findIndex((q) => q.id === over.id);
                const newItems = arrayMove(items, oldIndex, newIndex);

                setIsSaving(true);
                reorderQuestionsAction(gameId, newItems.map(q => q.id))
                    .then(() => setIsSaving(false))
                    .catch(() => setIsSaving(false));

                return newItems;
            });
        }
    };

    if (questions.length === 0) {
        return (
            <div className="text-center py-16 bg-white/5 border border-white/[0.08] rounded-2xl backdrop-blur-lg">
                <div className="text-5xl mb-4">📝</div>
                <p className="text-white/60 font-medium">No questions yet</p>
                <p className="text-white/40 text-sm mt-1">Add your first question using the form →</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {isSaving && (
                <div className="text-xs text-[#FFC931] font-medium animate-pulse text-right">
                    Saving order...
                </div>
            )}
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <SortableContext
                    items={questions.map((q) => q.id)}
                    strategy={verticalListSortingStrategy}
                >
                    <div className="space-y-3">
                        {questions.map((question) => (
                            <SortableQuestionItem
                                key={question.id}
                                question={question}
                                gameId={gameId}
                            />
                        ))}
                    </div>
                </SortableContext>
            </DndContext>
        </div>
    );
}

