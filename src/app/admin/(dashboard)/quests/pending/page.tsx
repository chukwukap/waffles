import { prisma } from "@/lib/db";
import { approveQuestCompletionAction, rejectQuestCompletionAction } from "@/actions/admin/quests";
import { revalidatePath } from "next/cache";
import Link from "next/link";

async function getPendingApprovals() {
    const pending = await prisma.completedQuest.findMany({
        where: { isApproved: false },
        include: {
            quest: true,
            user: {
                select: {
                    id: true,
                    fid: true,
                    username: true,
                    pfpUrl: true,
                },
            },
        },
        orderBy: { completedAt: "asc" },
    });

    return pending;
}

export default async function PendingApprovalsPage() {
    const pending = await getPendingApprovals();

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
                    <h1 className="text-2xl font-bold text-white">Pending Approvals</h1>
                    <p className="text-[#99A0AE]">Review and approve custom quest completions</p>
                </div>
            </div>

            {/* Pending List */}
            <div className="bg-[#1A1D21] rounded-lg border border-white/5 overflow-hidden">
                {pending.length > 0 ? (
                    <div className="divide-y divide-white/5">
                        {pending.map((item) => (
                            <div key={item.id} className="p-4 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    {/* User Avatar */}
                                    <div className="w-10 h-10 rounded-full bg-[#0D0F11] overflow-hidden">
                                        {item.user.pfpUrl ? (
                                            <img
                                                src={item.user.pfpUrl}
                                                alt={item.user.username || "User"}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-[#99A0AE]">
                                                ?
                                            </div>
                                        )}
                                    </div>

                                    {/* User Info */}
                                    <div>
                                        <p className="text-white font-medium">
                                            {item.user.username || `FID: ${item.user.fid}`}
                                        </p>
                                        <p className="text-sm text-[#99A0AE]">
                                            Completed: {item.quest.title}
                                        </p>
                                    </div>
                                </div>

                                {/* Quest Info */}
                                <div className="text-right mr-6">
                                    <p className="text-[#FFC931] font-medium">{item.quest.points} pts</p>
                                    <p className="text-xs text-[#99A0AE]">
                                        {new Date(item.completedAt).toLocaleDateString()}
                                    </p>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2">
                                    <form
                                        action={async () => {
                                            "use server";
                                            await approveQuestCompletionAction(item.id);
                                            revalidatePath("/admin/quests/pending");
                                        }}
                                    >
                                        <button
                                            type="submit"
                                            className="px-4 py-2 bg-[#14B985] text-white text-sm rounded-lg hover:bg-[#14B985]/80 transition-colors"
                                        >
                                            Approve
                                        </button>
                                    </form>
                                    <form
                                        action={async () => {
                                            "use server";
                                            await rejectQuestCompletionAction(item.id);
                                            revalidatePath("/admin/quests/pending");
                                        }}
                                    >
                                        <button
                                            type="submit"
                                            className="px-4 py-2 bg-red-500/20 text-red-400 text-sm rounded-lg hover:bg-red-500/30 transition-colors"
                                        >
                                            Reject
                                        </button>
                                    </form>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-12 text-center">
                        <div className="text-4xl mb-4">✅</div>
                        <p className="text-[#99A0AE]">No pending approvals</p>
                        <p className="text-sm text-[#99A0AE]/70 mt-1">
                            Custom quest completions will appear here for review
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
