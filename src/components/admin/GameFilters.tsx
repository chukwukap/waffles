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
        params.set("page", "1");
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
        <div className="bg-white/5 border border-white/[0.08] rounded-2xl backdrop-blur-lg p-4">
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40" />
                    <input
                        type="text"
                        placeholder="Search games by title..."
                        className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:ring-2 focus:ring-[#FFC931]/50 focus:border-[#FFC931] transition-all"
                        defaultValue={searchParams.get("search")?.toString()}
                        onChange={(e) => handleSearch(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-3">
                    <FunnelIcon className="h-5 w-5 text-white/40" />
                    <select
                        className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-[#FFC931]/50 focus:border-[#FFC931] transition-all"
                        defaultValue={searchParams.get("status")?.toString() || ""}
                        onChange={(e) => handleStatusChange(e.target.value)}
                    >
                        <option value="" className="bg-[#0a0a0b]">All Statuses</option>
                        <option value="SCHEDULED" className="bg-[#0a0a0b]">Scheduled</option>
                        <option value="LIVE" className="bg-[#0a0a0b]">Live</option>
                        <option value="ENDED" className="bg-[#0a0a0b]">Ended</option>
                        <option value="CANCELLED" className="bg-[#0a0a0b]">Cancelled</option>
                    </select>
                </div>
            </div>
        </div>
    );
}

