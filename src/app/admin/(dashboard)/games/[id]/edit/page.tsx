import { prisma } from "@/lib/db";
import { updateGameAction } from "@/actions/admin/games";
import { GameForm } from "@/components/admin/GameForm";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function EditGamePage({ params }: { params: { id: string } }) {
    const game = await prisma.game.findUnique({
        where: { id: parseInt(params.id) },
    });

    if (!game) {
        notFound();
    }

    return (
        <div className="max-w-4xl space-y-6">
            <div className="flex items-center gap-4">
                <Link
                    href="/admin/games"
                    className="text-slate-600 hover:text-slate-900 font-medium"
                >
                    ← Back
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Edit Game</h1>
                    <p className="text-slate-600 mt-1">Update game details</p>
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
