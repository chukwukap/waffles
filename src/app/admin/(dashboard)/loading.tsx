export default function AdminLoading() {
    return (
        <div className="space-y-8 animate-pulse">
            <div>
                <div className="h-8 w-48 bg-slate-200 rounded mb-2"></div>
                <div className="h-4 w-64 bg-slate-200 rounded"></div>
            </div>

            {/* Stats Grid Skeleton */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-white rounded-xl border border-slate-200 p-6 h-32">
                        <div className="flex justify-between items-start h-full">
                            <div className="space-y-3 w-full">
                                <div className="h-4 w-24 bg-slate-200 rounded"></div>
                                <div className="h-8 w-16 bg-slate-200 rounded"></div>
                            </div>
                            <div className="h-10 w-10 bg-slate-200 rounded-lg"></div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl border border-slate-200 h-[350px]">
                    <div className="h-6 w-32 bg-slate-200 rounded mb-6"></div>
                    <div className="h-[250px] bg-slate-100 rounded w-full"></div>
                </div>
                <div className="bg-white p-6 rounded-xl border border-slate-200 h-[350px]">
                    <div className="h-6 w-32 bg-slate-200 rounded mb-6"></div>
                    <div className="h-[250px] bg-slate-100 rounded w-full"></div>
                </div>
            </div>

            {/* Recent Activity Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl border border-slate-200 h-64">
                    <div className="border-b border-slate-200 p-4">
                        <div className="h-6 w-32 bg-slate-200 rounded"></div>
                    </div>
                    <div className="p-4 space-y-4">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="flex justify-between items-center">
                                <div className="space-y-2">
                                    <div className="h-4 w-48 bg-slate-200 rounded"></div>
                                    <div className="h-3 w-24 bg-slate-200 rounded"></div>
                                </div>
                                <div className="h-6 w-16 bg-slate-200 rounded-full"></div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 h-64">
                    <div className="border-b border-slate-200 p-4">
                        <div className="h-6 w-32 bg-slate-200 rounded"></div>
                    </div>
                    <div className="p-4 space-y-4">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 bg-slate-200 rounded-full"></div>
                                    <div className="space-y-2">
                                        <div className="h-4 w-32 bg-slate-200 rounded"></div>
                                        <div className="h-3 w-16 bg-slate-200 rounded"></div>
                                    </div>
                                </div>
                                <div className="h-3 w-20 bg-slate-200 rounded"></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
