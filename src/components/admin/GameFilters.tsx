"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";
import { MagnifyingGlassIcon, FunnelIcon } from "@heroicons/react/24/outline";

export function GameFilters() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const handleSearch = useDebouncedCallback((term: string) => {
        const params = new URLSearchParams(searchParams);
        if (term) {
            params.set("search", term);
        } else {
            params.delete("search");
        }
        params.set("page", "1"); // Reset to first page on search
        router.replace(`?${params.toString()}`);
    }, 300);

    const handleStatusChange = (status: string) => {
        const params = new URLSearchParams(searchParams);
        if (status) {
            params.set("status", status);
        } else {
            params.delete("status");
        }
        params.set("page", "1");
        router.replace(`?${params.toString()}`);
    };

    return (
        <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="relative flex-1">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                    type="text"
                    placeholder="Search games by title..."
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    defaultValue={searchParams.get("search")?.toString()}
                    onChange={(e) => handleSearch(e.target.value)}
                />
            </div>
            <div className="flex items-center gap-2">
                <FunnelIcon className="h-5 w-5 text-slate-400" />
                <select
                    className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                    defaultValue={searchParams.get("status")?.toString() || ""}
                    onChange={(e) => handleStatusChange(e.target.value)}
                >
                    <option value="">All Statuses</option>
                    <option value="SCHEDULED">Scheduled</option>
                    <option value="LIVE">Live</option>
                    <option value="ENDED">Ended</option>
                    <option value="CANCELLED">Cancelled</option>
                </select>
            </div>
        </div>
    );
}
