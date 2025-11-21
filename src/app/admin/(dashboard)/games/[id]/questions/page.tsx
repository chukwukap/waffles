import { prisma } from "@/lib/db";
import Link from "next/link";
import { QuestionForm } from "@/components/admin/QuestionForm";
import { createQuestionAction } from "@/actions/admin/questions";
import { QuestionList } from "@/components/admin/QuestionList";
import { notFound } from "next/navigation";

export default async function GameQuestionsPage({ params }: { params: { id: string } }) {
    const gameId = parseInt(params.id);

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
        <div className="max-w-5xl space-y-8">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link
                        href="/admin/games"
                        className="text-slate-600 hover:text-slate-900 font-medium"
                    >
                        ← Back
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Manage Questions</h1>
                        <p className="text-slate-600 mt-1">
                            {game.title} • {game.questions.length} Questions
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Question List (Left Column) */}
                <div className="lg:col-span-2 space-y-4">
                    <h2 className="text-lg font-semibold text-slate-900">Questions</h2>
                    <QuestionList gameId={game.id} initialQuestions={game.questions} />
                </div>

                {/* Add Question Form (Right Column) */}
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-slate-900">Add New Question</h2>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 sticky top-6">
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
