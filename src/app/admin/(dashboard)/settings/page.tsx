import SettingsClient from "./client";
import { getAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";

export default async function AdminSettingsPage() {
    // Get current admin session
    const session = await getAdminSession();

    // Get admin user info
    let adminInfo = null;
    if (session) {
        adminInfo = await prisma.user.findUnique({
            where: { id: session.userId },
            select: { fid: true, username: true, password: true },
        });
    }

    const hasSessionSecret = !!process.env.ADMIN_SESSION_SECRET;
    const hasSignupSecret = !!process.env.ADMIN_SIGNUP_SECRET;
    const hasPasswordSet = !!adminInfo?.password;

    return (
        <div className="max-w-2xl space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-100 font-display">Settings</h1>
                <p className="text-slate-400 mt-1">Admin dashboard settings and configuration</p>
            </div>

            {/* Admin Info */}
            {adminInfo && (
                <div className="bg-slate-800 rounded-xl shadow-sm border border-slate-700 p-6">
                    <h3 className="text-lg font-semibold text-slate-100 mb-4 font-display">
                        Your Account
                    </h3>
                    <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                            <span className="text-slate-400 font-medium">Username:</span>
                            <span className="text-slate-100 font-mono bg-slate-700 px-2 py-1 rounded">
                                {adminInfo.username}
                            </span>
                        </div>
                        {adminInfo.username && (
                            <div className="flex items-center gap-2">
                                <span className="text-slate-400 font-medium">Username:</span>
                                <span className="text-slate-100">{adminInfo.username}</span>
                            </div>
                        )}
                        <div className="flex items-center gap-2">
                            <span className="text-slate-400 font-medium">Password:</span>
                            <span className={`text-xs px-2 py-1 rounded ${hasPasswordSet ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                                {hasPasswordSet ? "Set" : "Not Set"}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* Environment Status */}
            <div className="bg-blue-950 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">Environment Status</h4>
                <ul className="text-sm text-blue-800 space-y-2">
                    <li className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${hasSessionSecret ? "bg-green-9500" : "bg-yellow-500"}`}></span>
                        <code className="px-1 py-0.5 bg-blue-100 rounded">ADMIN_SESSION_SECRET</code>
                        <span className="text-blue-600/80">- {hasSessionSecret ? "Configured" : "Not set (using default)"}</span>
                    </li>
                    <li className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${hasSignupSecret ? "bg-green-9500" : "bg-yellow-500"}`}></span>
                        <code className="px-1 py-0.5 bg-blue-100 rounded">ADMIN_SIGNUP_SECRET</code>
                        <span className="text-blue-600/80">- {hasSignupSecret ? "Required for signup" : "Open signup"}</span>
                    </li>
                </ul>
                <p className="text-xs text-blue-700 mt-3">
                    💡 <code className="bg-blue-100 px-1 rounded">ADMIN_PASSWORD_HASH</code> is deprecated and no longer used.
                </p>
            </div>

            <SettingsClient />
        </div>
    );
}
