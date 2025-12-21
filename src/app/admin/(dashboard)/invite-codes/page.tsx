import { prisma } from "@/lib/db";
import Link from "next/link";
import { GenerateCodeButton, BulkGenerateButton, CodeRow } from "./_components/InviteCodeComponents";

// ============================================
// DATA FETCHING
// ============================================

async function getInviteCodes(searchParams: { page?: string; status?: string }) {
    const page = parseInt(searchParams.page || "1");
    const pageSize = 50;
    const skip = (page - 1) * pageSize;

    const where: any = {};

    if (searchParams.status === "used") {
        where.usedById = { not: null };
    } else if (searchParams.status === "available") {
        where.usedById = null;
    }

    const [codes, total] = await Promise.all([
        prisma.inviteCode.findMany({
            where,
            skip,
            take: pageSize,
            orderBy: { createdAt: "desc" },
            include: {
                usedBy: {
                    select: {
                        username: true,
                        fid: true,
                    },
                },
            },
        }),
        prisma.inviteCode.count({ where }),
    ]);

    return { codes, total, page, pageSize };
}

// ============================================
// PAGE
// ============================================

export default async function InviteCodesPage({
    searchParams,
}: {
    searchParams: Promise<{ page?: string; status?: string }>;
}) {
    const resolvedParams = await searchParams;
    const { codes, total, page, pageSize } = await getInviteCodes(resolvedParams);
    const totalPages = Math.ceil(total / pageSize);

    const availableCount = await prisma.inviteCode.count({ where: { usedById: null } });
    const usedCount = total - availableCount;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white font-display">Invite Codes</h1>
                    <p className="text-white/60 mt-1">
                        <span className="text-[#14B985] font-bold">{availableCount}</span>{" "}
                        available
                        <span className="text-white/30 mx-2">•</span>
                        <span className="text-white/40">{usedCount} used</span>
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <BulkGenerateButton />
                    <GenerateCodeButton />
                </div>
            </div>

            {/* Filters */}
            <div className="flex gap-2">
                {[
                    { label: "All", value: undefined, count: total },
                    { label: "Available", value: "available", count: availableCount },
                    { label: "Used", value: "used", count: usedCount },
                ].map((filter) => (
                    <Link
                        key={filter.label}
                        href={filter.value ? `/admin/invite-codes?status=${filter.value}` : "/admin/invite-codes"}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${(resolvedParams.status || undefined) === filter.value
                            ? "bg-[#FFC931] text-black shadow-lg shadow-[#FFC931]/20"
                            : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
                            }`}
                    >
                        {filter.label}
                        <span className="ml-1.5 text-xs opacity-60">({filter.count})</span>
                    </Link>
                ))}
            </div>

            {/* Table */}
            <div className="rounded-2xl border border-white/10 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead>
                            <tr className="border-b border-white/10">
                                <th className="px-6 py-4 text-left text-xs font-medium text-white/50 uppercase tracking-wider font-display">
                                    Code
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-white/50 uppercase tracking-wider font-display">
                                    Status
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-white/50 uppercase tracking-wider font-display">
                                    Used By
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-white/50 uppercase tracking-wider font-display">
                                    Created
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-white/50 uppercase tracking-wider font-display">
                                    Note
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-white/50 uppercase tracking-wider font-display">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {codes.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-16 text-center">
                                        <div className="flex flex-col items-center justify-center">
                                            <div className="w-16 h-16 bg-linear-to-br from-[#FFC931]/20 to-[#FFC931]/5 rounded-2xl flex items-center justify-center mb-4">
                                                <span className="text-3xl">🎟️</span>
                                            </div>
                                            <p className="text-lg font-medium text-white mb-1 font-display">
                                                No invite codes yet
                                            </p>
                                            <p className="text-sm text-white/50">
                                                Generate codes to share with users
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                codes.map((code, index) => (
                                    <CodeRow key={code.id} code={code} index={index} />
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-white/50">
                        Page <span className="text-white font-medium">{page}</span> of{" "}
                        <span className="text-white font-medium">{totalPages}</span>
                    </p>
                    <div className="flex gap-2">
                        {page > 1 && (
                            <Link
                                href={`?page=${page - 1}${resolvedParams.status ? `&status=${resolvedParams.status}` : ""}`}
                                className="px-4 py-2 border border-white/10 rounded-xl hover:bg-white/5 text-sm font-medium text-white transition-colors"
                            >
                                Previous
                            </Link>
                        )}
                        {page < totalPages && (
                            <Link
                                href={`?page=${page + 1}${resolvedParams.status ? `&status=${resolvedParams.status}` : ""}`}
                                className="px-4 py-2 bg-[#FFC931] text-black rounded-xl hover:bg-[#FFD966] text-sm font-bold transition-colors"
                            >
                                Next
                            </Link>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
