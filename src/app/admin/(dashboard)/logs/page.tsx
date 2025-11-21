import { prisma } from "@/lib/db";

async function getAuditLogs(page: number = 1) {
    const pageSize = 50;
    const skip = (page - 1) * pageSize;

    const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({
            skip,
            take: pageSize,
            orderBy: { createdAt: "desc" },
            include: {
                admin: {
                    select: {
                        fid: true,
                        username: true,
                    },
                },
            },
        }),
        prisma.auditLog.count(),
    ]);

    return { logs, total, page, pageSize };
}

export default async function AuditLogsPage({
    searchParams,
}: {
    searchParams: Promise<{ page?: string }>;
}) {
    const resolvedParams = await searchParams;
    const page = parseInt(resolvedParams.page || "1");
    const { logs, total, pageSize } = await getAuditLogs(page);
    const totalPages = Math.ceil(total / pageSize);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Audit Logs</h1>
                <p className="text-slate-600 mt-1">
                    Track all admin actions - {total.toLocaleString()} total entries
                </p>
            </div>

            <div className="bg-white shadow-sm rounded-xl border border-slate-200 overflow-hidden">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                                Timestamp
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                                Admin
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                                Action
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                                Entity
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                                Details
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                        {logs.map((log) => (
                            <tr key={log.id} className="hover:bg-slate-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                                    {new Date(log.createdAt).toLocaleString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                                    {log.admin.username || `FID ${log.admin.fid}`}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                        {log.action.replace(/_/g, " ")}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                                    {log.entityType}
                                    {log.entityId && ` #${log.entityId}`}
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-600 max-w-md truncate">
                                    {log.details ? JSON.stringify(log.details) : "—"}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                    {page > 1 && (
                        <a
                            href={`?page=${page - 1}`}
                            className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50"
                        >
                            Previous
                        </a>
                    )}
                    <span className="px-4 py-2 text-sm text-slate-600">
                        Page {page} of {totalPages}
                    </span>
                    {page < totalPages && (
                        <a
                            href={`?page=${page + 1}`}
                            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                        >
                            Next
                        </a>
                    )}
                </div>
            )}
        </div>
    );
}
