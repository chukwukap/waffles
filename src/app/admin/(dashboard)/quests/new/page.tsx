import { QuestForm } from "@/components/admin/QuestForm";
import Link from "next/link";

export default function NewQuestPage() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link
                    href="/admin/quests"
                    className="text-white/40 hover:text-white transition-colors"
                >
                    ← Back
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-white font-display">Create New Quest</h1>
                    <p className="text-white/50">Add a new quest for waitlist users</p>
                </div>
            </div>

            <QuestForm />
        </div>
    );
}
