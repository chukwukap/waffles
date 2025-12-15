import { prisma } from "@/lib/db";
import Link from "next/link";
import { QuestionForm } from "@/components/admin/QuestionForm";
import { createQuestionAction } from "@/actions/admin/questions";
import { QuestionList } from "@/components/admin/QuestionList";
import { QuestionImport } from "@/components/admin/QuestionImport";
import { notFound } from "next/navigation";
import { PlusCircleIcon, ListBulletIcon, ArrowUpTrayIcon } from "@heroicons/react/24/outline";

export default async function GameQuestionsPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = await params;
    const gameId = parseInt(resolvedParams.id);

    const game = await prisma.game.findUnique({
        where: { id: gameId },
        include: {
            questions: {
                orderBy: { roundIndex: "asc" },
            },
        },
    });

    if (!game) {
        notFound();
    }

    const totalQuestions = game.questions.length;
    const uniqueRounds = new Set(game.questions.map(q => q.roundIndex)).size;
    const withMedia = game.questions.filter(q => q.mediaUrl || q.soundUrl).length;

    return (
        <div className="max-w-7xl space-y-6">
            {/* Header */}
            <div className="admin-panel p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Link
                            href={`/admin/games/${game.id}`}
                            className="text-white/50 hover:text-[#FFC931] font-medium transition-colors"
                        >
                            ← Back
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-white font-display">Manage Questions</h1>
                            <p className="text-white/60 mt-0.5">
                                <span className="text-[#FFC931] font-medium">{game.title}</span>
                            </p>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-6">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-[#FFC931]">{totalQuestions}</div>
                            <div className="text-xs text-white/50">Questions</div>
                        </div>
                        <div className="w-px h-10 bg-white/10"></div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-[#00CFF2]">{uniqueRounds}</div>
                            <div className="text-xs text-white/50">Rounds</div>
                        </div>
                        <div className="w-px h-10 bg-white/10"></div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-[#FB72FF]">{withMedia}</div>
                            <div className="text-xs text-white/50">With Media</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Left: Questions List */}
                <div className="xl:col-span-2 space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <ListBulletIcon className="h-5 w-5 text-[#FFC931]" />
                            <h2 className="text-lg font-semibold text-white font-display">Questions</h2>
                        </div>
                    </div>
                    <QuestionList gameId={game.id} initialQuestions={game.questions} />
                </div>

                {/* Right: Add Question + Import */}
                <div className="space-y-6">
                    {/* Add Question Form */}
                    <div className="admin-panel p-5 sticky top-6">
                        <div className="flex items-center gap-2 mb-5">
                            <PlusCircleIcon className="h-5 w-5 text-[#14B985]" />
                            <h2 className="font-semibold text-white font-display">Add Question</h2>
                        </div>
                        <QuestionForm
                            gameId={game.id}
                            action={createQuestionAction.bind(null, game.id)}
                            nextRoundIndex={game.questions.length + 1}
                        />
                    </div>

                    {/* Bulk Import */}
                    <div className="admin-panel p-5">
                        <div className="flex items-center gap-2 mb-4">
                            <ArrowUpTrayIcon className="h-5 w-5 text-[#FB72FF]" />
                            <h2 className="font-semibold text-white font-display">Bulk Import</h2>
                        </div>
                        <QuestionImport gameId={game.id} />
                    </div>
                </div>
            </div>
        </div>
    );
}


