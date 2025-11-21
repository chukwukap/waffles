import SettingsClient from "./client";

export default function AdminSettingsPage() {
    const hasPasswordHash = !!process.env.ADMIN_PASSWORD_HASH;
    const hasSessionSecret = !!process.env.ADMIN_SESSION_SECRET;

    return (
        <div className="max-w-2xl space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
                <p className="text-slate-600 mt-1">Admin dashboard settings and configuration</p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">Environment Status</h4>
                <ul className="text-sm text-blue-800 space-y-2">
                    <li className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${hasPasswordHash ? "bg-green-500" : "bg-red-500"}`}></span>
                        <code className="px-1 py-0.5 bg-blue-100 rounded">ADMIN_PASSWORD_HASH</code>
                        <span className="text-blue-600/80">- {hasPasswordHash ? "Configured" : "Missing"}</span>
                    </li>
                    <li className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${hasSessionSecret ? "bg-green-500" : "bg-red-500"}`}></span>
                        <code className="px-1 py-0.5 bg-blue-100 rounded">ADMIN_SESSION_SECRET</code>
                        <span className="text-blue-600/80">- {hasSessionSecret ? "Configured" : "Missing"}</span>
                    </li>
                </ul>
            </div>

            <SettingsClient />
        </div>
    );
}
