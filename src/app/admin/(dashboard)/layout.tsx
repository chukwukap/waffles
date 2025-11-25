import { getAdminSession } from "@/lib/admin-auth";
import { AdminSidebar } from "@/components/admin/Sidebar";
import { redirect } from "next/navigation";
import GlobalToaster from "@/components/ui/Toaster";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // Check if user is authenticated (server-side)
    const session = await getAdminSession();

    // If no session and trying to access protected route, redirect to login
    // Note: This is a double-check. Middleware should catch most cases
    if (!session) {
        redirect("/admin/login");
    }

    return (
        <>
            <div className="flex h-screen bg-slate-900 text-slate-100">
                {/* Sidebar */}
                <aside className="hidden md:flex md:w-64 md:flex-col">
                    <AdminSidebar />
                </aside>

                {/* Main content */}
                <div className="flex flex-1 flex-col overflow-hidden">
                    {/* Header */}
                    <header className="flex h-16 items-center justify-between border-b border-slate-700 bg-slate-800 px-6">
                        <h2 className="text-xl font-semibold text-slate-100 font-display">
                            Admin Dashboard
                        </h2>
                        <div className="flex items-center gap-4">
                            <div className="text-sm text-slate-400">
                                Logged in as:{" "}
                                <span className="font-semibold text-slate-200">
                                    {session.username}
                                </span>
                            </div>
                            <div className="h-8 w-8 rounded-full bg-linear-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-medium text-sm shadow-sm ring-2 ring-slate-700">
                                {session.username?.[0]?.toUpperCase() || "A"}
                            </div>
                        </div>
                    </header>

                    {/* Page content */}
                    <main className="flex-1 overflow-y-auto p-6">{children}</main>
                </div>
            </div>
            <GlobalToaster />
        </>
    );
}
