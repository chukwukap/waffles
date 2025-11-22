import { listMediaAction } from "@/actions/admin/media";
import MediaLibraryClient from "./client";
import Link from "next/link";

export default async function MediaLibraryPage() {
    const result = await listMediaAction();

    if (!result.success) {
        return (
            <div className="max-w-6xl space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 font-display">Media Library</h1>
                    <p className="text-slate-600 mt-1">Manage your uploaded media files</p>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                    <p className="text-red-800">{result.error}</p>
                    <p className="text-sm text-red-600 mt-2">
                        Make sure <code className="text-xs bg-red-100 px-1 rounded">BLOB_READ_WRITE_TOKEN</code> is configured in your environment variables.
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
                    <h1 className="text-2xl font-bold text-slate-900 font-display">Media Library</h1>
                    <p className="text-slate-600 mt-1">
                        Manage your uploaded media files • {files.length} total
                    </p>
                </div>

                <Link
                    href="/admin/games"
                    className="px-4 py-2 bg-linear-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium rounded-lg shadow-sm transition-colors"
                >
                    Upload New Media
                </Link>
            </div>

            <MediaLibraryClient initialFiles={files} />
        </div>
    );
}
