"use client";

import { useState } from "react";
import Link from "next/link";
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
                // Upload via our API using FormData
                const formData = new FormData();
                formData.append("file", fileItem.file);
                formData.append("folder", "media");

                const response = await fetch("/api/upload", {
                    method: "POST",
                    body: formData,
                });

                if (!response.ok) {
                    const data = await response.json();
                    throw new Error(data.error || "Upload failed");
                }

                const data = await response.json();

                setUploadingFiles(prev => {
                    const updated = [...prev];
                    updated[indexInState] = {
                        ...updated[indexInState],
                        progress: 100,
                        url: data.url,
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
                        className="text-white/50 hover:text-[#FFC931] font-medium transition-colors"
                    >
                        ← Back
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-white font-display">Upload Media</h1>
                        <p className="text-white/60 mt-1">Upload images, audio, or video files</p>
                    </div>
                </div>
                {allCompleted && (
                    <button
                        onClick={() => router.push("/admin/media")}
                        className="px-5 py-2.5 bg-[#14B985] hover:bg-[#1ad9a3] text-white font-bold rounded-xl shadow-lg transition-colors"
                    >
                        ✓ Done
                    </button>
                )}
            </div>

            <div className="bg-white/5 border border-white/[0.08] rounded-2xl backdrop-blur-lg p-6 space-y-6">
                {/* Upload Area */}
                <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all ${isDragging
                        ? "border-[#FFC931] bg-[#FFC931]/10"
                        : "border-white/20 hover:border-[#FFC931]/50 hover:bg-white/5"
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
                            <div className="h-16 w-16 rounded-2xl bg-[#FFC931]/20 flex items-center justify-center">
                                <ArrowUpTrayIcon className="h-8 w-8 text-[#FFC931]" />
                            </div>
                            <div>
                                <div className="text-lg font-medium text-white font-display">
                                    Click to upload or drag and drop
                                </div>
                                <div className="text-sm text-white/50 mt-1">
                                    Images, Audio, or Video files
                                </div>
                                <div className="text-xs text-white/40 mt-2">
                                    Supported: JPG, PNG, GIF, WebP, SVG, MP3, WAV, OGG, MP4, WebM
                                </div>
                            </div>
                        </div>
                    </label>
                </div>

                {/* Uploading Files List */}
                {uploadingFiles.length > 0 && (
                    <div className="space-y-3">
                        <h3 className="text-sm font-medium text-white/50 font-display">
                            <span className="text-[#FFC931]">{uploadingFiles.filter(f => f.url).length}</span> of {uploadingFiles.length} uploaded
                        </h3>
                        {uploadingFiles.map((item, index) => (
                            <div
                                key={index}
                                className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/10"
                            >
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium text-white truncate">
                                        {item.file.name}
                                    </div>
                                    <div className="text-xs text-white/50">
                                        {formatFileSize(item.file.size)}
                                    </div>
                                    {item.error && (
                                        <div className="text-xs text-red-400 mt-1">{item.error}</div>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    {item.url ? (
                                        <CheckCircleIcon className="h-5 w-5 text-[#14B985]" />
                                    ) : item.error ? (
                                        <div className="text-red-400 text-xs">Failed</div>
                                    ) : (
                                        <div className="h-5 w-5 border-2 border-white/20 border-t-[#FFC931] rounded-full animate-spin" />
                                    )}
                                    <button
                                        onClick={() => removeFile(index)}
                                        className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                                    >
                                        <XMarkIcon className="h-4 w-4 text-white/50 hover:text-white" />
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
