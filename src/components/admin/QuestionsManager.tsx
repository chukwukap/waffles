"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { createQuestionAction } from "@/actions/admin/questions";
import { TrashIcon, Bars3Icon, MusicalNoteIcon, PhotoIcon, PlusIcon, ChevronDownIcon, ChevronRightIcon, PencilIcon } from "@heroicons/react/24/outline";
import { CheckCircleIcon } from "@heroicons/react/24/solid";
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

interface QuestionsManagerProps {
    gameId: string;
    initialQuestions: Question[];
}

// Compact question row component
function QuestionRow({
    question,
    gameId,
    isExpanded,
    onToggle
}: {
    question: Question;
    gameId: string;
    isExpanded: boolean;
    onToggle: () => void;
}) {
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
        zIndex: isDragging ? 50 : 1,
        opacity: isDragging ? 0.5 : 1,
    };

    const correctLetter = String.fromCharCode(65 + question.correctIndex);

    return (
        <div ref={setNodeRef} style={style} className="group">
            {/* Main Row */}
            <div className={`flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-xl transition-all ${isExpanded ? 'rounded-b-none border-b-0' : 'hover:bg-white/[0.08]'}`}>
                {/* Drag Handle */}
                <div
                    {...attributes}
                    {...listeners}
                    className="cursor-grab active:cursor-grabbing text-white/20 hover:text-white/40 p-1"
                >
                    <Bars3Icon className="h-4 w-4" />
                </div>

                {/* Round Badge */}
                <div className="w-10 h-10 rounded-lg bg-[#FFC931]/10 flex items-center justify-center text-[#FFC931] font-bold text-sm shrink-0">
                    {question.roundIndex}
                </div>

                {/* Question Content */}
                <div className="flex-1 min-w-0">
                    <p className="text-white font-medium text-sm truncate">{question.content}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-white/40">
                        <span className="flex items-center gap-1">
                            <CheckCircleIcon className="h-3 w-3 text-[#14B985]" />
                            {correctLetter}
                        </span>
                        <span>{question.durationSec}s</span>
                        {question.mediaUrl && <span className="text-[#00CFF2]">📷</span>}
                        {question.soundUrl && <span className="text-[#FB72FF]">🎵</span>}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                    <button
                        onClick={onToggle}
                        className="p-2 text-white/30 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                    >
                        {isExpanded ? <ChevronDownIcon className="h-4 w-4" /> : <ChevronRightIcon className="h-4 w-4" />}
                    </button>
                    <form action={deleteQuestionAction.bind(null, question.id, gameId)}>
                        <button
                            type="submit"
                            className="p-2 text-white/30 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                        >
                            <TrashIcon className="h-4 w-4" />
                        </button>
                    </form>
                </div>
            </div>

            {/* Expanded Details */}
            {isExpanded && (
                <div className="p-4 bg-white/[0.03] border border-white/10 border-t-0 rounded-b-xl space-y-3">
                    {/* Options */}
                    <div className="grid grid-cols-2 gap-2">
                        {question.options.map((opt, idx) => (
                            <div
                                key={idx}
                                className={`px-3 py-2 rounded-lg text-sm flex items-center gap-2 ${idx === question.correctIndex
                                    ? "bg-[#14B985]/20 border border-[#14B985]/30 text-[#14B985]"
                                    : "bg-white/5 border border-white/10 text-white/60"
                                    }`}
                            >
                                <span className="font-bold text-white/30">{String.fromCharCode(65 + idx)}</span>
                                <span className="truncate">{opt}</span>
                                {idx === question.correctIndex && <CheckCircleIcon className="h-4 w-4 ml-auto shrink-0" />}
                            </div>
                        ))}
                    </div>

                    {/* Media */}
                    {(question.mediaUrl || question.soundUrl) && (
                        <div className="flex gap-3 pt-2 border-t border-white/10">
                            {question.mediaUrl && (
                                <div className="relative h-20 w-32 rounded-lg overflow-hidden border border-white/10">
                                    <Image src={question.mediaUrl} alt="Media" fill className="object-cover" sizes="128px" />
                                </div>
                            )}
                            {question.soundUrl && (
                                <audio controls className="h-10">
                                    <source src={question.soundUrl} />
                                </audio>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// Add Question Form - Inline compact version
function InlineAddQuestion({ gameId, nextRoundIndex, onSuccess }: { gameId: string; nextRoundIndex: number; onSuccess: () => void }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        const form = e.currentTarget;
        const formData = new FormData(form);

        try {
            const result = await createQuestionAction(gameId, null, formData);
            if (result.success) {
                form.reset();
                setIsOpen(false);
                onSuccess();
            } else {
                setError(result.error || 'Failed to add question');
            }
        } catch (err) {
            setError('Failed to add question');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="w-full p-4 border-2 border-dashed border-white/20 rounded-xl text-white/40 hover:text-[#FFC931] hover:border-[#FFC931]/50 hover:bg-[#FFC931]/5 transition-all flex items-center justify-center gap-2"
            >
                <PlusIcon className="h-5 w-5" />
                <span className="font-medium">Add Question</span>
            </button>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="bg-white/5 border border-white/[0.08] rounded-2xl backdrop-blur-lg p-4 space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="font-semibold text-white">New Question</h3>
                <button type="button" onClick={() => setIsOpen(false)} className="text-white/40 hover:text-white">✕</button>
            </div>

            {error && (
                <div className="p-2 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm">
                    {error}
                </div>
            )}

            {/* Question + Round */}
            <div className="flex gap-3">
                <div className="flex-1">
                    <textarea
                        name="content"
                        required
                        rows={2}
                        placeholder="Enter your question..."
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-white/30 focus:ring-2 focus:ring-[#FFC931]/50 focus:border-[#FFC931] transition-all resize-none"
                    />
                </div>
                <div className="w-20">
                    <input
                        type="number"
                        name="roundIndex"
                        defaultValue={nextRoundIndex}
                        min={1}
                        placeholder="Q#"
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm text-center focus:ring-2 focus:ring-[#FFC931]/50 focus:border-[#FFC931] transition-all"
                    />
                    <div className="text-[10px] text-white/30 text-center mt-1">Round</div>
                </div>
            </div>

            {/* Options in 2x2 grid */}
            <div className="grid grid-cols-2 gap-2">
                {['A', 'B', 'C', 'D'].map((letter) => (
                    <input
                        key={letter}
                        type="text"
                        name={`option${letter}`}
                        required
                        placeholder={`Option ${letter}`}
                        className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-white/30 focus:ring-2 focus:ring-[#FFC931]/50 focus:border-[#FFC931] transition-all"
                    />
                ))}
            </div>

            {/* Correct + Duration */}
            <div className="flex gap-3">
                <select
                    name="correctAnswer"
                    required
                    className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:ring-2 focus:ring-[#FFC931]/50 focus:border-[#FFC931] transition-all"
                >
                    <option value="" className="bg-[#0a0a0b]">Correct Answer</option>
                    <option value="A" className="bg-[#0a0a0b]">A</option>
                    <option value="B" className="bg-[#0a0a0b]">B</option>
                    <option value="C" className="bg-[#0a0a0b]">C</option>
                    <option value="D" className="bg-[#0a0a0b]">D</option>
                </select>
                <input
                    type="number"
                    name="durationSec"
                    defaultValue={10}
                    min={5}
                    className="w-24 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm text-center focus:ring-2 focus:ring-[#FFC931]/50 focus:border-[#FFC931] transition-all"
                />
            </div>

            {/* Hidden fields for media */}
            <input type="hidden" name="mediaUrl" value="" />
            <input type="hidden" name="soundUrl" value="" />

            {/* Submit */}
            <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 bg-[#FFC931] text-black font-bold text-sm rounded-lg hover:bg-[#FFD966] disabled:opacity-50 transition-all"
            >
                {isSubmitting ? 'Adding...' : 'Add Question'}
            </button>
        </form>
    );
}

export function QuestionsManager({ gameId, initialQuestions }: QuestionsManagerProps) {
    const router = useRouter();
    const [questions, setQuestions] = useState(initialQuestions);
    const [expandedId, setExpandedId] = useState<number | null>(null);
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

    const handleQuestionAdded = () => {
        // Refresh server data to get new question
        router.refresh();
    };

    return (
        <div className="space-y-3">
            {/* Saving indicator */}
            {isSaving && (
                <div className="text-xs text-[#FFC931] font-medium animate-pulse">
                    Saving order...
                </div>
            )}

            {/* Questions List */}
            {questions.length > 0 ? (
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext
                        items={questions.map((q) => q.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        <div className="space-y-2">
                            {questions.map((question) => (
                                <QuestionRow
                                    key={question.id}
                                    question={question}
                                    gameId={gameId}
                                    isExpanded={expandedId === question.id}
                                    onToggle={() => setExpandedId(expandedId === question.id ? null : question.id)}
                                />
                            ))}
                        </div>
                    </SortableContext>
                </DndContext>
            ) : (
                <div className="text-center py-12 bg-white/5 border border-white/[0.08] rounded-2xl backdrop-blur-lg">
                    <div className="text-4xl mb-3">📝</div>
                    <p className="text-white/60 font-medium">No questions yet</p>
                    <p className="text-white/40 text-sm mt-1">Add your first question below</p>
                </div>
            )}

            {/* Add Question Button/Form */}
            <InlineAddQuestion
                gameId={gameId}
                nextRoundIndex={questions.length + 1}
                onSuccess={handleQuestionAdded}
            />
        </div>
    );
}
