"use client"

import { SubHeader } from "@/components/ui/SubHeader";
import { TasksPageClient } from "./client";
import { useRouter } from "next/navigation";

export default function TasksPage() {
    const router = useRouter();

    return <section className="flex-1 overflow-y-auto pb-8">

        <div className="sticky top-0 z-50 w-full backdrop-blur-md mb-2">
            <SubHeader
                title="TASKS"
                onBack={() => router.back()}
                className="h-[52px]"
                backButtonClassName="bg-transparent hover:bg-white/10"
            />
        </div>
        <TasksPageClient />
    </section>

}
