"use client";

import { useState } from "react";
import { parseQuestionCSV, generateCSVTemplate } from "@/lib/csv-parser";
import { bulkImportQuestionsAction, BulkImportQuestion } from "@/actions/admin/bulk-import";
import { ArrowUpTrayIcon, DocumentArrowDownIcon, CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";

interface QuestionImportProps {
    gameId: number;
    onSuccess?: () => void;
}

export function QuestionImport({ gameId, onSuccess }: QuestionImportProps) {
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
                onSuccess?.();
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
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold text-slate-100 font-display">
                        Bulk Import Questions
                    </h3>
                    <p className="text-sm text-slate-400 mt-1">
                        Upload a CSV file to add multiple questions at once
                    </p>
                </div>
                <button
                    onClick={handleDownloadTemplate}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-200 rounded-lg text-sm font-medium text-slate-300 transition-colors"
                >
                    <DocumentArrowDownIcon className="h-4 w-4" />
                    Download Template
                </button>
            </div>

            {/* Success Message */}
            {result && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                        <CheckCircleIcon className="h-5 w-5 text-green-600 mt-0.5" />
                        <div>
                            <p className="text-green-800 font-medium">
                                Import successful!
                            </p>
                            <p className="text-sm text-green-700 mt-1">
                                {result.imported} question{result.imported !== 1 ? "s" : ""} imported
                                {result.skipped > 0 && `, ${result.skipped} skipped due to errors`}
                            </p>
                            <button
                                onClick={handleReset}
                                className="mt-3 text-sm text-green-700 hover:text-green-800 font-medium"
                            >
                                Import more questions →
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Error Messages */}
            {errors && errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                        <XCircleIcon className="h-5 w-5 text-red-600 mt-0.5" />
                        <div className="flex-1">
                            <p className="text-red-800 font-medium">
                                Found {errors.length} error{errors.length !== 1 ? "s" : ""}
                            </p>
                            <div className="mt-2 space-y-1 max-h-48 overflow-y-auto">
                                {errors.map((error, idx) => (
                                    <p key={idx} className="text-sm text-red-700">
                                        {error.row > 0 && `Row ${error.row}: `}
                                        {error.field && `${error.field} - `}
                                        {error.message}
                                    </p>
                                ))}
                            </div>
                            <button
                                onClick={handleReset}
                                className="mt-3 text-sm text-red-700 hover:text-red-800 font-medium"
                            >
                                Try again
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* File Upload */}
            {!previewData && !result && (
                <div className="bg-slate-800 rounded-xl shadow-sm border border-slate-700 p-6">
                    <label className="block">
                        <div className="border-2 border-dashed border-slate-600 rounded-xl p-8 text-center hover:border-purple-500 hover:bg-purple-900/30 transition-colors cursor-pointer">
                            <input
                                type="file"
                                accept=".csv"
                                onChange={handleFileChange}
                                className="hidden"
                                disabled={parsing}
                            />
                            <div className="flex flex-col items-center gap-3">
                                {parsing ? (
                                    <div className="h-12 w-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
                                ) : (
                                    <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                                        <ArrowUpTrayIcon className="h-6 w-6" />
                                    </div>
                                )}
                                <div>
                                    <p className="text-sm font-medium text-slate-100">
                                        {parsing ? "Parsing..." : "Click to upload CSV file"}
                                    </p>
                                    <p className="text-xs text-slate-400 mt-1">
                                        {parsing ? "Please wait" : "or drag and drop"}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </label>
                </div>
            )}

            {/* Preview Table */}
            {previewData && previewData.length > 0 && (
                <div className="bg-slate-800 rounded-xl shadow-sm border border-slate-700 overflow-hidden">
                    <div className="p-4 border-b border-slate-700 bg-slate-900">
                        <p className="text-sm font-medium text-slate-100">
                            Preview: {previewData.length} question{previewData.length !== 1 ? "s" : ""} ready to import
                        </p>
                    </div>
                    <div className="overflow-x-auto max-h-96">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-900 sticky top-0">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-400">#</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-400">Question</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-400">Options</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-400">Answer</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-400">Duration</th>
                                </tr>
                            </thead>
                            <tbody>
                                {previewData.map((question, idx) => (
                                    <tr key={idx} className="border-t border-slate-700 hover:bg-slate-700">
                                        <td className="px-4 py-2 text-slate-400">{idx + 1}</td>
                                        <td className="px-4 py-2 text-slate-100 max-w-md">
                                            <div className="truncate">{question.content}</div>
                                        </td>
                                        <td className="px-4 py-2 text-slate-300 text-xs">
                                            <div className="space-y-0.5">
                                                {question.options.map((option, optIdx) => (
                                                    <div key={optIdx} className={optIdx === question.correctIndex ? "font-semibold text-green-700" : ""}>
                                                        {optIdx}: {option}
                                                    </div>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-4 py-2">
                                            <span className="px-2 py-1 bg-green-100 text-green-700 rounded font-medium">
                                                #{question.correctIndex}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2 text-slate-400">{question.durationSec}s</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="p-4 border-t border-slate-700 bg-slate-900 flex items-center justify-between">
                        <button
                            onClick={handleReset}
                            className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-slate-100"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleImport}
                            disabled={importing}
                            className="px-6 py-2 bg-linear-to-r from-purple-600 to-pink-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-colors"
                        >
                            {importing ? "Importing..." : `Import ${previewData.length} Question${previewData.length !== 1 ? "s" : ""}`}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
