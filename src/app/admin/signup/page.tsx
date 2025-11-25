"use client";

import { useActionState } from "react";
import { signupAdminAction, type SignupResult } from "@/actions/admin/signup";
import Link from "next/link";

export default function AdminSignupPage() {
    const [state, formAction] = useActionState<SignupResult | null, FormData>(
        signupAdminAction,
        null
    );

    return (
        <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-900 via-purple-900 to-slate-900">
            <div className="w-full max-w-md p-8">
                <div className="bg-slate-800/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/20">
                    <div className="text-center mb-8">
                        <h1 className="text-4xl font-bold text-white mb-2 font-display">
                            🧇 Waffles
                        </h1>
                        <p className="text-gray-300">Admin Setup</p>
                        <p className="text-xs text-slate-400 mt-2">
                            (Requires manual role assignment)
                        </p>
                    </div>

                    <form action={formAction} className="space-y-6">
                        {/* Username Input */}
                        <div>
                            <label
                                htmlFor="username"
                                className="block text-sm font-medium text-gray-200 mb-2"
                            >
                                Username
                            </label>
                            <input
                                type="text"
                                id="username"
                                name="username"
                                required
                                className="w-full px-4 py-3 bg-slate-800/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                placeholder="Enter your username"
                            />
                        </div>

                        {/* Password Input */}
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
                                minLength={8}
                                className="w-full px-4 py-3 bg-slate-800/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                placeholder="Enter password (min 8 chars)"
                            />
                        </div>

                        {/* Confirm Password Input */}
                        <div>
                            <label
                                htmlFor="confirmPassword"
                                className="block text-sm font-medium text-gray-200 mb-2"
                            >
                                Confirm Password
                            </label>
                            <input
                                type="password"
                                id="confirmPassword"
                                name="confirmPassword"
                                required
                                className="w-full px-4 py-3 bg-slate-800/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                placeholder="Confirm your password"
                            />
                        </div>

                        {/* Error Display */}
                        {state && !state.success && (
                            <div className="p-4 bg-red-9500/20 border border-red-500/50 rounded-lg">
                                <p className="text-red-200 text-sm">{state.error}</p>
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            className="w-full py-3 px-4 bg-linear-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200"
                        >
                            Setup Admin Account
                        </button>

                        {/* Link to Login */}
                        <div className="text-center">
                            <Link
                                href="/admin/login"
                                className="text-sm text-purple-300 hover:text-purple-200 transition-colors"
                            >
                                Already have an account? Sign in
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
