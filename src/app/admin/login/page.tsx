"use client";

import { useActionState } from "react"
import { loginAdminAction, type LoginResult } from "@/actions/admin/auth";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function LoginForm() {
    const searchParams = useSearchParams();
    const signupSuccess = searchParams.get("signup") === "success";

    const [state, formAction] = useActionState<LoginResult | null, FormData>(
        loginAdminAction,
        null
    );

    return (
        <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-900 via-purple-900 to-slate-900">
            <div className="w-full max-w-md p-8">
                <div className="bg-slate-800/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/20">
                    <div className="text-center mb-8">
                        <h1 className="text-4xl font-bold text-white mb-2 font-display">🧇 Waffles</h1>
                        <p className="text-gray-300">Admin Dashboard</p>
                    </div>

                    {signupSuccess && (
                        <div className="mb-6 p-4 bg-green-9500/20 border border-green-500/50 rounded-lg">
                            <p className="text-green-200 text-sm">Account created successfully! Please sign in.</p>
                        </div>
                    )}

                    <form action={formAction} className="space-y-6">
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
                                className="w-full px-4 py-3 bg-slate-800/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                placeholder="Enter your password"
                            />
                        </div>

                        {state && !state.success && (
                            <div className="p-4 bg-red-9500/20 border border-red-500/50 rounded-lg">
                                <p className="text-red-200 text-sm">{state.error}</p>
                            </div>
                        )}

                        <button
                            type="submit"
                            className="w-full py-3 px-4 bg-linear-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200"
                        >
                            Sign In
                        </button>

                        <div className="text-center">
                            <Link
                                href="/admin/signup"
                                className="text-sm text-purple-300 hover:text-purple-200 transition-colors"
                            >
                                Need an account? Sign up
                            </Link>
                        </div>
                    </form>

                    <div className="mt-6 text-center text-slate-400 text-sm">
                        <p>Secure admin access only</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function AdminLoginPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-linear-to-br from-slate-900 via-purple-900 to-slate-900" />}>
            <LoginForm />
        </Suspense>
    );
}
