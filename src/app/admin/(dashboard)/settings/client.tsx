"use client";

import { useState } from "react";
import { generatePasswordHashAction } from "@/actions/admin/settings";

export default function SettingsClient() {
    const [hash, setHash] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);

    async function handleSubmit(formData: FormData) {
        setLoading(true);
        setError(null);
        setHash(null);
        setCopied(false);

        try {
            const result = await generatePasswordHashAction(formData);
            if (result.success && result.hash) {
                setHash(result.hash);
            } else {
                setError(result.error || "Failed to generate hash");
            }
        } catch (e) {
            setError("An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    }

    const copyToClipboard = () => {
        if (hash) {
            navigator.clipboard.writeText(hash);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4 font-display">
                    Password Hash Generator
                </h3>
                <p className="text-slate-600 text-sm mb-6">
                    Since admin passwords are stored as hashes in environment variables, you
                    can use this tool to generate a new hash for a password.
                </p>

                <form action={handleSubmit} className="space-y-4 max-w-md">
                    <div>
                        <label
                            htmlFor="password"
                            className="block text-sm font-medium text-slate-700 mb-1"
                        >
                            New Password
                        </label>
                        <input
                            type="text"
                            name="password"
                            id="password"
                            placeholder="Enter password to hash"
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-slate-900"
                            required
                            minLength={8}
                        />
                        <p className="text-xs text-slate-500 mt-1">
                            Minimum 8 characters
                        </p>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="px-4 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {loading ? "Generating..." : "Generate Hash"}
                    </button>
                </form>

                {error && (
                    <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                        {error}
                    </div>
                )}

                {hash && (
                    <div className="mt-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
                        <label className="block text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">
                            Generated Hash
                        </label>
                        <div className="flex items-center gap-2">
                            <code className="flex-1 p-2 bg-white border border-slate-200 rounded text-sm font-mono break-all text-slate-800">
                                {hash}
                            </code>
                            <button
                                onClick={copyToClipboard}
                                className="p-2 text-slate-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                                title="Copy to clipboard"
                            >
                                {copied ? (
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 20 20"
                                        fill="currentColor"
                                        className="w-5 h-5 text-green-600"
                                    >
                                        <path
                                            fillRule="evenodd"
                                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                ) : (
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 20 20"
                                        fill="currentColor"
                                        className="w-5 h-5"
                                    >
                                        <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                                        <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                                    </svg>
                                )}
                            </button>
                        </div>
                        <div className="mt-3 text-sm text-slate-600">
                            <p className="font-medium mb-1">How to update:</p>
                            <ol className="list-decimal list-inside space-y-1 text-slate-500">
                                <li>Copy the hash above</li>
                                <li>
                                    Open your <code className="text-xs bg-slate-100 px-1 rounded">.env</code> file
                                </li>
                                <li>
                                    Update <code className="text-xs bg-slate-100 px-1 rounded">ADMIN_PASSWORD_HASH</code> with this value
                                </li>
                                <li>
                                    <strong>Important:</strong> Wrap the value in single quotes (e.g. <code className="text-xs bg-slate-100 px-1 rounded">ADMIN_PASSWORD_HASH='$2b$...'</code>)
                                </li>
                                <li>Restart your server</li>
                            </ol>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
