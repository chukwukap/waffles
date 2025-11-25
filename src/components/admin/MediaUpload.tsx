"use client";

import { useState, useRef } from "react";
import { upload } from "@vercel/blob/client";
import { PhotoIcon, XMarkIcon, ArrowUpTrayIcon, MusicalNoteIcon } from "@heroicons/react/24/outline";
import Image from "next/image";

interface MediaUploadProps {
    label: string;
    name: string;
    defaultValue?: string | null;
    required?: boolean;
    accept?: string;
    maxSizeMB?: number;
}

export function MediaUpload({
    label,
    name,
    defaultValue,
    required = false,
    accept = "image/*",
    maxSizeMB = 5,
}: MediaUploadProps) {
    const [preview, setPreview] = useState<string | null>(defaultValue || null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate size
        if (file.size > maxSizeMB * 1024 * 1024) {
            setError(`File size must be less than ${maxSizeMB}MB`);
            return;
        }

        setError(null);
        setUploading(true);

        try {
            const newBlob = await upload(file.name, file, {
                access: "public",
                handleUploadUrl: "/api/upload",
            });

            setPreview(newBlob.url);
        } catch (err) {
            console.error("Upload failed:", err);
            setError("Failed to upload file. Please try again.");
        } finally {
            setUploading(false);
        }
    };

    const handleRemove = () => {
        setPreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const isAudio = accept.includes("audio");
    const isVideo = accept.includes("video");

    return (
        <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-300">
                {label} {required && "*"}
            </label>

            {/* Hidden input for form submission */}
            <input type="hidden" name={name} value={preview || ""} />

            {!preview ? (
                <div
                    onClick={() => fileInputRef.current?.click()}
                    className={`
                        relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors
                        ${uploading ? "bg-slate-900 border-slate-600" : "border-slate-600 hover:border-purple-500 hover:bg-purple-900/30"}
                        ${error ? "border-red-300 bg-red-50" : ""}
                    `}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept={accept}
                        onChange={handleFileChange}
                        className="hidden"
                        disabled={uploading}
                    />

                    <div className="flex flex-col items-center gap-2">
                        {uploading ? (
                            <div className="h-10 w-10 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
                        ) : (
                            <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                                <ArrowUpTrayIcon className="h-5 w-5" />
                            </div>
                        )}
                        <div className="text-sm font-medium text-slate-100">
                            {uploading ? "Uploading..." : "Click to upload"}
                        </div>
                        <div className="text-xs text-slate-400">
                            {uploading ? "Please wait" : `Max size ${maxSizeMB}MB`}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="relative rounded-xl overflow-hidden border border-slate-700 group bg-slate-900">
                    {isAudio ? (
                        <div className="p-4 flex items-center gap-4">
                            <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 shrink-0">
                                <MusicalNoteIcon className="h-6 w-6" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <audio controls src={preview} className="w-full h-8" />
                            </div>
                        </div>
                    ) : isVideo ? (
                        <div className="aspect-video relative bg-slate-700">
                            <video
                                src={preview}
                                controls
                                className="w-full h-full object-cover"
                            />
                        </div>
                    ) : (
                        <div className="aspect-video relative bg-slate-700">
                            <Image
                                src={preview}
                                alt="Preview"
                                fill
                                className="object-cover"
                            />
                        </div>
                    )}

                    <button
                        type="button"
                        onClick={handleRemove}
                        className="absolute top-2 right-2 p-1.5 bg-slate-800/90 backdrop-blur-sm rounded-full text-slate-400 hover:text-red-600 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <XMarkIcon className="h-4 w-4" />
                    </button>
                </div>
            )}

            {error && (
                <p className="text-sm text-red-600">{error}</p>
            )}
        </div>
    );
}
