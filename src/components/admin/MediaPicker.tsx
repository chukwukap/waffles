"use client";

import { useState, useEffect } from "react";
import { PhotoIcon, XMarkIcon, MusicalNoteIcon, VideoCameraIcon } from "@heroicons/react/24/outline";
import Image from "next/image";

interface MediaFile {
    url: string;
    pathname: string;
    contentType: string;
    size: number;
}

interface MediaPickerProps {
    label: string;
    name: string;
    accept?: "image" | "audio" | "video" | "all";
    onSelect: (url: string) => void;
    selectedUrl?: string;
}

export function MediaPicker({ label, name, accept = "all", onSelect, selectedUrl }: MediaPickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [files, setFiles] = useState<MediaFile[]>([]);
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState("");

    useEffect(() => {
        if (isOpen) {
            loadMedia();
        }
    }, [isOpen]);

    const loadMedia = async () => {
        setLoading(true);
        try {
            const response = await fetch("/api/admin/media");
            if (response.ok) {
                const data = await response.json();
                setFiles(data.files || []);
            }
        } catch (error) {
            console.error("Failed to load media:", error);
        } finally {
            setLoading(false);
        }
    };

    const inferContentType = (pathname: string, storedContentType: string): string => {
        if (storedContentType && storedContentType !== 'application/octet-stream') {
            return storedContentType;
        }

        const ext = pathname.split('.').pop()?.toLowerCase();
        const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'avif'];
        const audioExts = ['mp3', 'wav', 'ogg', 'aac', 'webm', 'm4a'];
        const videoExts = ['mp4', 'webm', 'mov', 'avi'];

        if (ext && imageExts.includes(ext)) return `image/${ext}`;
        if (ext && audioExts.includes(ext)) return `audio/${ext}`;
        if (ext && videoExts.includes(ext)) return `video/${ext}`;

        return storedContentType;
    };

    const filteredFiles = files.filter((file) => {
        const actualContentType = inferContentType(file.pathname, file.contentType);

        if (accept !== "all" && !actualContentType.startsWith(accept)) {
            return false;
        }

        if (filter && !file.pathname.toLowerCase().includes(filter.toLowerCase())) {
            return false;
        }

        return true;
    });

    const handleSelect = (url: string) => {
        onSelect(url);
        setIsOpen(false);
    };

    return (
        <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-300">{label}</label>

            {/* Hidden input for form submission */}
            <input type="hidden" name={name} value={selectedUrl || ""} />

            {selectedUrl ? (
                <div className="relative group">
                    <div className="aspect-video bg-slate-700 rounded-lg overflow-hidden border border-slate-700">
                        <Image
                            src={selectedUrl}
                            alt="Selected"
                            fill
                            className="object-cover"
                            unoptimized
                        />
                    </div>
                    <button
                        type="button"
                        onClick={() => onSelect("")}
                        className="absolute top-2 right-2 p-1.5 bg-slate-800/90 backdrop-blur-sm rounded-full text-slate-400 hover:text-red-600 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <XMarkIcon className="h-4 w-4" />
                    </button>
                    <button
                        type="button"
                        onClick={() => setIsOpen(true)}
                        className="mt-2 w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm font-medium text-slate-300 transition-colors"
                    >
                        Change Media
                    </button>
                </div>
            ) : (
                <button
                    type="button"
                    onClick={() => setIsOpen(true)}
                    className="w-full border-2 border-dashed border-slate-600 rounded-xl p-8 text-center hover:border-purple-500 hover:bg-slate-700/50 transition-colors"
                >
                    <div className="flex flex-col items-center gap-2">
                        <PhotoIcon className="h-10 w-10 text-slate-400" />
                        <div className="text-sm font-medium text-slate-100">Select from Library</div>
                        <div className="text-xs text-slate-400">Click to browse uploaded files</div>
                    </div>
                </button>
            )}

            {/* Media Picker Modal */}
            {isOpen && (
                <>
                    <div className="fixed inset-0 bg-black/70 z-40" onClick={() => setIsOpen(false)} />
                    <div className="fixed inset-4 md:inset-10 bg-slate-800 rounded-xl shadow-2xl z-50 flex flex-col border border-slate-700">
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-slate-700">
                            <h2 className="text-lg font-semibold text-slate-100">Select {accept === "all" ? "Media" : accept.charAt(0).toUpperCase() + accept.slice(1)}</h2>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors text-slate-400"
                            >
                                <XMarkIcon className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Search */}
                        <div className="p-4 border-b border-slate-700">
                            <input
                                type="text"
                                placeholder="Search files..."
                                value={filter}
                                onChange={(e) => setFilter(e.target.value)}
                                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-slate-100 placeholder-slate-500"
                            />
                        </div>

                        {/* Files Grid */}
                        <div className="flex-1 overflow-y-auto p-4 bg-slate-900">
                            {loading ? (
                                <div className="flex items-center justify-center h-full text-slate-400">Loading...</div>
                            ) : filteredFiles.length === 0 ? (
                                <div className="flex items-center justify-center h-full text-slate-400">No files found</div>
                            ) : (
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {filteredFiles.map((file) => {
                                        const actualContentType = inferContentType(file.pathname, file.contentType);
                                        const fileName = file.pathname.split("/").pop() || "";

                                        return (
                                            <div
                                                key={file.url}
                                                className="relative flex flex-col bg-slate-800 rounded-lg overflow-hidden border-2 border-slate-700 hover:border-purple-500 transition-all group"
                                            >
                                                {/* Preview Area */}
                                                <button
                                                    type="button"
                                                    onClick={() => handleSelect(file.url)}
                                                    className="aspect-video bg-slate-900 flex items-center justify-center relative overflow-hidden"
                                                >
                                                    {actualContentType.startsWith("image") ? (
                                                        <Image
                                                            src={file.url}
                                                            alt={fileName}
                                                            fill
                                                            className="object-contain group-hover:scale-105 transition-transform"
                                                            unoptimized
                                                        />
                                                    ) : actualContentType.startsWith("audio") ? (
                                                        <div className="flex flex-col items-center gap-2 w-full p-4">
                                                            <MusicalNoteIcon className="h-12 w-12 text-purple-400" />
                                                            <span className="text-xs text-slate-400">Audio</span>
                                                        </div>
                                                    ) : actualContentType.startsWith("video") ? (
                                                        <div className="flex flex-col items-center gap-2">
                                                            <VideoCameraIcon className="h-12 w-12 text-blue-400" />
                                                            <span className="text-xs text-slate-400">Video</span>
                                                        </div>
                                                    ) : (
                                                        <PhotoIcon className="h-12 w-12 text-slate-400" />
                                                    )}
                                                </button>

                                                {/* File Name & Audio Player */}
                                                <div className="p-2 bg-slate-800 border-t border-slate-700">
                                                    <div className="text-xs text-slate-300 truncate font-medium mb-1">
                                                        {fileName}
                                                    </div>
                                                    {actualContentType.startsWith("audio") && (
                                                        <audio
                                                            controls
                                                            className="w-full h-8"
                                                            onClick={(e) => e.stopPropagation()}
                                                            onPlay={(e) => e.stopPropagation()}
                                                        >
                                                            <source src={file.url} type={actualContentType} />
                                                        </audio>
                                                    )}
                                                </div>

                                                {/* Select button overlay for non-audio files */}
                                                {!actualContentType.startsWith("audio") && (
                                                    <div
                                                        className="absolute inset-0 bg-purple-600/0 group-hover:bg-purple-600/10 transition-colors cursor-pointer"
                                                        onClick={() => handleSelect(file.url)}
                                                    />
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
