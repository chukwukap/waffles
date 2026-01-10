import Link from "next/link";
import { QuestionTemplateForm } from "@/components/admin/QuestionTemplateForm";
import { createTemplateAction } from "@/actions/admin/question-templates";
import { ChevronLeftIcon } from "@heroicons/react/24/outline";

export default function CreateQuestionPage() {
    return (
        <div className="max-w-2xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link
                    href="/admin/questions"
                    className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                    <ChevronLeftIcon className="h-5 w-5" />
                </Link>
                <div>
                    <h1 className="text-xl font-bold text-white font-display">New Question</h1>
                    <p className="text-sm text-white/50">Add to your Question Bank</p>
                </div>
            </div>

            {/* Form Card */}
            <div className="bg-white/5 border border-white/8 rounded-2xl backdrop-blur-lg p-6">
                <QuestionTemplateForm
                    action={createTemplateAction}
                    submitLabel="Create Question"
                    redirectOnSuccess="/admin/questions"
                />
            </div>
        </div>
    );
}
