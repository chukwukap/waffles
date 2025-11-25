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
        <div className="bg-slate-800 rounded-xl shadow-sm border border-slate-700 p-6">
            <h3 className="text-lg font-semibold text-slate-100 mb-4">Actions</h3>
            <div className="space-y-3">
                <div>
                    <p className="text-sm font-medium text-slate-300 mb-2">Change Status</p>
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => handleStatusChange("ACTIVE")}
                            disabled={loading || user.status === "ACTIVE"}
                            className="px-3 py-1.5 bg-green-600 disabled:bg-green-300 text-white text-sm rounded-lg hover:bg-green-700"
                        >
                            Activate
                        </button>
                        <button
                            onClick={() => handleStatusChange("WAITLIST")}
                            disabled={loading || user.status === "WAITLIST"}
                            className="px-3 py-1.5 bg-yellow-600 disabled:bg-yellow-300 text-white text-sm rounded-lg hover:bg-yellow-700"
                        >
                            Waitlist
                        </button>
                        <button
                            onClick={() => handleStatusChange("BANNED")}
                            disabled={loading || user.status === "BANNED"}
                            className="px-3 py-1.5 bg-red-600 disabled:bg-red-300 text-white text-sm rounded-lg hover:bg-red-700"
                        >
                            Ban
                        </button>
                    </div>
                </div>

                <div className="pt-3 border-t border-slate-700">
                    <button
                        onClick={handleQuotaAdjust}
                        disabled={loading}
                        className="w-full px-4 py-2 bg-blue-600 disabled:bg-blue-300 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
                    >
                        Adjust Invite Quota
                    </button>
                </div>

                {user.role !== "ADMIN" && (
                    <div className="pt-3 border-t border-slate-700">
                        <button
                            onClick={handlePromoteToAdmin}
                            disabled={loading}
                            className="w-full px-4 py-2 bg-purple-600 disabled:bg-purple-300 text-white text-sm font-medium rounded-lg hover:bg-purple-700"
                        >
                            Promote to Admin
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
