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
            {label && <label className="block text-sm font-medium text-white/70">{label}</label>}

            {/* Hidden input for form submission */}
            <input type="hidden" name={name} value={selectedUrl || ""} />

            {selectedUrl ? (
                <div className="relative group">
                    <div className="aspect-video bg-black/30 rounded-xl overflow-hidden border border-white/10">
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
                        className="absolute top-2 right-2 p-1.5 bg-black/80 backdrop-blur-sm rounded-full text-white/60 hover:text-red-400 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <XMarkIcon className="h-4 w-4" />
                    </button>
                    <button
                        type="button"
                        onClick={() => setIsOpen(true)}
                        className="mt-3 w-full px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-medium text-white/70 transition-colors"
                    >
                        Change Media
                    </button>
                </div>
            ) : (
                <button
                    type="button"
                    onClick={() => setIsOpen(true)}
                    className="w-full border-2 border-dashed border-white/20 rounded-xl p-8 text-center hover:border-[#FFC931]/50 hover:bg-white/5 transition-colors"
                >
                    <div className="flex flex-col items-center gap-2">
                        <PhotoIcon className="h-10 w-10 text-white/40" />
                        <div className="text-sm font-medium text-white">Select from Library</div>
                        <div className="text-xs text-white/50">Click to browse uploaded files</div>
                    </div>
                </button>
            )}

            {/* Media Picker Modal */}
            {isOpen && (
                <>
                    <div className="fixed inset-0 bg-black/80 z-40" onClick={() => setIsOpen(false)} />
                    <div className="fixed inset-4 md:inset-10 admin-panel z-50 flex flex-col border border-white/10 shadow-2xl">
                        {/* Header */}
                        <div className="flex items-center justify-between p-5 border-b border-white/10">
                            <h2 className="text-lg font-semibold text-white font-display">
                                Select {accept === "all" ? "Media" : accept.charAt(0).toUpperCase() + accept.slice(1)}
                            </h2>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white/60 hover:text-white"
                            >
                                <XMarkIcon className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Search */}
                        <div className="p-4 border-b border-white/10">
                            <input
                                type="text"
                                placeholder="Search files..."
                                value={filter}
                                onChange={(e) => setFilter(e.target.value)}
                                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-[#FFC931]/50 focus:border-[#FFC931] text-white placeholder-white/40 transition-all"
                            />
                        </div>

                        {/* Files Grid */}
                        <div className="flex-1 overflow-y-auto p-4 bg-black/20">
                            {loading ? (
                                <div className="flex items-center justify-center h-full text-white/50">Loading...</div>
                            ) : filteredFiles.length === 0 ? (
                                <div className="flex items-center justify-center h-full text-white/50">No files found</div>
                            ) : (
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                    {filteredFiles.map((file) => {
                                        const actualContentType = inferContentType(file.pathname, file.contentType);
                                        const fileName = file.pathname.split("/").pop() || "";

                                        return (
                                            <div
                                                key={file.url}
                                                className="relative flex flex-col bg-white/5 rounded-xl overflow-hidden border border-white/10 hover:border-[#FFC931]/50 transition-all group cursor-pointer"
                                                onClick={() => handleSelect(file.url)}
                                            >
                                                {/* Preview Area */}
                                                <div className="aspect-video bg-black/30 flex items-center justify-center relative overflow-hidden">
                                                    {actualContentType.startsWith("image") ? (
                                                        <Image
                                                            src={file.url}
                                                            alt={fileName}
                                                            fill
                                                            className="object-cover group-hover:scale-105 transition-transform"
                                                            unoptimized
                                                        />
                                                    ) : actualContentType.startsWith("audio") ? (
                                                        <div className="flex flex-col items-center gap-2 w-full p-4">
                                                            <MusicalNoteIcon className="h-10 w-10 text-[#FB72FF]" />
                                                            <span className="text-xs text-white/50">Audio</span>
                                                        </div>
                                                    ) : actualContentType.startsWith("video") ? (
                                                        <div className="flex flex-col items-center gap-2">
                                                            <VideoCameraIcon className="h-10 w-10 text-[#00CFF2]" />
                                                            <span className="text-xs text-white/50">Video</span>
                                                        </div>
                                                    ) : (
                                                        <PhotoIcon className="h-10 w-10 text-white/40" />
                                                    )}
                                                </div>

                                                {/* File Name & Audio Player */}
                                                <div className="p-2.5 bg-black/20 border-t border-white/5">
                                                    <div className="text-xs text-white/70 truncate font-medium">
                                                        {fileName}
                                                    </div>
                                                    {actualContentType.startsWith("audio") && (
                                                        <audio
                                                            controls
                                                            className="w-full h-7 mt-2"
                                                            onClick={(e) => e.stopPropagation()}
                                                            onPlay={(e) => e.stopPropagation()}
                                                        >
                                                            <source src={file.url} type={actualContentType} />
                                                        </audio>
                                                    )}
                                                </div>

                                                {/* Hover overlay */}
                                                <div className="absolute inset-0 bg-[#FFC931]/0 group-hover:bg-[#FFC931]/5 transition-colors pointer-events-none" />
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

