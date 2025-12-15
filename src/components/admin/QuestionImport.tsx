"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { parseQuestionCSV, generateCSVTemplate } from "@/lib/csv-parser";
import { bulkImportQuestionsAction, BulkImportQuestion } from "@/actions/admin/bulk-import";
import { ArrowUpTrayIcon, DocumentArrowDownIcon, CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";

interface QuestionImportProps {
    gameId: number;
}

export function QuestionImport({ gameId }: QuestionImportProps) {
    const router = useRouter();
    const [file, setFile] = useState<File | null>(null);
    const [parsing, setParsing] = useState(false);
    const [importing, setImporting] = useState(false);
    const [previewData, setPreviewData] = useState<BulkImportQuestion[] | null>(null);
    const [errors, setErrors] = useState<Array<{ row: number; field: string; message: string }> | null>(null);
    const [result, setResult] = useState<{ imported: number; skipped: number } | null>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        setFile(selectedFile);
        setErrors(null);
        setPreviewData(null);
        setResult(null);
        setParsing(true);

        try {
            const parseResult = await parseQuestionCSV(selectedFile);

            if (parseResult.success && parseResult.data) {
                setPreviewData(parseResult.data);
            } else if (parseResult.errors) {
                setErrors(parseResult.errors);
            }
        } catch (error) {
            setErrors([{ row: 0, field: "file", message: "Failed to parse CSV file" }]);
        } finally {
            setParsing(false);
        }
    };

    const handleImport = async () => {
        if (!previewData) return;

        setImporting(true);
        try {
            const importResult = await bulkImportQuestionsAction(gameId, previewData);

            if (importResult.success) {
                setResult({ imported: importResult.imported, skipped: importResult.skipped });
                setPreviewData(null);
                setFile(null);
                router.refresh(); // Refresh the page to show new questions
            } else {
                setErrors([{ row: 0, field: "import", message: importResult.error }]);
            }
        } catch (error) {
            setErrors([{ row: 0, field: "import", message: "Failed to import questions" }]);
        } finally {
            setImporting(false);
        }
    };

    const handleDownloadTemplate = () => {
        const csv = generateCSVTemplate();
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "questions_template.csv";
        link.click();
        URL.revokeObjectURL(url);
    };

    const handleReset = () => {
        setFile(null);
        setPreviewData(null);
        setErrors(null);
        setResult(null);
    };

    return (
        <div className="space-y-4">
            {/* Success Message */}
            {result && (
                <div className="bg-[#14B985]/20 border border-[#14B985]/30 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                        <CheckCircleIcon className="h-5 w-5 text-[#14B985] mt-0.5" />
                        <div>
                            <p className="text-[#14B985] font-medium">
                                Import successful!
                            </p>
                            <p className="text-sm text-white/60 mt-1">
                                {result.imported} question{result.imported !== 1 ? "s" : ""} imported
                                {result.skipped > 0 && `, ${result.skipped} skipped`}
                            </p>
                            <button
                                onClick={handleReset}
                                className="mt-2 text-sm text-[#14B985] hover:text-[#14B985]/80 font-medium"
                            >
                                Import more →
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Error Messages */}
            {errors && errors.length > 0 && (
                <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                        <XCircleIcon className="h-5 w-5 text-red-400 mt-0.5" />
                        <div className="flex-1">
                            <p className="text-red-400 font-medium">
                                {errors.length} error{errors.length !== 1 ? "s" : ""} found
                            </p>
                            <div className="mt-2 space-y-1 max-h-32 overflow-y-auto text-sm text-white/50">
                                {errors.slice(0, 5).map((error, idx) => (
                                    <p key={idx}>
                                        {error.row > 0 && `Row ${error.row}: `}
                                        {error.message}
                                    </p>
                                ))}
                                {errors.length > 5 && <p>...and {errors.length - 5} more</p>}
                            </div>
                            <button
                                onClick={handleReset}
                                className="mt-2 text-sm text-red-400 hover:text-red-300 font-medium"
                            >
                                Try again
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* File Upload */}
            {!previewData && !result && (
                <div className="space-y-3">
                    <label className="block">
                        <div className="border-2 border-dashed border-white/20 rounded-xl p-6 text-center hover:border-[#FFC931]/50 hover:bg-white/5 transition-colors cursor-pointer">
                            <input
                                type="file"
                                accept=".csv"
                                onChange={handleFileChange}
                                className="hidden"
                                disabled={parsing}
                            />
                            <div className="flex flex-col items-center gap-2">
                                {parsing ? (
                                    <div className="h-8 w-8 border-2 border-[#FFC931]/30 border-t-[#FFC931] rounded-full animate-spin" />
                                ) : (
                                    <ArrowUpTrayIcon className="h-8 w-8 text-white/40" />
                                )}
                                <p className="text-sm font-medium text-white">
                                    {parsing ? "Parsing..." : "Upload CSV"}
                                </p>
                            </div>
                        </div>
                    </label>
                    <button
                        onClick={handleDownloadTemplate}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm text-white/60 transition-colors"
                    >
                        <DocumentArrowDownIcon className="h-4 w-4" />
                        Download Template
                    </button>
                </div>
            )}

            {/* Preview */}
            {previewData && previewData.length > 0 && (
                <div className="space-y-3">
                    <div className="p-3 bg-[#FFC931]/10 border border-[#FFC931]/30 rounded-xl">
                        <p className="text-sm text-[#FFC931] font-medium">
                            {previewData.length} question{previewData.length !== 1 ? "s" : ""} ready to import
                        </p>
                    </div>

                    <div className="max-h-48 overflow-y-auto space-y-2">
                        {previewData.slice(0, 10).map((q, idx) => (
                            <div key={idx} className="p-3 bg-white/5 rounded-lg border border-white/10 text-sm">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs font-bold text-[#FFC931] bg-[#FFC931]/10 px-2 py-0.5 rounded-full">Q{q.roundIndex || idx + 1}</span>
                                    <span className="text-xs text-white/40">{q.durationSec}s</span>
                                </div>
                                <p className="text-white/80 truncate">{q.content}</p>
                            </div>
                        ))}
                        {previewData.length > 10 && (
                            <p className="text-center text-white/40 text-sm py-2">
                                +{previewData.length - 10} more questions
                            </p>
                        )}
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={handleReset}
                            className="flex-1 px-4 py-2.5 text-sm font-medium text-white/60 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleImport}
                            disabled={importing}
                            className="flex-1 px-4 py-2.5 bg-[#FFC931] text-black font-bold text-sm rounded-xl hover:bg-[#FFD966] disabled:opacity-50 transition-colors"
                        >
                            {importing ? "Importing..." : "Import All"}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

