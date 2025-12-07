export default function GamesLoading() {
    return (
        <div className="space-y-6">
            {/* Header Skeleton */}
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <div className="h-8 w-48 bg-white/10 rounded-xl animate-pulse" />
                    <div className="h-4 w-64 bg-white/5 rounded-lg animate-pulse" />
                </div>
                <div className="h-11 w-36 bg-[#FFC931]/30 rounded-xl animate-pulse" />
            </div>

            {/* Filters Skeleton */}
            <div className="admin-panel p-4">
                <div className="flex gap-4">
                    <div className="h-11 flex-1 bg-white/5 rounded-xl animate-pulse" />
                    <div className="h-11 w-40 bg-white/5 rounded-xl animate-pulse" />
                </div>
            </div>

            {/* Table Skeleton */}
            <div className="admin-panel overflow-hidden">
                {/* Table Header */}
                <div className="bg-white/3 border-b border-white/6 px-6 py-4">
                    <div className="flex gap-6">
                        <div className="h-3 w-20 bg-white/10 rounded animate-pulse" />
                        <div className="h-3 w-16 bg-white/10 rounded animate-pulse" />
                        <div className="h-3 w-24 bg-white/10 rounded animate-pulse" />
                        <div className="h-3 w-20 bg-white/10 rounded animate-pulse" />
                        <div className="h-3 w-20 bg-white/10 rounded animate-pulse" />
                        <div className="h-3 w-16 bg-white/10 rounded animate-pulse" />
                    </div>
                </div>

                {/* Table Rows */}
                {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="border-b border-white/6 px-6 py-4">
                        <div className="flex gap-6 items-center">
                            <div className="flex-1">
                                <div className="h-5 w-48 bg-white/10 rounded animate-pulse mb-2" />
                                <div className="h-3 w-24 bg-white/5 rounded animate-pulse" />
                            </div>
                            <div className="h-6 w-20 bg-white/10 rounded-full animate-pulse" />
                            <div className="h-4 w-32 bg-white/5 rounded animate-pulse" />
                            <div className="h-4 w-16 bg-[#00CFF2]/20 rounded animate-pulse" />
                            <div className="h-4 w-16 bg-[#FB72FF]/20 rounded animate-pulse" />
                            <div className="flex gap-2">
                                <div className="h-8 w-8 bg-white/10 rounded-lg animate-pulse" />
                                <div className="h-8 w-8 bg-white/10 rounded-lg animate-pulse" />
                                <div className="h-8 w-8 bg-white/10 rounded-lg animate-pulse" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
