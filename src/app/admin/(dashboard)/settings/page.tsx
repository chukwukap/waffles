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
                <h1 className="text-2xl font-bold text-white font-display">Settings</h1>
                <p className="text-white/60 mt-1">Admin dashboard settings and configuration</p>
            </div>

            {/* Admin Info */}
            {adminInfo && (
                <div className="admin-panel p-6">
                    <h3 className="text-lg font-semibold text-white mb-4 font-display">
                        Your Account
                    </h3>
                    <div className="space-y-3 text-sm">
                        <div className="flex items-center gap-3">
                            <span className="text-white/50 font-medium w-24">Username:</span>
                            <span className="text-white font-mono bg-white/10 px-3 py-1.5 rounded-lg">
                                {adminInfo.username}
                            </span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-white/50 font-medium w-24">Password:</span>
                            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${hasPasswordSet
                                ? "bg-[#14B985]/20 text-[#14B985]"
                                : "bg-red-500/20 text-red-400"}`}>
                                {hasPasswordSet ? "✓ Set" : "✗ Not Set"}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* Environment Status */}
            <div className="admin-panel p-6 border-[#00CFF2]/20">
                <h4 className="font-semibold text-white mb-4 font-display flex items-center gap-2">
                    <span className="text-[#00CFF2]">⚙️</span> Environment Status
                </h4>
                <ul className="text-sm space-y-3">
                    <li className="flex items-center gap-3">
                        <span className={`w-2 h-2 rounded-full ${hasSessionSecret ? "bg-[#14B985]" : "bg-[#FFC931]"}`}></span>
                        <code className="px-2 py-1 bg-white/5 rounded-lg text-[#00CFF2] text-xs">ADMIN_SESSION_SECRET</code>
                        <span className="text-white/50 text-xs">— {hasSessionSecret ? "Configured" : "Not set (using default)"}</span>
                    </li>
                    <li className="flex items-center gap-3">
                        <span className={`w-2 h-2 rounded-full ${hasSignupSecret ? "bg-[#14B985]" : "bg-[#FFC931]"}`}></span>
                        <code className="px-2 py-1 bg-white/5 rounded-lg text-[#00CFF2] text-xs">ADMIN_SIGNUP_SECRET</code>
                        <span className="text-white/50 text-xs">— {hasSignupSecret ? "Required for signup" : "Open signup"}</span>
                    </li>
                </ul>
                <p className="text-xs text-white/40 mt-4 pt-4 border-t border-white/6">
                    💡 <code className="bg-white/5 px-1.5 py-0.5 rounded">ADMIN_PASSWORD_HASH</code> is deprecated and no longer used.
                </p>
            </div>

            <SettingsClient />
        </div>
    );
}

