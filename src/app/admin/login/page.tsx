"use client";

import { useActionState } from "react"
import { loginAdminAction, type LoginResult } from "@/actions/admin/auth";

export default function AdminLoginPage() {
    const [state, formAction] = useActionState<LoginResult | null, FormData>(
        loginAdminAction,
        null
    );

    return (
        <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-900 via-purple-900 to-slate-900">
            <div className="w-full max-w-md p-8">
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/20">
                    <div className="text-center mb-8">
                        <h1 className="text-4xl font-bold text-white mb-2 font-display">🧇 Waffles</h1>
                        <p className="text-gray-300">Admin Dashboard</p>
                    </div>

                    <form action={formAction} className="space-y-6">
                        <div>
                            <label
                                htmlFor="fid"
                                className="block text-sm font-medium text-gray-200 mb-2"
                            >
                                Farcaster ID (FID)
                            </label>
                            <input
                                type="number"
                                id="fid"
                                name="fid"
                                required
                                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                placeholder="Enter your FID"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="password"
                                className="block text-sm font-medium text-gray-200 mb-2"
                            >
                                Password
                            </label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                required
                                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                placeholder="Enter your password"
                            />
                        </div>

                        {state && !state.success && (
                            <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
                                <p className="text-red-200 text-sm">{state.error}</p>
                            </div>
                        )}

                        <button
                            type="submit"
                            className="w-full py-3 px-4 bg-linear-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200"
                        >
                            Sign In
                        </button>
                    </form>

                    <div className="mt-6 text-center text-gray-400 text-sm">
                        <p>Secure admin access only</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
