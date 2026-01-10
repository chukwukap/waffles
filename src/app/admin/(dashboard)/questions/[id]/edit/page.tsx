import { prisma } from "@/lib/db";
import Link from "next/link";
import { notFound } from "next/navigation";
import { QuestionTemplateForm } from "@/components/admin/QuestionTemplateForm";
import { updateTemplateAction } from "@/actions/admin/question-templates";
import { ChevronLeftIcon } from "@heroicons/react/24/outline";

export default async function EditQuestionPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;

    const template = await prisma.questionTemplate.findUnique({
        where: { id },
    });

    if (!template) {
        notFound();
    }

    // Bind templateId to the action
    const boundAction = updateTemplateAction.bind(null, id);

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
                    <h1 className="text-xl font-bold text-white font-display">Edit Question</h1>
                    <p className="text-sm text-white/50">
                        Used in <span className="text-[#FFC931]">{template.usageCount}</span> games
                    </p>
                </div>
            </div>

            {/* Form Card */}
            <div className="bg-white/5 border border-white/8 rounded-2xl backdrop-blur-lg p-6">
                <QuestionTemplateForm
                    action={boundAction}
                    defaultValues={{
                        content: template.content,
                        options: template.options,
                        correctIndex: template.correctIndex,
                        durationSec: template.durationSec,
                        theme: template.theme,
                        difficulty: template.difficulty,
                        mediaUrl: template.mediaUrl,
                        soundUrl: template.soundUrl,
                    }}
                    submitLabel="Save Changes"
                    redirectOnSuccess="/admin/questions"
                />
            </div>
        </div>
    );
}
