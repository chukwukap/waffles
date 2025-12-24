import { Metadata } from "next";
import { NotificationForm } from "@/components/admin/NotificationForm";
import { getRecentNotifications } from "@/actions/admin/notifications";
import { BellIcon, ClockIcon, CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";
import { StatsCard } from "@/components/admin/StatsCard";
import { getNotificationEnabledUserCount } from "@/lib/notifications";

export const metadata: Metadata = {
    title: "Notifications | Waffles Admin",
    description: "Send notifications to users",
};

export default async function NotificationsPage() {
    const [recentNotifications, totalUsersWithNotifs] = await Promise.all([
        getRecentNotifications(5),
        getNotificationEnabledUserCount("all"),
    ]);

    // Calculate stats from recent notifications
    const totalSent = recentNotifications.reduce((acc, n) => {
        const details = n.details as any;
        return acc + (details?.results?.success || 0);
    }, 0);

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-white font-display flex items-center gap-3">
                    <BellIcon className="h-7 w-7 text-[#FFC931]" />
                    Notifications
                </h1>
                <p className="text-white/60 mt-1">
                    Send push notifications to your users via Farcaster
                </p>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatsCard
                    title="Users with Notifications"
                    value={totalUsersWithNotifs.toLocaleString()}
                    subtitle="Can receive push notifications"
                    icon={<BellIcon className="h-6 w-6 text-[#FFC931]" />}
                    glowVariant="gold"
                />
                <StatsCard
                    title="Sent This Week"
                    value={totalSent.toLocaleString()}
                    subtitle="Notifications delivered"
                    icon={<CheckCircleIcon className="h-6 w-6 text-[#14B985]" />}
                    glowVariant="success"
                />
                <StatsCard
                    title="Recent Campaigns"
                    value={recentNotifications.length.toString()}
                    subtitle="Last 5 notification sends"
                    icon={<ClockIcon className="h-6 w-6 text-[#00CFF2]" />}
                    glowVariant="cyan"
                />
            </div>

            {/* Compose Form */}
            <NotificationForm />

            {/* Recent Notifications History */}
            {recentNotifications.length > 0 && (
                <section className="bg-linear-to-br from-white/5 to-transparent rounded-2xl border border-white/10 p-6">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="p-2.5 rounded-xl bg-white/10">
                            <ClockIcon className="h-5 w-5 text-white/60" />
                        </div>
                        <div>
                            <h3 className="font-bold text-white font-display">Recent Activity</h3>
                            <p className="text-sm text-white/50">Your latest notification sends</p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {recentNotifications.map((notification) => {
                            const details = notification.details as any;
                            const results = details?.results || {};
                            const success = results.success || 0;
                            const failed = results.failed || 0;
                            const total = results.total || 0;

                            return (
                                <div
                                    key={notification.id}
                                    className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/8 transition-colors"
                                >
                                    <div className="w-10 h-10 rounded-xl bg-[#FFC931]/15 flex items-center justify-center shrink-0">
                                        <BellIcon className="h-5 w-5 text-[#FFC931]" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-white truncate">
                                            {details?.title || "Notification"}
                                        </p>
                                        <p className="text-xs text-white/50 flex items-center gap-2">
                                            <span>{notification.admin?.username || "Admin"}</span>
                                            <span>•</span>
                                            <span>
                                                {new Date(notification.createdAt).toLocaleDateString("en-US", {
                                                    month: "short",
                                                    day: "numeric",
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                })}
                                            </span>
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm">
                                        <div className="flex items-center gap-1 text-[#14B985]">
                                            <CheckCircleIcon className="h-4 w-4" />
                                            <span>{success}</span>
                                        </div>
                                        {failed > 0 && (
                                            <div className="flex items-center gap-1 text-red-400">
                                                <XCircleIcon className="h-4 w-4" />
                                                <span>{failed}</span>
                                            </div>
                                        )}
                                        <span className="text-white/40">/ {total}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>
            )}
        </div>
    );
}
