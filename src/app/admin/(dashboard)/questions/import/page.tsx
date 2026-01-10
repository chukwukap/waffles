"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    bulkImportTemplatesAction,
    BulkTemplateInput,
} from "@/actions/admin/question-templates";
import {
    ChevronLeftIcon,
    ArrowUpTrayIcon,
    DocumentArrowDownIcon,
    CheckCircleIcon,
    XCircleIcon,
} from "@heroicons/react/24/outline";

// CSV Template
const CSV_HEADER = "content,optionA,optionB,optionC,optionD,correctAnswer,durationSec,theme,difficulty,mediaUrl";
const CSV_EXAMPLE = `"What year did Bitcoin launch?","2008","2009","2010","2011","B","10","CRYPTO","MEDIUM",""
"Guess the movie","Option A","Option B","Option C","The Godfather","D","10","MOVIES","EASY","https://example.com/image.jpg"`;

function generateCSVTemplate(): string {
    return `${CSV_HEADER}\n${CSV_EXAMPLE}`;
}

function parseCSV(text: string): { data: BulkTemplateInput[]; errors: string[] } {
    const lines = text.trim().split("\n");
    const data: BulkTemplateInput[] = [];
    const errors: string[] = [];

    // Skip header
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        try {
            // Simple CSV parse (handles quoted values)
            const values: string[] = [];
            let current = "";
            let inQuotes = false;

            for (const char of line) {
                if (char === '"') {
                    inQuotes = !inQuotes;
                } else if (char === "," && !inQuotes) {
                    values.push(current.trim());
                    current = "";
                } else {
                    current += char;
                }
            }
            values.push(current.trim());

            if (values.length < 6) {
                errors.push(`Row ${i + 1}: Not enough columns`);
                continue;
            }

            const [content, optA, optB, optC, optD, correct, duration, theme, difficulty, mediaUrl] = values;

            // Validate correct answer
            const correctIndex = ["A", "B", "C", "D"].indexOf(correct.toUpperCase());
            if (correctIndex === -1) {
                errors.push(`Row ${i + 1}: Invalid correct answer "${correct}"`);
                continue;
            }

            data.push({
                content: content.replace(/^"|"$/g, ""),
                options: [optA, optB, optC, optD].map((o) => o.replace(/^"|"$/g, "")),
                correctIndex,
                durationSec: parseInt(duration) || 10,
                theme: (theme as any) || "GENERAL",
                difficulty: (difficulty as any) || "MEDIUM",
                mediaUrl: mediaUrl?.replace(/^"|"$/g, "") || "",
            });
        } catch (e) {
            errors.push(`Row ${i + 1}: Parse error`);
        }
    }

    return { data, errors };
}

