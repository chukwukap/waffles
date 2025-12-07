import { getAdminSession } from "@/lib/admin-auth";
import { AdminSidebar } from "@/components/admin/Sidebar";
import { redirect } from "next/navigation";
import GlobalToaster from "@/components/ui/Toaster";
import { fontBody, fontDisplay } from "@/lib/fonts";
import { cn } from "@/lib/utils";

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
            <div className={cn(
                "flex h-screen admin-background text-white",
                fontBody.variable,
                fontDisplay.variable
            )}>
                {/* Sidebar */}
                <aside className="hidden md:flex md:w-64 md:flex-col relative z-10">
                    <AdminSidebar />
                </aside>

                {/* Main content */}
                <div className="flex flex-1 flex-col overflow-hidden relative z-10">
                    {/* Header */}
                    <header className="admin-header flex h-16 items-center justify-between px-6">
                        <h2 className="text-xl font-semibold text-white font-display">
                            Admin Dashboard
                        </h2>
                        <div className="flex items-center gap-4">
                            <div className="text-sm text-white/60">
                                Logged in as:{" "}
                                <span className="font-semibold text-[#FFC931]">
                                    {session.username}
                                </span>
                            </div>
                            <div className="h-9 w-9 rounded-full bg-linear-to-br from-[#FFC931] to-[#00CFF2] flex items-center justify-center text-black font-bold text-sm shadow-lg ring-2 ring-white/10">
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

