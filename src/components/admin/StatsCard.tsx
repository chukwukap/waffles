import { cn } from "@/lib/utils";

type GlowVariant = "gold" | "cyan" | "pink" | "success";

const glowClasses: Record<GlowVariant, string> = {
    gold: " text-[#FFC931]",
    cyan: " text-[#00CFF2]",
    pink: " text-[#FB72FF]",
    success: " text-[#14B985]",
};

const iconBgClasses: Record<GlowVariant, string> = {
    gold: "bg-[#FFC931]/15",
    cyan: "bg-[#00CFF2]/15",
    pink: "bg-[#FB72FF]/15",
    success: "bg-[#14B985]/15",
};

export function StatsCard({
    title,
    value,
    subtitle,
    icon,
    trend,
    glowVariant = "gold",
}: {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: React.ReactNode;
    trend?: { value: string; isPositive: boolean };
    glowVariant?: GlowVariant;
}) {
    return (
        <div className="bg-white/5 border border-white/[0.08] rounded-2xl backdrop-blur-lg hover:bg-white/[0.08] hover:border-white/[0.12] p-6">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm font-medium text-white/60 font-display">{title}</p>
                    <p className={cn(
                        "mt-2 text-3xl font-bold font-body",
                        glowClasses[glowVariant]
                    )}>
                        {value}
                    </p>
                    {subtitle && (
                        <p className="mt-1 text-sm text-white/50">{subtitle}</p>
                    )}
                    {trend && (
                        <div className="mt-2 flex items-center gap-1">
                            <span
                                className={cn(
                                    "text-sm font-medium font-display",
                                    trend.isPositive
                                        ? "text-[#14B985] "
                                        : "text-red-400"
                                )}
                            >
                                {trend.isPositive ? "↑" : "↓"} {trend.value}
                            </span>
                            <span className="text-xs text-white/40">vs last week</span>
                        </div>
                    )}
                </div>
                <div className={cn(
                    "p-3 rounded-xl",
                    iconBgClasses[glowVariant]
                )}>
                    {icon}
                </div>
            </div>
        </div>
    );
}

