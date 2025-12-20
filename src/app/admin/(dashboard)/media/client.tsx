"use client";

import { useState, useMemo } from "react";
import { MediaFile, deleteMediaAction } from "@/actions/admin/media";
import { PhotoIcon, MusicalNoteIcon, VideoCameraIcon, ClipboardIcon, TrashIcon } from "@heroicons/react/24/outline";
import { CheckIcon } from "@heroicons/react/24/solid";
import Image from "next/image";

interface MediaLibraryClientProps {
    initialFiles: MediaFile[];
}

type MediaType = "all" | "image" | "audio" | "video";

export default function MediaLibraryClient({ initialFiles }: MediaLibraryClientProps) {
    const [files, setFiles] = useState<MediaFile[]>(initialFiles);
    const [filter, setFilter] = useState<MediaType>("all");
    const [search, setSearch] = useState("");
    const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
    const [deletingPath, setDeletingPath] = useState<string | null>(null);

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

    const filteredFiles = useMemo(() => {
        return files.filter((file) => {
            const actualContentType = inferContentType(file.pathname, file.contentType);
            if (filter !== "all") {
                if (!actualContentType.startsWith(filter)) return false;
            }
            if (search && !file.pathname.toLowerCase().includes(search.toLowerCase())) {
                return false;
            }
            return true;
        });
    }, [files, filter, search]);

    const copyToClipboard = (url: string) => {
        navigator.clipboard.writeText(url);
        setCopiedUrl(url);
        setTimeout(() => setCopiedUrl(null), 2000);
    };

    const handleDelete = async (pathname: string) => {
        if (!confirm("Are you sure you want to delete this file?")) return;
        setDeletingPath(pathname);
        const result = await deleteMediaAction(pathname);
        if (result.success) {
            setFiles((prev) => prev.filter((f) => f.pathname !== pathname));
        } else {
            alert(result.error || "Failed to delete file");
        }
        setDeletingPath(null);
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return bytes + " B";
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
        return (bytes / (1024 * 1024)).toFixed(1) + " MB";
    };

    const getFileIcon = (contentType: string) => {
        if (contentType.startsWith("image")) return <PhotoIcon className="h-5 w-5" />;
        if (contentType.startsWith("audio")) return <MusicalNoteIcon className="h-5 w-5" />;
        if (contentType.startsWith("video")) return <VideoCameraIcon className="h-5 w-5" />;
        return <PhotoIcon className="h-5 w-5" />;
    };

    const stats = {
        total: files.length,
        images: files.filter((f) => inferContentType(f.pathname, f.contentType).startsWith("image")).length,
        audio: files.filter((f) => inferContentType(f.pathname, f.contentType).startsWith("audio")).length,
        videos: files.filter((f) => inferContentType(f.pathname, f.contentType).startsWith("video")).length,
    };

    return (
        <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white/5 border border-white/[0.08] rounded-2xl backdrop-blur-lg p-4">
                    <div className="text-sm text-white/50 font-display">Total Files</div>
                    <div className="text-2xl font-bold text-white mt-1 font-body">{stats.total}</div>
                </div>
                <div className="bg-white/5 border border-white/[0.08] rounded-2xl backdrop-blur-lg p-4">
                    <div className="text-sm text-white/50 font-display">Images</div>
                    <div className="text-2xl font-bold text-[#FFC931] mt-1 font-body ">{stats.images}</div>
                </div>
                <div className="bg-white/5 border border-white/[0.08] rounded-2xl backdrop-blur-lg p-4">
                    <div className="text-sm text-white/50 font-display">Audio</div>
                    <div className="text-2xl font-bold text-[#00CFF2] mt-1 font-body ">{stats.audio}</div>
                </div>
                <div className="bg-white/5 border border-white/[0.08] rounded-2xl backdrop-blur-lg p-4">
                    <div className="text-sm text-white/50 font-display">Videos</div>
                    <div className="text-2xl font-bold text-[#FB72FF] mt-1 font-body ">{stats.videos}</div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white/5 border border-white/[0.08] rounded-2xl backdrop-blur-lg p-4">
                <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                    <div className="flex gap-2">
                        <button
                            onClick={() => setFilter("all")}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${filter === "all"
                                ? "bg-[#FFC931] text-black font-bold"
                                : "bg-white/5 text-white/60 hover:bg-white/10"
                                }`}
                        >
                            All
                        </button>
                        <button
                            onClick={() => setFilter("image")}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${filter === "image"
                                ? "bg-[#FFC931] text-black font-bold"
                                : "bg-white/5 text-white/60 hover:bg-white/10"
                                }`}
                        >
                            Images
                        </button>
                        <button
                            onClick={() => setFilter("audio")}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${filter === "audio"
                                ? "bg-[#FFC931] text-black font-bold"
                                : "bg-white/5 text-white/60 hover:bg-white/10"
                                }`}
                        >
                            Audio
                        </button>
                        <button
                            onClick={() => setFilter("video")}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${filter === "video"
                                ? "bg-[#FFC931] text-black font-bold"
                                : "bg-white/5 text-white/60 hover:bg-white/10"
                                }`}
                        >
                            Videos
                        </button>
                    </div>
                    <input
                        type="text"
                        placeholder="Search files..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:ring-2 focus:ring-[#FFC931]/50 focus:border-[#FFC931] transition-all"
                    />
                </div>
            </div>

            {/* Files Grid */}
            {filteredFiles.length === 0 ? (
                <div className="bg-white/5 border border-white/[0.08] rounded-2xl backdrop-blur-lg p-12 text-center">
                    <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <PhotoIcon className="h-8 w-8 text-white/30" />
                    </div>
                    <p className="text-white/50 font-display">No files found</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredFiles.map((file) => {
                        const actualContentType = inferContentType(file.pathname, file.contentType);
                        return (
                            <div
                                key={file.url}
                                className="bg-white/5 border border-white/[0.08] rounded-2xl backdrop-blur-lg overflow-hidden group hover:border-[#FFC931]/30 transition-colors"
                            >
                                {/* Preview */}
                                <div className="aspect-video bg-white/5 relative">
                                    {actualContentType.startsWith("image") ? (
                                        <Image
                                            src={file.url}
                                            alt={file.pathname}
                                            fill
                                            className="object-cover"
                                            unoptimized
                                        />
                                    ) : actualContentType.startsWith("video") ? (
                                        <video src={file.url} controls className="w-full h-full object-cover" />
                                    ) : actualContentType.startsWith("audio") ? (
                                        <div className="w-full h-full flex flex-col items-center justify-center p-4 gap-4">
                                            <MusicalNoteIcon className="h-12 w-12 text-[#00CFF2]" />
                                            <audio controls src={file.url} className="w-full" />
                                        </div>
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-white/40">
                                            {getFileIcon(actualContentType)}
                                        </div>
                                    )}
                                </div>

                                {/* Details */}
                                <div className="p-4 space-y-3">
                                    <div>
                                        <div className="text-sm font-medium text-white truncate">
                                            {file.pathname.split("/").pop()}
                                        </div>
                                        <div className="text-xs text-white/50 mt-1">
                                            {formatFileSize(file.size)} • {new Date(file.uploadedAt).toISOString().split('T')[0]}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => copyToClipboard(file.url)}
                                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-medium text-white/70 transition-colors"
                                        >
                                            {copiedUrl === file.url ? (
                                                <>
                                                    <CheckIcon className="h-4 w-4 text-[#14B985]" />
                                                    <span className="text-[#14B985]">Copied!</span>
                                                </>
                                            ) : (
                                                <>
                                                    <ClipboardIcon className="h-4 w-4" />
                                                    <span>Copy URL</span>
                                                </>
                                            )}
                                        </button>
                                        <button
                                            onClick={() => handleDelete(file.pathname)}
                                            disabled={deletingPath === file.pathname}
                                            className="px-3 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-xl text-red-400 transition-colors disabled:opacity-50"
                                        >
                                            <TrashIcon className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
