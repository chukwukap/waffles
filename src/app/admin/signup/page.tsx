"use client";

import { useActionState } from "react";
import { signupAdminAction, type SignupResult } from "@/actions/admin/signup";
import Link from "next/link";
import { LockClosedIcon, UserIcon, ShieldCheckIcon, KeyIcon } from "@heroicons/react/24/outline";
import { ExclamationTriangleIcon, InformationCircleIcon } from "@heroicons/react/24/solid";

export default function AdminSignupPage() {
    const [state, formAction, isPending] = useActionState<SignupResult | null, FormData>(
        signupAdminAction,
        null
    );

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
            {/* Animated Background */}
            <div className="absolute inset-0 bg-[#0A0A0B]">
                {/* Grid pattern */}
                <div
                    className="absolute inset-0 opacity-20"
                    style={{
                        backgroundImage: `linear-gradient(rgba(0,207,242,0.03) 1px, transparent 1px),
                                          linear-gradient(90deg, rgba(0,207,242,0.03) 1px, transparent 1px)`,
                        backgroundSize: "50px 50px",
                    }}
                />
                {/* Radial glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#00CFF2]/5 rounded-full blur-[150px]" />
                <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] bg-[#FB72FF]/5 rounded-full blur-[100px]" />
            </div>

            {/* Floating particles */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {[...Array(20)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute w-1 h-1 bg-[#00CFF2]/30 rounded-full animate-pulse"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            animationDelay: `${Math.random() * 3}s`,
                            animationDuration: `${2 + Math.random() * 3}s`,
                        }}
                    />
                ))}
            </div>

            {/* Main Card */}
            <div className="relative z-10 w-full max-w-md mx-4">
                <div className="relative">
                    {/* Glow ring */}
                    <div className="absolute -inset-1 bg-gradient-to-r from-[#00CFF2]/20 via-[#FB72FF]/20 to-[#FFC931]/20 rounded-3xl blur-xl opacity-60" />

                    {/* Card */}
                    <div className="relative bg-[#0A0A0B]/90 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
                        {/* Top accent bar */}
                        <div className="h-1 bg-gradient-to-r from-[#00CFF2] via-[#FB72FF] to-[#FFC931]" />

                        <div className="p-8">
                            {/* Logo & Header */}
                            <div className="text-center mb-8">
                                <div className="relative inline-block mb-4">
                                    <div className="absolute -inset-3 bg-[#00CFF2]/20 rounded-full blur-xl animate-pulse" />
                                    <div className="relative w-16 h-16 mx-auto bg-gradient-to-br from-[#00CFF2] to-[#0099CC] rounded-2xl flex items-center justify-center shadow-lg shadow-[#00CFF2]/30 rotate-[8deg] hover:rotate-0 transition-transform duration-300">
                                        <ShieldCheckIcon className="h-8 w-8 text-white" />
                                    </div>
                                </div>
                                <h1 className="text-3xl font-bold text-white mb-1 font-display tracking-tight">
                                    Admin Setup
                                </h1>
                                <p className="text-white/50 text-sm font-display">
                                    Complete your admin account setup
                                </p>
                            </div>

                            {/* Info Notice */}
                            <div className="mb-6 p-4 bg-[#FFC931]/10 border border-[#FFC931]/30 rounded-xl flex items-start gap-3">
                                <InformationCircleIcon className="h-5 w-5 text-[#FFC931] shrink-0 mt-0.5" />
                                <p className="text-white/70 text-sm">
                                    You must be manually assigned the <span className="text-[#FFC931] font-semibold">ADMIN</span> role before you can complete setup.
                                </p>
                            </div>

                            {/* Form */}
                            <form action={formAction} className="space-y-5">
                                {/* Username */}
                                <div className="space-y-2">
                                    <label htmlFor="username" className="block text-sm font-medium text-white/70 font-display uppercase tracking-wider">
                                        Username
                                    </label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <UserIcon className="h-5 w-5 text-white/30 group-focus-within:text-[#00CFF2] transition-colors" />
                                        </div>
                                        <input
                                            type="text"
                                            id="username"
                                            name="username"
                                            required
                                            disabled={isPending}
                                            className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#00CFF2]/50 focus:border-[#00CFF2]/50 transition-all duration-200 disabled:opacity-50"
                                            placeholder="Your existing username"
                                        />
                                    </div>
                                </div>

                                {/* Password */}
                                <div className="space-y-2">
                                    <label htmlFor="password" className="block text-sm font-medium text-white/70 font-display uppercase tracking-wider">
                                        Password
                                    </label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <LockClosedIcon className="h-5 w-5 text-white/30 group-focus-within:text-[#00CFF2] transition-colors" />
                                        </div>
                                        <input
                                            type="password"
                                            id="password"
                                            name="password"
                                            required
                                            minLength={8}
                                            disabled={isPending}
                                            className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#00CFF2]/50 focus:border-[#00CFF2]/50 transition-all duration-200 disabled:opacity-50"
                                            placeholder="Min 8 characters"
                                        />
                                    </div>
                                </div>

                                {/* Confirm Password */}
                                <div className="space-y-2">
                                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-white/70 font-display uppercase tracking-wider">
                                        Confirm Password
                                    </label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <KeyIcon className="h-5 w-5 text-white/30 group-focus-within:text-[#00CFF2] transition-colors" />
                                        </div>
                                        <input
                                            type="password"
                                            id="confirmPassword"
                                            name="confirmPassword"
                                            required
                                            disabled={isPending}
                                            className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#00CFF2]/50 focus:border-[#00CFF2]/50 transition-all duration-200 disabled:opacity-50"
                                            placeholder="Confirm your password"
                                        />
                                    </div>
                                </div>

                                {/* Error Message */}
                                {state && !state.success && (
                                    <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3">
                                        <ExclamationTriangleIcon className="h-5 w-5 text-red-400 shrink-0" />
                                        <p className="text-red-400 text-sm">{state.error}</p>
                                    </div>
                                )}

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    disabled={isPending}
                                    className="relative w-full group"
                                >
                                    <div className="absolute -inset-0.5 bg-gradient-to-r from-[#00CFF2] to-[#0099CC] rounded-xl blur opacity-60 group-hover:opacity-100 transition duration-300" />
                                    <div className="relative flex items-center justify-center gap-2 py-4 px-6 bg-gradient-to-r from-[#00CFF2] to-[#0099CC] text-black font-bold rounded-xl shadow-lg shadow-[#00CFF2]/20 hover:shadow-[#00CFF2]/40 transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:transform-none">
                                        {isPending ? (
                                            <>
                                                <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                                                <span>Creating account...</span>
                                            </>
                                        ) : (
                                            <>
                                                <ShieldCheckIcon className="h-5 w-5" />
                                                <span>Complete Setup</span>
                                            </>
                                        )}
                                    </div>
                                </button>
                            </form>

                            {/* Footer Link */}
                            <div className="mt-6 text-center">
                                <Link
                                    href="/admin/login"
                                    className="text-sm text-white/50 hover:text-[#00CFF2] transition-colors font-display"
                                >
                                    Already have an account? <span className="text-[#00CFF2]">Sign in</span>
                                </Link>
                            </div>
                        </div>

                        {/* Bottom security badge */}
                        <div className="px-8 py-4 bg-white/3 border-t border-white/5 flex items-center justify-center gap-2">
                            <LockClosedIcon className="h-4 w-4 text-[#14B985]" />
                            <span className="text-xs text-white/40 font-display">Secure admin setup</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
