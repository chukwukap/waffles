"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { HomeIcon, LeaderboardIcon, ProfileIcon } from "./icons";

const navItems = [
  { icon: HomeIcon, label: "Lobby", href: "/game" },
  { icon: LeaderboardIcon, label: "Leaderboard", href: "/leaderboard" },
  { icon: ProfileIcon, label: "Profile", href: "/profile" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <footer
      className={cn(
        "border-t-2 border-border",
        "bg-[#0F0F10]",
        "shrink-0",
        "w-full"
      )}
    >
      <nav className="flex items-stretch justify-around w-full">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-1 px-4 py-3",
                "transition-colors duration-150 ease-in-out",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
              role="tab"
              aria-selected={isActive}
              aria-label={item.label}
            >
              <Icon
                className={cn("h-5 w-5", isActive && "animate-glow")}
                aria-hidden="true"
              />
              <span className="text-xs font-medium font-display">
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </footer>
  );
}
