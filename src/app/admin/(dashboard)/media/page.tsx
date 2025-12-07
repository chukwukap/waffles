import { listMediaAction } from "@/actions/admin/media";
import MediaLibraryClient from "./client";
import Link from "next/link";
import { ArrowUpTrayIcon } from "@heroicons/react/24/outline";

export default async function MediaLibraryPage() {
    const result = await listMediaAction();

    if (!result.success) {
        return (
            <div className="max-w-6xl space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-white font-display">Media Library</h1>
                    <p className="text-white/60 mt-1">Manage your uploaded media files</p>
                </div>

                <div className="admin-panel p-6 border-red-500/30 bg-red-500/10">
                    <p className="text-red-400 font-medium">{result.error}</p>
                    <p className="text-sm text-red-400/70 mt-2">
                        Make sure <code className="text-xs bg-red-500/20 px-1.5 py-0.5 rounded">BLOB_READ_WRITE_TOKEN</code> is configured in your environment variables.
                    </p>
                </div>
            </div>
        );
    }

    const files = result.files || [];

    return (
        <div className="max-w-7xl space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white font-display">Media Library</h1>
                    <p className="text-white/60 mt-1">
                        Manage your uploaded media files • <span className="text-[#FFC931] font-bold">{files.length}</span> total
                    </p>
                </div>

                <Link
                    href="/admin/media/upload"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-black bg-[#FFC931] hover:bg-[#FFD966] shadow-lg shadow-[#FFC931]/20 transition-all duration-200 hover:shadow-[#FFC931]/30 font-display"
                >
                    <ArrowUpTrayIcon className="h-4 w-4" />
                    Upload Media
                </Link>
            </div>

            <MediaLibraryClient initialFiles={files} />
        </div>
    );
}

