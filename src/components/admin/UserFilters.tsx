"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";

export function UserFilters() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const handleSearch = useDebouncedCallback((term: string) => {
        const params = new URLSearchParams(searchParams);
        if (term) {
            params.set("q", term);
        } else {
            params.delete("q");
        }
        router.replace(`?${params.toString()}`);
    }, 300);

    const handleRoleChange = (role: string) => {
        const params = new URLSearchParams(searchParams);
        if (role) {
            params.set("role", role);
        } else {
            params.delete("role");
        }
        router.replace(`?${params.toString()}`);
    };

    const handleStatusChange = (status: string) => {
        const params = new URLSearchParams(searchParams);
        if (status) {
            params.set("status", status);
        } else {
            params.delete("status");
        }
        router.replace(`?${params.toString()}`);
    };

    return (
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                    type="text"
                    placeholder="Search users by name or wallet..."
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    defaultValue={searchParams.get("q")?.toString()}
                    onChange={(e) => handleSearch(e.target.value)}
                />
            </div>
            <select
                className="px-4 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                defaultValue={searchParams.get("role")?.toString()}
                onChange={(e) => handleRoleChange(e.target.value)}
            >
                <option value="">All Roles</option>
                <option value="USER">User</option>
                <option value="ADMIN">Admin</option>
            </select>
            <select
                className="px-4 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                defaultValue={searchParams.get("status")?.toString()}
                onChange={(e) => handleStatusChange(e.target.value)}
            >
                <option value="">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="WAITLIST">Waitlist</option>
                <option value="BANNED">Banned</option>
            </select>
        </div>
    );
}
