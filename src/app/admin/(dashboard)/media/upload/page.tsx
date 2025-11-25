"use client";

import { useState } from "react";
import Link from "next/link";
import { upload } from "@vercel/blob/client";
import { ArrowUpTrayIcon, XMarkIcon, CheckCircleIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";

interface UploadingFile {
    file: File;
    progress: number;
    url?: string;
    error?: string;
}

export default function MediaUploadPage() {
    const router = useRouter();
    const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
    const [isDragging, setIsDragging] = useState(false);

    const handleFiles = async (files: FileList | null) => {
        if (!files || files.length === 0) return;

        const newFiles = Array.from(files).map(file => ({
            file,
            progress: 0,
        }));

        setUploadingFiles(prev => [...prev, ...newFiles]);

        // Upload each file
        for (let i = 0; i < newFiles.length; i++) {
            const fileItem = newFiles[i];
            const indexInState = uploadingFiles.length + i;

            try {
                // Generate unique filename with timestamp to avoid conflicts
                const timestamp = Date.now();
                const fileName = `${timestamp}-${fileItem.file.name}`;

                const blob = await upload(fileName, fileItem.file, {
                    access: "public",
                    handleUploadUrl: "/api/upload",
                });

                setUploadingFiles(prev => {
                    const updated = [...prev];
                    updated[indexInState] = {
                        ...updated[indexInState],
                        progress: 100,
                        url: blob.url,
                    };
                    return updated;
                });
            } catch (error) {
                console.error("Upload error:", error);
                const errorMessage = error instanceof Error ? error.message : "Upload failed";

                setUploadingFiles(prev => {
                    const updated = [...prev];
                    updated[indexInState] = {
                        ...updated[indexInState],
                        error: errorMessage,
                    };
                    return updated;
                });
            }
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        handleFiles(e.dataTransfer.files);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const removeFile = (index: number) => {
        setUploadingFiles(prev => prev.filter((_, i) => i !== index));
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return bytes + " B";
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
        return (bytes / (1024 * 1024)).toFixed(1) + " MB";
    };

    const allCompleted = uploadingFiles.length > 0 && uploadingFiles.every(f => f.url || f.error);

    return (
        <div className="max-w-4xl space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link
                        href="/admin/media"
                        className="text-slate-400 hover:text-slate-100 font-medium"
                    >
                        ← Back
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-100 font-display">Upload Media</h1>
                        <p className="text-slate-400 mt-1">Upload images, audio, or video files</p>
                    </div>
                </div>
                {allCompleted && (
                    <button
                        onClick={() => router.push("/admin/media")}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg shadow-sm transition-colors"
                    >
                        Done
                    </button>
                )}
            </div>

            <div className="bg-slate-800 rounded-xl shadow-sm border border-slate-700 p-6 space-y-6">
                {/* Upload Area */}
                <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${isDragging
                        ? "border-purple-500 bg-purple-50"
                        : "border-slate-600 hover:border-purple-400 hover:bg-purple-50/50"
                        }`}
                >
                    <input
                        type="file"
                        multiple
                        accept="image/*,audio/*,video/*"
                        onChange={(e) => handleFiles(e.target.files)}
                        className="hidden"
                        id="file-upload"
                    />
                    <label htmlFor="file-upload" className="cursor-pointer">
                        <div className="flex flex-col items-center gap-4">
                            <div className="h-16 w-16 rounded-full bg-purple-100 flex items-center justify-center">
                                <ArrowUpTrayIcon className="h-8 w-8 text-purple-600" />
                            </div>
                            <div>
                                <div className="text-lg font-medium text-slate-100">
                                    Click to upload or drag and drop
                                </div>
                                <div className="text-sm text-slate-400 mt-1">
                                    Images, Audio, or Video files
                                </div>
                                <div className="text-xs text-slate-400 mt-2">
                                    Supported: JPG, PNG, GIF, WebP, SVG, MP3, WAV, OGG, MP4, WebM
                                </div>
                            </div>
                        </div>
                    </label>
                </div>

                {/* Uploading Files List */}
                {uploadingFiles.length > 0 && (
                    <div className="space-y-3">
                        <h3 className="text-sm font-medium text-slate-300">
                            {uploadingFiles.filter(f => f.url).length} of {uploadingFiles.length} uploaded
                        </h3>
                        {uploadingFiles.map((item, index) => (
                            <div
                                key={index}
                                className="flex items-center gap-4 p-4 bg-slate-900 rounded-lg"
                            >
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium text-slate-100 truncate">
                                        {item.file.name}
                                    </div>
                                    <div className="text-xs text-slate-400">
                                        {formatFileSize(item.file.size)}
                                    </div>
                                    {item.error && (
                                        <div className="text-xs text-red-600 mt-1">{item.error}</div>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    {item.url ? (
                                        <CheckCircleIcon className="h-5 w-5 text-green-600" />
                                    ) : item.error ? (
                                        <div className="text-red-600 text-xs">Failed</div>
                                    ) : (
                                        <div className="h-5 w-5 border-2 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
                                    )}
                                    <button
                                        onClick={() => removeFile(index)}
                                        className="p-1 hover:bg-slate-200 rounded transition-colors"
                                    >
                                        <XMarkIcon className="h-4 w-4 text-slate-400" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
