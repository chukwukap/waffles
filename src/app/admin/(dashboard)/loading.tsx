export default function AdminLoading() {
    return (
        <div className="space-y-8 animate-pulse">
            <div>
                <div className="h-8 w-48 bg-white/10 rounded mb-2"></div>
                <div className="h-4 w-64 bg-white/5 rounded"></div>
            </div>

            {/* Stats Grid Skeleton */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="admin-panel p-6 h-32">
                        <div className="flex justify-between items-start h-full">
                            <div className="space-y-3 w-full">
                                <div className="h-4 w-24 bg-white/10 rounded"></div>
                                <div className="h-8 w-16 bg-white/15 rounded"></div>
                            </div>
                            <div className="h-10 w-10 bg-white/10 rounded-xl"></div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="admin-chart-container p-6 h-[350px]">
                    <div className="h-6 w-32 bg-white/10 rounded mb-6"></div>
                    <div className="h-[250px] bg-white/5 rounded w-full"></div>
                </div>
                <div className="admin-chart-container p-6 h-[350px]">
                    <div className="h-6 w-32 bg-white/10 rounded mb-6"></div>
                    <div className="h-[250px] bg-white/5 rounded w-full"></div>
                </div>
            </div>

            {/* Recent Activity Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="admin-panel h-64">
                    <div className="border-b border-white/6 p-4">
                        <div className="h-6 w-32 bg-white/10 rounded"></div>
                    </div>
                    <div className="p-4 space-y-4">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="flex justify-between items-center">
                                <div className="space-y-2">
                                    <div className="h-4 w-48 bg-white/10 rounded"></div>
                                    <div className="h-3 w-24 bg-white/5 rounded"></div>
                                </div>
                                <div className="h-6 w-16 bg-white/10 rounded-full"></div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="admin-panel h-64">
                    <div className="border-b border-white/6 p-4">
                        <div className="h-6 w-32 bg-white/10 rounded"></div>
                    </div>
                    <div className="p-4 space-y-4">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 bg-[#FFC931]/20 rounded-full"></div>
                                    <div className="space-y-2">
                                        <div className="h-4 w-32 bg-white/10 rounded"></div>
                                        <div className="h-3 w-16 bg-white/5 rounded"></div>
                                    </div>
                                </div>
                                <div className="h-3 w-20 bg-white/5 rounded"></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

