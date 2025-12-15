"use client";

import { useState } from "react";
import { useActionState } from "react";
import {
    changePasswordAction,
    type ChangePasswordResult,
} from "@/actions/admin/change-password";

export default function SettingsClient() {
    const [state, formAction] = useActionState<
        ChangePasswordResult | null,
        FormData
    >(changePasswordAction, null);

    const [showSuccess, setShowSuccess] = useState(false);

    // Show success message when password is changed
    if (state?.success && !showSuccess) {
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 5000);
    }

    return (
        <div className="space-y-6">
            <div className="admin-panel p-6">
                <h3 className="text-lg font-semibold text-white mb-4 font-display">
                    Change Password
                </h3>
                <p className="text-white/50 text-sm mb-6">
                    Update your admin password. You'll need to enter your current password
                    to confirm the change.
                </p>

                {showSuccess && (
                    <div className="mb-4 p-3 bg-[#14B985]/20 text-[#14B985] rounded-xl text-sm border border-[#14B985]/30 font-medium">
                        ✓ Password changed successfully!
                    </div>
                )}

                <form action={formAction} className="space-y-4 max-w-md">
                    <div>
                        <label
                            htmlFor="currentPassword"
                            className="block text-sm font-medium text-white/70 mb-2"
                        >
                            Current Password
                        </label>
                        <input
                            type="password"
                            name="currentPassword"
                            id="currentPassword"
                            placeholder="Enter current password"
                            className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-[#FFC931]/50 focus:border-[#FFC931] text-white placeholder-white/30 transition-all"
                            required
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="newPassword"
                            className="block text-sm font-medium text-white/70 mb-2"
                        >
                            New Password
                        </label>
                        <input
                            type="password"
                            name="newPassword"
                            id="newPassword"
                            placeholder="Enter new password"
                            className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-[#FFC931]/50 focus:border-[#FFC931] text-white placeholder-white/30 transition-all"
                            required
                            minLength={8}
                        />
                        <p className="text-xs text-white/40 mt-1.5">
                            Minimum 8 characters
                        </p>
                    </div>

                    <div>
                        <label
                            htmlFor="confirmPassword"
                            className="block text-sm font-medium text-white/70 mb-2"
                        >
                            Confirm New Password
                        </label>
                        <input
                            type="password"
                            name="confirmPassword"
                            id="confirmPassword"
                            placeholder="Confirm new password"
                            className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-[#FFC931]/50 focus:border-[#FFC931] text-white placeholder-white/30 transition-all"
                            required
                        />
                    </div>

                    {state && !state.success && (
                        <div className="p-3 bg-red-500/20 text-red-400 rounded-xl text-sm border border-red-500/30">
                            {state.error}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="px-5 py-2.5 bg-[#FFC931] text-black font-bold rounded-xl hover:bg-[#FFD966] transition-colors shadow-lg shadow-[#FFC931]/20"
                    >
                        Change Password
                    </button>
                </form>
            </div>
        </div>
    );
}

