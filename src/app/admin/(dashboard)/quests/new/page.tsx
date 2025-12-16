import { QuestForm } from "@/components/admin/QuestForm";
import Link from "next/link";

export default function NewQuestPage() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link
                    href="/admin/quests"
                    className="text-[#99A0AE] hover:text-white transition-colors"
                >
                    ← Back
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-white">Create New Quest</h1>
                    <p className="text-[#99A0AE]">Add a new quest for waitlist users</p>
                </div>
            </div>

            <QuestForm />
        </div>
    );
}
