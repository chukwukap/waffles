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
import { TrashIcon, Bars3Icon, MusicalNoteIcon, PhotoIcon } from "@heroicons/react/24/outline";

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
            className="bg-white border border-slate-200 rounded-lg p-4 flex items-start gap-4 group hover:border-purple-300 transition-colors"
        >
            <div
                {...attributes}
                {...listeners}
                className="mt-1 cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600"
            >
                <Bars3Icon className="h-5 w-5" />
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        Round {question.roundIndex}
                    </span>
                    <span className="text-xs text-slate-400">{question.durationSec}s</span>
                    {question.mediaUrl && (
                        <span className="text-xs flex items-center gap-1 text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                            <PhotoIcon className="h-3 w-3" /> Media
                        </span>
                    )}
                    {question.soundUrl && (
                        <span className="text-xs flex items-center gap-1 text-pink-600 bg-pink-50 px-2 py-0.5 rounded">
                            <MusicalNoteIcon className="h-3 w-3" /> Audio
                        </span>
                    )}
                </div>

                <p className="text-slate-900 font-medium truncate">{question.content}</p>

                <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                    {question.options.map((opt, idx) => (
                        <div
                            key={idx}
                            className={`px-2 py-1 rounded border ${idx === question.correctIndex
                                    ? "bg-green-50 border-green-200 text-green-700"
                                    : "bg-slate-50 border-slate-100 text-slate-500"
                                }`}
                        >
                            <span className="font-bold mr-1">{String.fromCharCode(65 + idx)}.</span>
                            {opt}
                        </div>
                    ))}
                </div>

                {/* Media Previews */}
                {(question.mediaUrl || question.soundUrl) && (
                    <div className="mt-3 flex gap-4">
                        {question.mediaUrl && (
                            <div className="relative h-20 w-32 rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
                                <img
                                    src={question.mediaUrl}
                                    alt="Question media"
                                    className="h-full w-full object-cover"
                                />
                            </div>
                        )}
                        {question.soundUrl && (
                            <div className="flex items-center justify-center h-20 w-32 rounded-lg border border-slate-200 bg-slate-50">
                                <audio controls className="w-28 h-8">
                                    <source src={question.soundUrl} />
                                </audio>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <form action={deleteQuestionAction.bind(null, question.id, gameId)}>
                <button
                    type="submit"
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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

                // Update round indices locally for immediate feedback
                const updatedItems = newItems.map((item, index) => ({
                    ...item,
                    roundIndex: index + 1
                }));

                // Trigger server action
                setIsSaving(true);
                reorderQuestionsAction(gameId, updatedItems.map(q => q.id))
                    .then(() => setIsSaving(false))
                    .catch(() => {
                        setIsSaving(false);
                        // Ideally revert state on error, but for now we just stop loading
                    });

                return updatedItems;
            });
        }
    };

    return (
        <div className="space-y-4">
            {isSaving && (
                <div className="text-xs text-purple-600 font-medium animate-pulse text-right">
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

            {questions.length === 0 && (
                <div className="text-center py-12 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                    <p className="text-slate-500">No questions yet. Add one above!</p>
                </div>
            )}
        </div>
    );
}
