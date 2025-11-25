export function StatsCard({
    title,
    value,
    subtitle,
    icon,
    trend,
}: {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: React.ReactNode;
    trend?: { value: string; isPositive: boolean };
}) {
    return (
        <div className="bg-slate-800 rounded-xl shadow-sm border border-slate-700 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm font-medium text-slate-400">{title}</p>
                    <p className="mt-2 text-3xl font-bold text-slate-100">{value}</p>
                    {subtitle && (
                        <p className="mt-1 text-sm text-slate-400">{subtitle}</p>
                    )}
                    {trend && (
                        <div className="mt-2 flex items-center gap-1">
                            <span
                                className={`text-sm font-medium ${trend.isPositive ? "text-green-600" : "text-red-600"
                                    }`}
                            >
                                {trend.isPositive ? "↑" : "↓"} {trend.value}
                            </span>
                            <span className="text-xs text-slate-400">vs last week</span>
                        </div>
                    )}
                </div>
                <div className="p-3 bg-linear-to-br from-purple-50 to-pink-50 rounded-lg">
                    {icon}
                </div>
            </div>
        </div>
    );
}
