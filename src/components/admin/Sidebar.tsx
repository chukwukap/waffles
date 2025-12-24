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
    StarIcon,
    RectangleGroupIcon,
    BellIcon,
} from "@heroicons/react/24/outline";
import { WaffleIcon } from "@/components/icons";

const navigation = [
    { name: "Dashboard", href: "/admin", icon: HomeIcon },
    { name: "Games", href: "/admin/games", icon: TrophyIcon },
    { name: "Users", href: "/admin/users", icon: UsersIcon },
    { name: "Notifications", href: "/admin/notifications", icon: BellIcon },
    { name: "Invite Codes", href: "/admin/invite-codes", icon: TicketIcon },
    { name: "Quests", href: "/admin/quests", icon: StarIcon },
    { name: "Tickets", href: "/admin/tickets", icon: RectangleGroupIcon },
    { name: "Media Library", href: "/admin/media", icon: PhotoIcon },
    { name: "Analytics", href: "/admin/analytics", icon: ChartBarIcon },
    { name: "Audit Logs", href: "/admin/logs", icon: DocumentTextIcon },
    { name: "Settings", href: "/admin/settings", icon: Cog6ToothIcon },
];

export function AdminSidebar() {
    const pathname = usePathname();

    return (
        <div className="flex h-full flex-col bg-linear-to-b from-[#0a0a0b]/95 to-black/98 border-r border-white/6">
            {/* Logo */}
            <div className="flex h-16 items-center gap-3 px-6 border-b border-white/6">
                <WaffleIcon className="h-6 w-6" />
                <span className="text-lg font-bold text-white font-display tracking-wide">
                    WAFFLES ADMIN
                </span>
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
                                    ? "bg-[#FFC931]/15 text-[#FFC931] border-l-3 border-[#FFC931] shadow-[0_0_20px_rgba(255,201,49,0.1)]"
                                    : "text-white/70 hover:bg-white/5 hover:text-white border-l-3 border-transparent"
                                }
                            `}
                        >
                            <item.icon
                                className={`h-5 w-5 shrink-0 ${isActive ? "text-[#FFC931]" : ""}`}
                                aria-hidden="true"
                            />
                            <span className="font-display">{item.name}</span>
                        </Link>
                    );
                })}
            </nav>

            {/* Logout */}
            <div className="border-t border-white/6 p-3">
                <form action={logoutAdminAction}>
                    <button
                        type="submit"
                        className="group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/60 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200"
                    >
                        <ArrowRightOnRectangleIcon className="h-5 w-5 shrink-0" aria-hidden="true" />
                        <span className="font-display">Logout</span>
                    </button>
                </form>
            </div>
        </div>
    );
}

