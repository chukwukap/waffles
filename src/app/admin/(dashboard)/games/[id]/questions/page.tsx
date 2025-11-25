import { prisma } from "@/lib/db";
import Link from "next/link";
import { QuestionForm } from "@/components/admin/QuestionForm";
import { createQuestionAction } from "@/actions/admin/questions";
import { QuestionList } from "@/components/admin/QuestionList";
import { QuestionImport } from "@/components/admin/QuestionImport";
import { notFound } from "next/navigation";

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

    return (
        <div className="max-w-7xl space-y-8">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link
                        href="/admin/games"
                        className="text-slate-400 hover:text-slate-100 font-medium"
                    >
                        ← Back
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-100">Manage Questions</h1>
                        <p className="text-slate-400 mt-1">
                            {game.title} • {game.questions.length} Questions
                        </p>
                    </div>
                </div>
            </div>

            {/* Bulk Import Section */}
            <QuestionImport gameId={game.id} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Question List (Left Column) */}
                <div className="lg:col-span-2 space-y-4">
                    <h2 className="text-lg font-semibold text-slate-100">Questions</h2>
                    <QuestionList gameId={game.id} initialQuestions={game.questions} />
                </div>

                {/* Add Question Form (Right Column) */}
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-slate-100">Add New Question</h2>
                    <div className="bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-700 sticky top-6">
                        <QuestionForm
                            gameId={game.id}
                            action={createQuestionAction.bind(null, game.id)}
                            nextRoundIndex={game.questions.length + 1}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
