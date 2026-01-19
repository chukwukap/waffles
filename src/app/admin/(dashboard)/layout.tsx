import { getAdminSession } from "@/lib/admin-auth";
import { AdminSidebar } from "@/components/admin/Sidebar";
import { redirect } from "next/navigation";
import GlobalToaster from "@/components/ui/Toaster";
import { fontBody, fontDisplay } from "@/lib/fonts";
import { cn } from "@/lib/utils";
import { AdminOnchainProvider } from "@/components/admin/AdminOnchainProvider";
import { AdminHeader } from "@/components/admin/AdminHeader";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await getAdminSession();

    if (!session) {
        redirect("/admin/login");
    }

    return (
        <AdminOnchainProvider>
            <div className={cn(
                "flex h-screen admin-background text-white font-display",
                fontBody.variable,
                fontDisplay.variable
            )}>
                {/* Sidebar */}
                <aside className="hidden md:flex md:w-64 md:flex-col relative z-10">
                    <AdminSidebar />
                </aside>

                {/* Main content */}
                <div className="flex flex-1 flex-col overflow-hidden relative z-10">
                    <AdminHeader
                        username={session.username || "Admin"}
                        pfpUrl={session.pfpUrl || null}
                    />
                    <main className="flex-1 overflow-y-auto p-6">{children}</main>
                </div>
            </div>
            <GlobalToaster />
        </AdminOnchainProvider>
    );
}
