import { prisma } from "@/lib/db";
import Link from "next/link";
import { QuestionBankList } from "@/components/admin/QuestionBankList";
import { QuestionBankFilters } from "@/components/admin/QuestionBankFilters";
import { PlusIcon, DocumentTextIcon, ArrowUpTrayIcon } from "@heroicons/react/24/outline";
import { GameTheme, Difficulty } from "@prisma";

interface SearchParams {
    theme?: string;
    difficulty?: string;
    search?: string;
    page?: string;
}

export default async function QuestionBankPage({
    searchParams,
}: {
    searchParams: Promise<SearchParams>;
}) {
    const params = await searchParams;

    // Build filters from search params
    const where: Record<string, unknown> = {};

    if (params.theme && params.theme in GameTheme) {
        where.theme = params.theme as GameTheme;
    }

    if (params.difficulty && params.difficulty in Difficulty) {
        where.difficulty = params.difficulty as Difficulty;
    }

    if (params.search) {
        where.content = {
            contains: params.search,
            mode: "insensitive",
        };
    }

    // Fetch templates with pagination
    const page = parseInt(params.page || "1", 10);
    const limit = 20;
    const skip = (page - 1) * limit;

    const [templates, totalCount] = await Promise.all([
        prisma.questionTemplate.findMany({
            where,
            orderBy: { createdAt: "desc" },
            take: limit,
            skip,
        }),
        prisma.questionTemplate.count({ where }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    // Get theme/difficulty stats for filter badges
    const stats = await prisma.questionTemplate.groupBy({
        by: ["theme"],
        _count: { id: true },
    });

    const themeCounts = Object.fromEntries(
        stats.map((s) => [s.theme, s._count.id])
    );

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white font-display">Question Bank</h1>
                    <p className="text-white/50 text-sm mt-1">
                        <span className="text-[#FFC931] font-medium">{totalCount}</span> reusable questions
                    </p>
                </div>
                <div className="flex gap-3">
                    <Link
                        href="/admin/questions/import"
                        className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white/60 hover:text-white transition-colors text-sm font-medium"
                    >
                        <ArrowUpTrayIcon className="h-4 w-4" />
                        Import CSV
                    </Link>
                    <Link
                        href="/admin/questions/create"
                        className="flex items-center gap-2 px-4 py-2.5 bg-[#FFC931] hover:bg-[#FFD966] text-black font-bold rounded-xl transition-colors text-sm"
                    >
                        <PlusIcon className="h-4 w-4" />
                        New Question
                    </Link>
                </div>
            </div>

            {/* Filters */}
            <QuestionBankFilters
                currentTheme={params.theme}
                currentDifficulty={params.difficulty}
                currentSearch={params.search}
                themeCounts={themeCounts}
            />

            {/* Content */}
            <div className="bg-white/5 border border-white/8 rounded-2xl backdrop-blur-lg overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10">
                    <DocumentTextIcon className="h-5 w-5 text-[#FFC931]" />
                    <h2 className="font-semibold text-white">All Questions</h2>
                    {params.search && (
                        <span className="text-xs text-white/40 ml-2">
                            Results for &quot;{params.search}&quot;
                        </span>
                    )}
                </div>

                {templates.length > 0 ? (
                    <QuestionBankList templates={templates} />
                ) : (
                    <div className="text-center py-16">
                        <div className="text-5xl mb-4">📝</div>
                        <p className="text-white/60 font-medium">No questions yet</p>
                        <p className="text-white/40 text-sm mt-1">
                            Create your first reusable question template
                        </p>
                        <Link
                            href="/admin/questions/create"
                            className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-[#FFC931] text-black font-bold rounded-lg text-sm hover:bg-[#FFD966] transition-colors"
                        >
                            <PlusIcon className="h-4 w-4" />
                            Create Question
                        </Link>
                    </div>
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                    {page > 1 && (
                        <Link
                            href={{
                                pathname: "/admin/questions",
                                query: { ...params, page: page - 1 },
                            }}
                            className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white/60 hover:text-white text-sm transition-colors"
                        >
                            Previous
                        </Link>
                    )}
                    <span className="text-white/40 text-sm">
                        Page {page} of {totalPages}
                    </span>
                    {page < totalPages && (
                        <Link
                            href={{
                                pathname: "/admin/questions",
                                query: { ...params, page: page + 1 },
                            }}
                            className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white/60 hover:text-white text-sm transition-colors"
                        >
                            Next
                        </Link>
                    )}
                </div>
            )}
        </div>
    );
}
