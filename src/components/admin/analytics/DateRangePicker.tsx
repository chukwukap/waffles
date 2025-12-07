"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { CalendarIcon } from "@heroicons/react/24/outline";

const DATE_PRESETS = [
    { label: "7D", value: "7d", days: 7 },
    { label: "14D", value: "14d", days: 14 },
    { label: "30D", value: "30d", days: 30 },
    { label: "90D", value: "90d", days: 90 },
    { label: "All", value: "all", days: null },
];

interface DateRangePickerProps {
    currentRange: string;
}

export function DateRangePicker({ currentRange }: DateRangePickerProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const handleRangeChange = (range: string) => {
        const params = new URLSearchParams(searchParams);
        params.set("range", range);
        router.push(`?${params.toString()}`);
    };

    return (
        <div className="admin-panel p-2 inline-flex items-center gap-1">
            <CalendarIcon className="h-4 w-4 text-white/40 ml-2 mr-1" />
            {DATE_PRESETS.map((preset) => (
                <button
                    key={preset.value}
                    onClick={() => handleRangeChange(preset.value)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${currentRange === preset.value
                            ? "bg-[#FFC931] text-black font-bold shadow-lg shadow-[#FFC931]/20"
                            : "text-white/60 hover:text-white hover:bg-white/5"
                        }`}
                >
                    {preset.label}
                </button>
            ))}
        </div>
    );
}

export function getDateRangeFromParam(range: string): { start: Date; end: Date; label: string } {
    const end = new Date();
    const preset = DATE_PRESETS.find((p) => p.value === range) || DATE_PRESETS[0];

    if (preset.days === null) {
        // All time - start from Jan 1, 2024
        return {
            start: new Date("2024-01-01"),
            end,
            label: "All Time",
        };
    }

    const start = new Date(end.getTime() - preset.days * 24 * 60 * 60 * 1000);
    return {
        start,
        end,
        label: `Last ${preset.days} days`,
    };
}
