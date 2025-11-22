"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAdminAction } from "@/actions/admin/auth";
import {
    HomeIcon,
    UsersIcon,
    TrophyIcon,
    TicketIcon,
    ChartBarIcon,
    DocumentTextIcon,
    Cog6ToothIcon,
    ArrowRightOnRectangleIcon,
    PhotoIcon,
} from "@heroicons/react/24/outline";

const navigation = [
    { name: "Dashboard", href: "/admin", icon: HomeIcon },
    { name: "Games", href: "/admin/games", icon: TrophyIcon },
    { name: "Users", href: "/admin/users", icon: UsersIcon },
    { name: "Tickets", href: "/admin/tickets", icon: TicketIcon },
    { name: "Media Library", href: "/admin/media", icon: PhotoIcon },
    { name: "Analytics", href: "/admin/analytics", icon: ChartBarIcon },
    { name: "Audit Logs", href: "/admin/logs", icon: DocumentTextIcon },
    { name: "Settings", href: "/admin/settings", icon: Cog6ToothIcon },
];

export function AdminSidebar() {
    const pathname = usePathname();

    return (
        <div className="flex h-full flex-col bg-linear-to-b from-slate-800 to-slate-900 border-r border-slate-700">
            {/* Logo */}
            <div className="flex h-16 items-center gap-2 px-6 border-b border-slate-700">
                <span className="text-2xl">🧇</span>
                <span className="text-xl font-bold text-white">Waffles Admin</span>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
                {navigation.map((item) => {
                    const isActive =
                        pathname === item.href ||
                        (item.href !== "/admin" && pathname.startsWith(item.href));

                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={`
                group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200
                ${isActive
                                    ? "bg-purple-600 text-white shadow-lg shadow-purple-500/50"
                                    : "text-gray-300 hover:bg-slate-700/50 hover:text-white"
                                }
              `}
                        >
                            <item.icon className="mr-3 h-5 w-5 shrink-0" aria-hidden="true" />
                            {item.name}
                        </Link>
                    );
                })}
            </nav>

            {/* Logout */}
            <div className="border-t border-slate-700 p-3">
                <form action={logoutAdminAction}>
                    <button
                        type="submit"
                        className="group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-300 hover:bg-red-600/20 hover:text-red-400 transition-all duration-200"
                    >
                        <ArrowRightOnRectangleIcon className="mr-3 h-5 w-5 shrink-0" aria-hidden="true" />
                        Logout
                    </button>
                </form>
            </div>
        </div>
    );
}
