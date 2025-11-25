import { prisma } from "@/lib/db";
import { updateGameAction } from "@/actions/admin/games";
import { GameForm } from "@/components/admin/GameForm";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function EditGamePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const game = await prisma.game.findUnique({
        where: { id: parseInt(id) },
    });

    if (!game) {
        notFound();
    }

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
                    <h1 className="text-2xl font-bold text-slate-100">Edit Game</h1>
                    <p className="text-slate-400 mt-1">Update game details</p>
                </div>
            </div>

            <GameForm
                action={updateGameAction.bind(null, game.id)}
                initialData={game}
                isEdit={true}
            />
        </div>
    );
}
