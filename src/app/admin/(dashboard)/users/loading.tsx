export default function UsersLoading() {
    return (
        <div className="space-y-6">
            {/* Header Skeleton */}
            <div className="flex items-center justify-between">
                <div className="h-8 w-48 bg-slate-200 rounded-lg animate-pulse" />
            </div>

            {/* Search and Filters Skeleton */}
            <div className="flex gap-4">
                <div className="h-10 flex-1 bg-slate-200 rounded-lg animate-pulse" />
                <div className="h-10 w-40 bg-slate-200 rounded-lg animate-pulse" />
                <div className="h-10 w-40 bg-slate-200 rounded-lg animate-pulse" />
            </div>

            {/* User Cards Grid Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="bg-slate-800 rounded-xl shadow-sm border border-slate-700 p-6">
                        {/* Avatar and Name */}
                        <div className="flex items-center gap-4 mb-4">
                            <div className="h-12 w-12 bg-gradient-to-br from-purple-200 to-pink-200 rounded-full animate-pulse" />
                            <div className="flex-1">
                                <div className="h-5 w-32 bg-slate-200 rounded animate-pulse mb-2" />
                                <div className="h-4 w-24 bg-slate-700 rounded animate-pulse" />
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <div className="h-3 w-16 bg-slate-700 rounded animate-pulse mb-1" />
                                <div className="h-6 w-12 bg-slate-200 rounded animate-pulse" />
                            </div>
                            <div>
                                <div className="h-3 w-16 bg-slate-700 rounded animate-pulse mb-1" />
                                <div className="h-6 w-12 bg-slate-200 rounded animate-pulse" />
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                            <div className="h-8 flex-1 bg-slate-200 rounded-lg animate-pulse" />
                            <div className="h-8 flex-1 bg-slate-200 rounded-lg animate-pulse" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