export default function ImportQuestionsPage() {
    const router = useRouter();
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<BulkTemplateInput[] | null>(null);
    const [parseErrors, setParseErrors] = useState<string[]>([]);
    const [isImporting, setIsImporting] = useState(false);
    const [result, setResult] = useState<{ imported: number; skipped: number } | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        setFile(selectedFile);
        setParseErrors([]);
        setPreview(null);
        setResult(null);
        setError(null);

        try {
            const text = await selectedFile.text();
            const { data, errors } = parseCSV(text);

            if (errors.length > 0) {
                setParseErrors(errors);
            }

            if (data.length > 0) {
                setPreview(data);
            }
        } catch (e) {
            setError("Failed to read file");
        }
    };

    const handleImport = async () => {
        if (!preview) return;

        setIsImporting(true);
        setError(null);

        try {
            const importResult = await bulkImportTemplatesAction(preview);

            if (importResult.success) {
                setResult({ imported: importResult.imported, skipped: importResult.skipped });
                setPreview(null);
                setFile(null);
            } else {
                setError(importResult.error);
            }
        } catch (e) {
            setError("Import failed");
        } finally {
            setIsImporting(false);
        }
    };

    const handleDownloadTemplate = () => {
        const csv = generateCSVTemplate();
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "question_bank_template.csv";
        link.click();
        URL.revokeObjectURL(url);
    };

    const handleReset = () => {
        setFile(null);
        setPreview(null);
        setParseErrors([]);
        setResult(null);
        setError(null);
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link
                    href="/admin/questions"
                    className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                    <ChevronLeftIcon className="h-5 w-5" />
                </Link>
                <div>
                    <h1 className="text-xl font-bold text-white font-display">Import Questions</h1>
                    <p className="text-sm text-white/50">Bulk add to your Question Bank</p>
                </div>
            </div>

            {/* Success State */}
            {result && (
                <div className="bg-[#14B985]/20 border border-[#14B985]/30 rounded-2xl p-6">
                    <div className="flex items-start gap-4">
                        <div className="p-3 rounded-full bg-[#14B985]/20">
                            <CheckCircleIcon className="h-8 w-8 text-[#14B985]" />
                        </div>
                        <div className="flex-1">
                            <h2 className="text-xl font-bold text-[#14B985]">Import Successful!</h2>
                            <p className="text-white/60 mt-1">
                                <span className="text-[#14B985] font-bold">{result.imported}</span> questions imported
                                {result.skipped > 0 && (
                                    <span className="text-white/40"> • {result.skipped} skipped</span>
                                )}
                            </p>
                            <div className="flex gap-3 mt-4">
                                <Link
                                    href="/admin/questions"
                                    className="px-4 py-2 bg-[#14B985] text-black font-bold rounded-lg text-sm hover:bg-[#14B985]/80 transition-colors"
                                >
                                    View Question Bank
                                </Link>
                                <button
                                    onClick={handleReset}
                                    className="px-4 py-2 bg-white/5 text-white/60 font-medium rounded-lg text-sm hover:bg-white/10 hover:text-white transition-colors"
                                >
                                    Import More
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Error State */}
            {error && (
                <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                        <XCircleIcon className="h-5 w-5 text-red-400" />
                        <p className="text-red-400">{error}</p>
                    </div>
                </div>
            )}

            {/* Upload Section */}
            {!result && (
                <div className="bg-white/5 border border-white/8 rounded-2xl backdrop-blur-lg overflow-hidden">
                    {/* Instructions */}
                    <div className="p-6 border-b border-white/10">
                        <h2 className="font-semibold text-white mb-3">CSV Format</h2>
                        <p className="text-sm text-white/50 mb-4">
                            Your CSV should have these columns:
                        </p>
                        <div className="bg-black/30 rounded-lg p-3 font-mono text-xs text-white/70 overflow-x-auto">
                            {CSV_HEADER}
                        </div>
                        <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                            <div>
                                <span className="text-white/30">correctAnswer:</span>
                                <span className="text-white/60 ml-1">A, B, C, or D</span>
                            </div>
                            <div>
                                <span className="text-white/30">theme:</span>
                                <span className="text-white/60 ml-1">GENERAL, CRYPTO, MOVIES, etc.</span>
                            </div>
                            <div>
                                <span className="text-white/30">difficulty:</span>
                                <span className="text-white/60 ml-1">EASY, MEDIUM, HARD</span>
                            </div>
                            <div>
                                <span className="text-white/30">mediaUrl:</span>
                                <span className="text-white/60 ml-1">image URL</span>
                            </div>
                        </div>
                    </div>

                    {/* Upload Area */}
                    <div className="p-6">
                        {!preview ? (
                            <div className="space-y-4">
                                <label className="block">
                                    <div className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center hover:border-[#FFC931]/50 hover:bg-white/5 transition-colors cursor-pointer">
                                        <input
                                            type="file"
                                            accept=".csv"
                                            onChange={handleFileChange}
                                            className="hidden"
                                        />
                                        <ArrowUpTrayIcon className="h-10 w-10 text-white/30 mx-auto mb-3" />
                                        <p className="text-white font-medium">Drop CSV file here</p>
                                        <p className="text-white/40 text-sm mt-1">or click to browse</p>
                                    </div>
                                </label>

                                <button
                                    onClick={handleDownloadTemplate}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white/60 hover:text-white transition-colors"
                                >
                                    <DocumentArrowDownIcon className="h-5 w-5" />
                                    Download Template CSV
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {/* Parse Errors */}
                                {parseErrors.length > 0 && (
                                    <div className="bg-amber-500/20 border border-amber-500/30 rounded-lg p-3">
                                        <p className="text-amber-400 text-sm font-medium mb-2">
                                            {parseErrors.length} warning(s)
                                        </p>
                                        <ul className="text-xs text-white/50 space-y-1 max-h-20 overflow-y-auto">
                                            {parseErrors.slice(0, 5).map((err, i) => (
                                                <li key={i}>{err}</li>
                                            ))}
                                            {parseErrors.length > 5 && <li>...and {parseErrors.length - 5} more</li>}
                                        </ul>
                                    </div>
                                )}

                                {/* Preview */}
                                <div className="bg-[#FFC931]/10 border border-[#FFC931]/30 rounded-lg p-4">
                                    <p className="text-[#FFC931] font-bold text-lg">
                                        {preview.length} questions ready
                                    </p>
                                    <p className="text-white/50 text-sm mt-1">
                                        From: {file?.name}
                                    </p>
                                </div>

                                {/* Preview List */}
                                <div className="max-h-60 overflow-y-auto space-y-2">
                                    {preview.slice(0, 5).map((q, i) => (
                                        <div
                                            key={i}
                                            className="p-3 bg-white/5 rounded-lg border border-white/10"
                                        >
                                            <p className="text-white text-sm truncate">{q.content}</p>
                                            <div className="flex gap-2 mt-1 text-xs text-white/40">
                                                <span className="px-1.5 py-0.5 rounded bg-white/5">{q.theme}</span>
                                                <span className="px-1.5 py-0.5 rounded bg-white/5">{q.difficulty}</span>
                                                <span>Answer: {String.fromCharCode(65 + q.correctIndex)}</span>
                                            </div>
                                        </div>
                                    ))}
                                    {preview.length > 5 && (
                                        <p className="text-center text-white/30 text-sm py-2">
                                            +{preview.length - 5} more questions
                                        </p>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="flex gap-3 pt-2">
                                    <button
                                        onClick={handleReset}
                                        className="flex-1 px-4 py-3 bg-white/5 text-white/60 font-medium rounded-xl hover:bg-white/10 hover:text-white transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleImport}
                                        disabled={isImporting}
                                        className="flex-1 px-4 py-3 bg-[#FFC931] text-black font-bold rounded-xl hover:bg-[#FFD966] disabled:opacity-50 transition-colors"
                                    >
                                        {isImporting ? "Importing..." : `Import ${preview.length} Questions`}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
