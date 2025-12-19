"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { CalendarIcon } from "@heroicons/react/24/outline";
import { DATE_PRESETS } from "./dateUtils";

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
        <div className="bg-white/5 border border-white/[0.08] rounded-2xl backdrop-blur-lg p-2 inline-flex items-center gap-1">
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
