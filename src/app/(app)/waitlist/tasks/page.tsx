"use client"

import { SubHeader } from "@/components/ui/SubHeader";
import { TasksPageClient } from "./client";

export default function TasksPage() {
    return (
        <div className="flex flex-col min-h-screen bg-linear-to-b from-[#0F0F2E] to-[#1a1a40]">
            <SubHeader
                title="TASKS"
                className="h-[52px]"
            />
            <TasksPageClient />
        </div>
    );
}
