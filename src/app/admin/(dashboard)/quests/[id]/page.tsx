import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { QuestForm } from "@/components/admin/QuestForm";
import Link from "next/link";

async function getQuest(id: number) {
    const quest = await prisma.quest.findUnique({
        where: { id },
    });
    return quest;
}

export default async function EditQuestPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const questId = parseInt(id != null ? String(id) : "");

    if (isNaN(questId)) {
        notFound();
    }

    const quest = await getQuest(questId);

    if (!quest) {
        notFound();
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link
                    href="/admin/quests"
                    className="text-[#99A0AE] hover:text-white transition-colors"
                >
                    ← Back
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-white">Edit Quest</h1>
                    <p className="text-[#99A0AE]">{quest.title}</p>
                </div>
            </div>

            <QuestForm quest={quest} />
        </div>
    );
}
