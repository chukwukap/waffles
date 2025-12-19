export default function UsersLoading() {
    return (
        <div className="space-y-6">
            {/* Header Skeleton */}
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <div className="h-8 w-48 bg-white/10 rounded-xl animate-pulse" />
                    <div className="h-4 w-64 bg-white/5 rounded-lg animate-pulse" />
                </div>
            </div>

            {/* Search and Filters Skeleton */}
            <div className="bg-white/5 border border-white/[0.08] rounded-2xl backdrop-blur-lg p-4">
                <div className="flex gap-4">
                    <div className="h-11 flex-1 bg-white/5 rounded-xl animate-pulse" />
                    <div className="h-11 w-32 bg-white/5 rounded-xl animate-pulse" />
                    <div className="h-11 w-36 bg-white/5 rounded-xl animate-pulse" />
                </div>
            </div>

            {/* User Cards Grid Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="bg-white/5 border border-white/[0.08] rounded-2xl backdrop-blur-lg p-6">
                        {/* Avatar and Name */}
                        <div className="flex items-center gap-4 mb-4">
                            <div className="h-12 w-12 bg-[#FFC931]/20 rounded-full animate-pulse" />
                            <div className="flex-1">
                                <div className="h-5 w-32 bg-white/10 rounded animate-pulse mb-2" />
                                <div className="h-4 w-24 bg-white/5 rounded animate-pulse" />
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <div className="h-3 w-16 bg-white/5 rounded animate-pulse mb-1" />
                                <div className="h-6 w-12 bg-[#00CFF2]/20 rounded animate-pulse" />
                            </div>
                            <div>
                                <div className="h-3 w-16 bg-white/5 rounded animate-pulse mb-1" />
                                <div className="h-6 w-12 bg-[#FB72FF]/20 rounded animate-pulse" />
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                            <div className="h-9 flex-1 bg-white/5 rounded-xl animate-pulse" />
                            <div className="h-9 flex-1 bg-white/5 rounded-xl animate-pulse" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
