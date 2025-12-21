import { prisma } from "@/lib/db";
import Link from "next/link";
import { toggleQuestActiveAction, deleteQuestAction } from "@/actions/admin/quests";
import { revalidatePath } from "next/cache";

async function getQuests() {
    const quests = await prisma.quest.findMany({
        orderBy: { sortOrder: "asc" },
        include: {
            _count: {
                select: { completions: true },
            },
        },
    });

    const pendingApprovals = await prisma.completedQuest.count({
        where: { isApproved: false },
    });

    return { quests, pendingApprovals };
}

function QuestTypeBadge({ type }: { type: string }) {
    const colors: Record<string, string> = {
        LINK: "bg-blue-500/20 text-blue-400",
        FARCASTER_FOLLOW: "bg-purple-500/20 text-purple-400",
        FARCASTER_CAST: "bg-purple-500/20 text-purple-400",
        FARCASTER_RECAST: "bg-purple-500/20 text-purple-400",
        REFERRAL: "bg-green-500/20 text-green-400",
        CUSTOM: "bg-orange-500/20 text-orange-400",
    };

    return (
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[type] || "bg-gray-500/20 text-gray-400"}`}>
            {type}
        </span>
    );
}

function QuestCategoryBadge({ category }: { category: string }) {
    const colors: Record<string, string> = {
        SOCIAL: "bg-cyan-500/20 text-cyan-400",
        ONBOARDING: "bg-yellow-500/20 text-yellow-400",
        REFERRAL: "bg-green-500/20 text-green-400",
        ENGAGEMENT: "bg-pink-500/20 text-pink-400",
        SPECIAL: "bg-red-500/20 text-red-400",
    };

    return (
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[category] || "bg-gray-500/20 text-gray-400"}`}>
            {category}
        </span>
    );
}

export default async function AdminQuestsPage() {
    const { quests, pendingApprovals } = await getQuests();

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Quests</h1>
                    <p className="text-[#99A0AE]">Manage waitlist quests and rewards</p>
                </div>
                <div className="flex gap-3">
                    {pendingApprovals > 0 && (
                        <Link
                            href="/admin/quests/pending"
                            className="px-4 py-2 bg-orange-500/20 text-orange-400 rounded-lg hover:bg-orange-500/30 transition-colors flex items-center gap-2"
                        >
                            <span className="w-2 h-2 bg-orange-400 rounded-full animate-pulse" />
                            {pendingApprovals} Pending
                        </Link>
                    )}
                    <Link
                        href="/admin/quests/new"
                        className="px-4 py-2 bg-[#14B985] text-white rounded-lg hover:bg-[#14B985]/80 transition-colors"
                    >
                        + New Quest
                    </Link>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4">
                <div className="bg-linear-to-br from-white/6 to-white/2 rounded-2xl p-5 border border-white/8">
                    <p className="text-white/50 text-sm">Total Quests</p>
                    <p className="text-2xl font-bold text-white font-display">{quests.length}</p>
                </div>
                <div className="bg-linear-to-br from-white/6 to-white/2 rounded-2xl p-5 border border-white/8">
                    <p className="text-white/50 text-sm">Active</p>
                    <p className="text-2xl font-bold text-[#14B985] font-display">
                        {quests.filter(q => q.isActive).length}
                    </p>
                </div>
                <div className="bg-linear-to-br from-white/6 to-white/2 rounded-2xl p-5 border border-white/8">
                    <p className="text-white/50 text-sm">Total Completions</p>
                    <p className="text-2xl font-bold text-white font-display">
                        {quests.reduce((sum, q) => sum + q._count.completions, 0)}
                    </p>
                </div>
                <div className="bg-linear-to-br from-white/6 to-white/2 rounded-2xl p-5 border border-white/8">
                    <p className="text-white/50 text-sm">Total Points Available</p>
                    <p className="text-2xl font-bold text-[#FFC931] font-display">
                        {quests.filter(q => q.isActive).reduce((sum, q) => sum + q.points, 0)}
                    </p>
                </div>
            </div>

            {/* Quests Table */}
            <div className="bg-linear-to-br from-white/6 to-white/2 rounded-2xl border border-white/8 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-white/3 border-b border-white/6">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-medium text-white/50 uppercase tracking-wider font-display">Quest</th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-white/50 uppercase tracking-wider font-display">Type</th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-white/50 uppercase tracking-wider font-display">Category</th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-white/50 uppercase tracking-wider font-display">Points</th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-white/50 uppercase tracking-wider font-display">Completions</th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-white/50 uppercase tracking-wider font-display">Status</th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-white/50 uppercase tracking-wider font-display">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/6">
                        {quests.map((quest) => (
                            <tr key={quest.id} className="hover:bg-white/3 transition-colors">
                                <td className="px-6 py-4">
                                    <div>
                                        <p className="text-white font-medium">{quest.title}</p>
                                        <p className="text-white/50 text-sm truncate max-w-xs">{quest.description}</p>
                                    </div>
                                </td>
                                <td className="px-4 py-4">
                                    <QuestTypeBadge type={quest.type} />
                                </td>
                                <td className="px-4 py-4">
                                    <QuestCategoryBadge category={quest.category} />
                                </td>
                                <td className="px-4 py-4">
                                    <span className="text-[#FFC931] font-medium">{quest.points}</span>
                                </td>
                                <td className="px-4 py-4">
                                    <span className="text-white">{quest._count.completions}</span>
                                </td>
                                <td className="px-4 py-4">
                                    <form action={async () => {
                                        "use server";
                                        await toggleQuestActiveAction(quest.id, !quest.isActive);
                                        revalidatePath("/admin/quests");
                                    }}>
                                        <button
                                            type="submit"
                                            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${quest.isActive
                                                ? "bg-[#14B985]/20 text-[#14B985] hover:bg-[#14B985]/30"
                                                : "bg-[#99A0AE]/20 text-[#99A0AE] hover:bg-[#99A0AE]/30"
                                                }`}
                                        >
                                            {quest.isActive ? "Active" : "Inactive"}
                                        </button>
                                    </form>
                                </td>
                                <td className="px-4 py-4">
                                    <div className="flex gap-2">
                                        <Link
                                            href={`/admin/quests/${quest.id}`}
                                            className="text-[#99A0AE] hover:text-white text-sm"
                                        >
                                            Edit
                                        </Link>
                                        <form action={async () => {
                                            "use server";
                                            await deleteQuestAction(quest.id);
                                            revalidatePath("/admin/quests");
                                        }}>
                                            <button
                                                type="submit"
                                                className="text-red-400 hover:text-red-300 text-sm"
                                            >
                                                Delete
                                            </button>
                                        </form>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {quests.length === 0 && (
                    <div className="px-4 py-12 text-center">
                        <p className="text-[#99A0AE]">No quests found</p>
                        <Link href="/admin/quests/new" className="text-[#14B985] hover:underline mt-2 inline-block">
                            Create your first quest
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
