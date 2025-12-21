"use client";

import { UserGroupIcon, UserPlusIcon, PlayIcon, GiftIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

interface ReferralFunnelProps {
    funnel: {
        invitesSent: number;
        registered: number;
        played: number;
        rewardsClaimed: number;
    };
    kFactor: number;
    topReferrers: Array<{
        id: number;
        username: string;
        referralCount: number;
        revenueGenerated: number;
    }>;
}

export function ReferralFunnel({ funnel, kFactor, topReferrers }: ReferralFunnelProps) {
    const steps = [
        { label: "Invites Sent", value: funnel.invitesSent, icon: UserGroupIcon, color: "#FFC931" },
        {
            label: "Registered", value: funnel.registered, icon: UserPlusIcon, color: "#00CFF2",
            conversionRate: funnel.invitesSent > 0 ? ((funnel.registered / funnel.invitesSent) * 100).toFixed(1) : "0"
        },
        {
            label: "Played Game", value: funnel.played, icon: PlayIcon, color: "#FB72FF",
            conversionRate: funnel.registered > 0 ? ((funnel.played / funnel.registered) * 100).toFixed(1) : "0"
        },
        {
            label: "Rewards Claimed", value: funnel.rewardsClaimed, icon: GiftIcon, color: "#14B985",
            conversionRate: funnel.played > 0 ? ((funnel.rewardsClaimed / funnel.played) * 100).toFixed(1) : "0"
        },
    ];

    const maxValue = Math.max(...steps.map(s => s.value), 1);

    return (
        <div className="bg-linear-to-br from-[#00CFF2]/5 to-transparent rounded-2xl border border-white/10 p-6">
            {/* Header with K-Factor */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-semibold text-white font-display">Referral Funnel</h3>
                    <p className="text-sm text-white/50">Viral loop conversion metrics</p>
                </div>
                <div className="text-right">
                    <div className="text-xs text-white/50 font-display uppercase tracking-wider mb-1">K-Factor</div>
                    <div className={`text-3xl font-bold font-body ${kFactor >= 1 ? "text-[#14B985] " : "text-[#FFC931] "}`}>
                        {kFactor.toFixed(2)}
                    </div>
                    <div className="text-xs text-white/40">{kFactor >= 1 ? "Viral! 🚀" : "Growing 📈"}</div>
                </div>
            </div>

            {/* Funnel Steps - Compact Horizontal Layout */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {steps.map((step, index) => {
                    const Icon = step.icon;
                    const width = (step.value / maxValue) * 100;
                    return (
                        <div key={step.label} className="relative">
                            {/* Arrow connector on desktop */}
                            {index > 0 && (
                                <div className="hidden lg:block absolute -left-2 top-1/2 -translate-y-1/2 text-white/20">→</div>
                            )}
                            <div className="p-3 rounded-xl" style={{ backgroundColor: `${step.color}10`, border: `1px solid ${step.color}20` }}>
                                <div className="flex items-center gap-2 mb-2">
                                    <Icon className="h-4 w-4" style={{ color: step.color }} />
                                    <span className="text-xs text-white/60 truncate">{step.label}</span>
                                </div>
                                <div className="flex items-baseline justify-between">
                                    <span className="text-xl font-bold font-body" style={{ color: step.color }}>
                                        {step.value}
                                    </span>
                                    {step.conversionRate && (
                                        <span className="text-xs text-white/40">{step.conversionRate}%</span>
                                    )}
                                </div>
                                <div className="h-1.5 bg-white/5 rounded-full mt-2 overflow-hidden">
                                    <div className="h-full rounded-full" style={{ width: `${width}%`, backgroundColor: step.color }} />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Top Referrers - Horizontal Cards */}
            <div className="border-t border-white/6 pt-4">
                <h4 className="text-sm font-medium text-white/50 font-display uppercase tracking-wider mb-3">Top Referrers</h4>
                {topReferrers.length > 0 ? (
                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                        {topReferrers.slice(0, 5).map((referrer, index) => (
                            <Link
                                key={referrer.id}
                                href={`/admin/users/${referrer.id}`}
                                className="p-3 rounded-xl bg-white/3 hover:bg-white/6 transition-colors border border-white/5"
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    <span className={`text-sm font-bold font-body ${index === 0 ? "text-[#FFC931]" :
                                        index === 1 ? "text-[#C0C0C0]" :
                                            index === 2 ? "text-[#CD7F32]" : "text-white/40"
                                        }`}>#{index + 1}</span>
                                    <span className="text-sm text-white truncate">@{referrer.username || `user${referrer.id}`}</span>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-[#00CFF2] font-bold">{referrer.referralCount} refs</span>
                                    <span className="text-white/40">${referrer.revenueGenerated.toFixed(0)}</span>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-6 text-white/40">
                        <UserGroupIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No referrals yet</p>
                    </div>
                )}
            </div>
        </div>
    );
}
