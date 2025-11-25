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
            <div className="bg-slate-800 rounded-xl shadow-sm border border-slate-700 p-6">
                <h3 className="text-lg font-semibold text-slate-100 mb-4 font-display">
                    Change Password
                </h3>
                <p className="text-slate-400 text-sm mb-6">
                    Update your admin password. You'll need to enter your current password
                    to confirm the change.
                </p>

                {showSuccess && (
                    <div className="mb-4 p-3 bg-green-950 text-green-700 rounded-lg text-sm border border-green-200">
                        Password changed successfully!
                    </div>
                )}

                <form action={formAction} className="space-y-4 max-w-md">
                    <div>
                        <label
                            htmlFor="currentPassword"
                            className="block text-sm font-medium text-slate-300 mb-1"
                        >
                            Current Password
                        </label>
                        <input
                            type="password"
                            name="currentPassword"
                            id="currentPassword"
                            placeholder="Enter current password"
                            className="w-full px-4 py-2 border border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-slate-100"
                            required
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="newPassword"
                            className="block text-sm font-medium text-slate-300 mb-1"
                        >
                            New Password
                        </label>
                        <input
                            type="password"
                            name="newPassword"
                            id="newPassword"
                            placeholder="Enter new password"
                            className="w-full px-4 py-2 border border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-slate-100"
                            required
                            minLength={8}
                        />
                        <p className="text-xs text-slate-400 mt-1">
                            Minimum 8 characters
                        </p>
                    </div>

                    <div>
                        <label
                            htmlFor="confirmPassword"
                            className="block text-sm font-medium text-slate-300 mb-1"
                        >
                            Confirm New Password
                        </label>
                        <input
                            type="password"
                            name="confirmPassword"
                            id="confirmPassword"
                            placeholder="Confirm new password"
                            className="w-full px-4 py-2 border border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-slate-100"
                            required
                        />
                    </div>

                    {state && !state.success && (
                        <div className="p-3 bg-red-950 text-red-700 rounded-lg text-sm">
                            {state.error}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="px-4 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors"
                    >
                        Change Password
                    </button>
                </form>
            </div>

            <div className="bg-blue-950 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">💡 Password Management</h4>
                <ul className="text-sm text-blue-800 space-y-2">
                    <li>• Passwords are stored securely as bcrypt hashes in the database</li>
                    <li>• Each admin has their own individual password</li>
                    <li>• No need to update environment variables anymore</li>
                    <li>• Sessions last for 7 days before requiring re-login</li>
                </ul>
            </div>
        </div>
    );
}
