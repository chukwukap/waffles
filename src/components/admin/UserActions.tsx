"use client";

import { updateUserStatusAction, adjustInviteQuotaAction, promoteToAdminAction } from "@/actions/admin/users";
import { useState } from "react";

export function UserActions({ user }: { user: any }) {
    const [loading, setLoading] = useState(false);

    const handleStatusChange = async (status: "NONE" | "WAITLIST" | "ACTIVE" | "BANNED") => {
        if (!confirm(`Change user status to ${status}?`)) return;

        setLoading(true);
        const result = await updateUserStatusAction(user.id, status);
        setLoading(false);

        if (!result.success) {
            alert(result.error);
        }
    };

    const handleQuotaAdjust = async () => {
        const newQuota = prompt(`Enter new invite quota (current: ${user.inviteQuota}):`, user.inviteQuota.toString());
        if (!newQuota) return;

        const quota = parseInt(newQuota);
        if (isNaN(quota) || quota < 0) {
            alert("Invalid quota");
            return;
        }

        setLoading(true);
        const result = await adjustInviteQuotaAction(user.id, quota);
        setLoading(false);

        if (!result.success) {
            alert(result.error);
        }
    };

    const handlePromoteToAdmin = async () => {
        if (!confirm(`Promote ${user.username} to ADMIN? This gives them full admin access.`)) return;

        setLoading(true);
        const result = await promoteToAdminAction(user.id);
        setLoading(false);

        if (!result.success) {
            alert(result.error);
        }
    };

    return (
        <div className="admin-panel p-6">
            <h3 className="text-lg font-semibold text-white mb-4 font-display">Actions</h3>
            <div className="space-y-4">
                <div>
                    <p className="text-sm font-medium text-white/50 mb-3">Change Status</p>
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => handleStatusChange("ACTIVE")}
                            disabled={loading || user.status === "ACTIVE"}
                            className="px-3 py-1.5 bg-[#14B985]/20 disabled:opacity-40 text-[#14B985] text-sm rounded-xl hover:bg-[#14B985]/30 border border-[#14B985]/30 transition-colors font-medium"
                        >
                            Activate
                        </button>
                        <button
                            onClick={() => handleStatusChange("WAITLIST")}
                            disabled={loading || user.status === "WAITLIST"}
                            className="px-3 py-1.5 bg-[#FFC931]/20 disabled:opacity-40 text-[#FFC931] text-sm rounded-xl hover:bg-[#FFC931]/30 border border-[#FFC931]/30 transition-colors font-medium"
                        >
                            Waitlist
                        </button>
                        <button
                            onClick={() => handleStatusChange("BANNED")}
                            disabled={loading || user.status === "BANNED"}
                            className="px-3 py-1.5 bg-red-500/20 disabled:opacity-40 text-red-400 text-sm rounded-xl hover:bg-red-500/30 border border-red-500/30 transition-colors font-medium"
                        >
                            Ban
                        </button>
                    </div>
                </div>

                <div className="pt-4 border-t border-white/10">
                    <button
                        onClick={handleQuotaAdjust}
                        disabled={loading}
                        className="w-full px-4 py-2.5 bg-[#00CFF2]/20 disabled:opacity-40 text-[#00CFF2] text-sm font-medium rounded-xl hover:bg-[#00CFF2]/30 border border-[#00CFF2]/30 transition-colors"
                    >
                        Adjust Invite Quota
                    </button>
                </div>

                {user.role !== "ADMIN" && (
                    <div className="pt-4 border-t border-white/10">
                        <button
                            onClick={handlePromoteToAdmin}
                            disabled={loading}
                            className="w-full px-4 py-2.5 bg-[#FB72FF]/20 disabled:opacity-40 text-[#FB72FF] text-sm font-medium rounded-xl hover:bg-[#FB72FF]/30 border border-[#FB72FF]/30 transition-colors"
                        >
                            Promote to Admin
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

