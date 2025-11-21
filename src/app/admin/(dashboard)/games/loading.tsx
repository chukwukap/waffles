export default function GamesLoading() {
    return (
        <div className="space-y-6">
            {/* Header Skeleton */}
            <div className="flex items-center justify-between">
                <div className="h-8 w-48 bg-slate-200 rounded-lg animate-pulse" />
                <div className="h-10 w-32 bg-purple-200 rounded-lg animate-pulse" />
            </div>

            {/* Filters Skeleton */}
            <div className="flex gap-4">
                <div className="h-10 flex-1 bg-slate-200 rounded-lg animate-pulse" />
                <div className="h-10 w-40 bg-slate-200 rounded-lg animate-pulse" />
            </div>

            {/* Table Skeleton */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {/* Table Header */}
                <div className="bg-slate-50 border-b border-slate-200 px-6 py-3">
                    <div className="flex gap-4">
                        <div className="h-4 w-32 bg-slate-300 rounded animate-pulse" />
                        <div className="h-4 w-24 bg-slate-300 rounded animate-pulse" />
                        <div className="h-4 w-40 bg-slate-300 rounded animate-pulse" />
                        <div className="h-4 w-28 bg-slate-300 rounded animate-pulse" />
                        <div className="h-4 w-24 bg-slate-300 rounded animate-pulse" />
                    </div>
                </div>

                {/* Table Rows */}
                {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="border-b border-slate-100 px-6 py-4">
                        <div className="flex gap-4 items-center">
                            <div className="flex-1">
                                <div className="h-5 w-48 bg-slate-200 rounded animate-pulse mb-2" />
                                <div className="h-4 w-24 bg-slate-100 rounded animate-pulse" />
                            </div>
                            <div className="h-6 w-20 bg-slate-200 rounded-full animate-pulse" />
                            <div className="h-4 w-36 bg-slate-200 rounded animate-pulse" />
                            <div className="h-4 w-28 bg-slate-200 rounded animate-pulse" />
                            <div className="h-4 w-24 bg-slate-200 rounded animate-pulse" />
                            <div className="flex gap-2">
                                <div className="h-8 w-8 bg-slate-200 rounded-lg animate-pulse" />
                                <div className="h-8 w-8 bg-slate-200 rounded-lg animate-pulse" />
                                <div className="h-8 w-8 bg-slate-200 rounded-lg animate-pulse" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
