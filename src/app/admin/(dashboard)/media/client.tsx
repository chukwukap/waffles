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
    const [deletingUrl, setDeletingUrl] = useState<string | null>(null);

    const inferContentType = (pathname: string, storedContentType: string): string => {
        // If we have a proper content type, use it
        if (storedContentType && storedContentType !== 'application/octet-stream') {
            return storedContentType;
        }

        // Otherwise, infer from file extension
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

            // Filter by type
            if (filter !== "all") {
                if (!actualContentType.startsWith(filter)) return false;
            }

            // Filter by search
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

    const handleDelete = async (url: string) => {
        if (!confirm("Are you sure you want to delete this file?")) return;

        setDeletingUrl(url);
        const result = await deleteMediaAction(url);

        if (result.success) {
            setFiles((prev) => prev.filter((f) => f.url !== url));
        } else {
            alert(result.error || "Failed to delete file");
        }
        setDeletingUrl(null);
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
            <div className="grid grid-cols-4 gap-4">
                <div className="bg-slate-800 rounded-xl shadow-sm border border-slate-700 p-4">
                    <div className="text-sm text-slate-400">Total Files</div>
                    <div className="text-2xl font-bold text-slate-100 mt-1">{stats.total}</div>
                </div>
                <div className="bg-slate-800 rounded-xl shadow-sm border border-slate-700 p-4">
                    <div className="text-sm text-slate-400">Images</div>
                    <div className="text-2xl font-bold text-purple-600 mt-1">{stats.images}</div>
                </div>
                <div className="bg-slate-800 rounded-xl shadow-sm border border-slate-700 p-4">
                    <div className="text-sm text-slate-400">Audio</div>
                    <div className="text-2xl font-bold text-blue-600 mt-1">{stats.audio}</div>
                </div>
                <div className="bg-slate-800 rounded-xl shadow-sm border border-slate-700 p-4">
                    <div className="text-sm text-slate-400">Videos</div>
                    <div className="text-2xl font-bold text-pink-600 mt-1">{stats.videos}</div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-slate-800 rounded-xl shadow-sm border border-slate-700 p-4">
                <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                    <div className="flex gap-2">
                        <button
                            onClick={() => setFilter("all")}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === "all"
                                ? "bg-purple-100 text-purple-700"
                                : "bg-slate-700 text-slate-400 hover:bg-slate-200"
                                }`}
                        >
                            All
                        </button>
                        <button
                            onClick={() => setFilter("image")}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === "image"
                                ? "bg-purple-100 text-purple-700"
                                : "bg-slate-700 text-slate-400 hover:bg-slate-200"
                                }`}
                        >
                            Images
                        </button>
                        <button
                            onClick={() => setFilter("audio")}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === "audio"
                                ? "bg-purple-100 text-purple-700"
                                : "bg-slate-700 text-slate-400 hover:bg-slate-200"
                                }`}
                        >
                            Audio
                        </button>
                        <button
                            onClick={() => setFilter("video")}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === "video"
                                ? "bg-purple-100 text-purple-700"
                                : "bg-slate-700 text-slate-400 hover:bg-slate-200"
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
                        className="px-4 py-2 border border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                </div>
            </div>

            {/* Files Grid */}
            {filteredFiles.length === 0 ? (
                <div className="bg-slate-800 rounded-xl shadow-sm border border-slate-700 p-12 text-center">
                    <p className="text-slate-400">No files found</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredFiles.map((file) => {
                        const actualContentType = inferContentType(file.pathname, file.contentType);
                        return (
                            <div
                                key={file.url}
                                className="bg-slate-800 rounded-xl shadow-sm border border-slate-700 overflow-hidden group"
                            >
                                {/* Preview */}
                                <div className="aspect-video bg-slate-700 relative">
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
                                            <MusicalNoteIcon className="h-12 w-12 text-purple-400" />
                                            <audio controls src={file.url} className="w-full" />
                                        </div>
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                                            {getFileIcon(actualContentType)}
                                        </div>
                                    )}
                                </div>

                                {/* Details */}
                                <div className="p-4 space-y-3">
                                    <div>
                                        <div className="text-sm font-medium text-slate-100 truncate">
                                            {file.pathname.split("/").pop()}
                                        </div>
                                        <div className="text-xs text-slate-400 mt-1">
                                            {formatFileSize(file.size)} • {new Date(file.uploadedAt).toISOString().split('T')[0]}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => copyToClipboard(file.url)}
                                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-200 rounded-lg text-sm font-medium text-slate-300 transition-colors"
                                        >
                                            {copiedUrl === file.url ? (
                                                <>
                                                    <CheckIcon className="h-4 w-4 text-green-600" />
                                                    <span>Copied!</span>
                                                </>
                                            ) : (
                                                <>
                                                    <ClipboardIcon className="h-4 w-4" />
                                                    <span>Copy URL</span>
                                                </>
                                            )}
                                        </button>
                                        <button
                                            onClick={() => handleDelete(file.url)}
                                            disabled={deletingUrl === file.url}
                                            className="px-3 py-2 bg-red-950 hover:bg-red-100 rounded-lg text-red-600 transition-colors disabled:opacity-50"
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
