import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { useOrg } from "../context/OrgContext";
import auditLogsApi from "../api/auditLogs";

import LoadingSpinner from "../components/LoadingSpinner";
import EmptyState from "../components/EmptyState";

import {
  FileText,
  Eye,
  Search,
  X
} from "lucide-react";

export default function AuditLogsPage() {
  const { activeOrg } = useOrg();
  const params = useParams();
  const orgId = params.organizationId || activeOrg?._id;

  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [currentPage, setCurrentPage] = useState(1);
  const [actionFilter, setActionFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Detail Modal
  const [selectedLog, setSelectedLog] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const loadLogs = async (page = 1) => {
    if (!orgId) return;
    try {
      setLoading(true);
      setError("");
      const response = await auditLogsApi.getAll(orgId, page, 20);
      const data = response.data?.data;
      setLogs(data?.logs || []);
      setPagination(data?.pagination || { page: 1, limit: 20, total: 0, totalPages: 1 });
    } catch (err) {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs(currentPage);
  }, [orgId, currentPage]);

  const handleViewDetail = async (auditLogId, fallbackLog) => {
    try {
      setLoadingDetail(true);
      if (auditLogId && auditLogId.length === 24) {
        const response = await auditLogsApi.getById(orgId, auditLogId);
        setSelectedLog(response.data?.data);
      } else {
        setSelectedLog(fallbackLog);
      }
    } catch {
      setSelectedLog(fallbackLog);
    } finally {
      setLoadingDetail(false);
    }
  };

  const filteredLogs = logs.filter((log) => {
    if (actionFilter !== "ALL" && !log.action?.toLowerCase().includes(actionFilter.toLowerCase())) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchActor = (log.actorName || log.userId?.name || log.userEmail || "").toLowerCase().includes(q);
      const matchAction = (log.action || "").toLowerCase().includes(q);
      const matchTarget = (log.target || log.entityId || "").toLowerCase().includes(q);
      return matchActor || matchAction || matchTarget;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* ── HEADER ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-gray-400 font-mono mb-2">
            <Link to="/" className="text-gray-400 hover:text-white transition-colors">
              APIShield
            </Link>
            <span className="text-gray-600">/</span>
            <span className="text-emerald-400 font-medium">Audit Logs</span>
          </nav>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Audit Logs
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Immutable activity log of security, access, and configuration events.
          </p>
        </div>
      </div>

      {/* ── FILTER BAR ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0e131f] border border-white/10 rounded-xl p-3 shadow-md">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search logs by actor, action, or target..."
              className="w-full bg-[#090d16] text-gray-200 text-xs pl-8 pr-3 py-2 border border-white/10 rounded-lg focus:outline-none focus:border-emerald-500 placeholder-gray-600 font-mono"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="w-full sm:w-auto bg-[#090d16] text-gray-300 font-mono text-xs border border-white/10 rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500 cursor-pointer"
          >
            <option value="ALL">All Event Types</option>
            <option value="key">API Key Events</option>
            <option value="gateway">Gateway Traffic</option>
            <option value="integration">Integrations</option>
            <option value="security">Security</option>
          </select>
        </div>
      </div>

      {/* ── CONTENT ────────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="p-12 flex justify-center items-center bg-[#0e131f] border border-white/10 rounded-xl">
          <LoadingSpinner size="lg" />
        </div>
      ) : filteredLogs.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No audit events found"
          description={
            searchQuery || actionFilter !== "ALL"
              ? "No events match your current filter settings."
              : "System and security activities will be recorded here automatically."
          }
        />
      ) : (
        <div className="space-y-4">
          {/* Mobile Card List (sm:hidden) */}
          <div className="sm:hidden space-y-3">
            {filteredLogs.map((log) => {
              const actorName = log.actorName || log.userId?.name || log.userEmail || "System";
              const actorRole = log.actorRole || "Member";
              const initials = actorName
                .split(" ")
                .map((w) => w[0])
                .join("")
                .toUpperCase()
                .slice(0, 2) || "SY";

              const dateFormatted = new Date(log.createdAt).toLocaleString([], {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
              });

              return (
                <div
                  key={log._id}
                  className="bg-[#0e131f] border border-white/10 rounded-xl p-4 shadow-md space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-slate-800 border border-white/10 text-emerald-400 flex items-center justify-center text-[10px] font-mono font-bold shrink-0">
                        {initials}
                      </div>
                      <div>
                        <div className="font-semibold text-white text-xs leading-tight">{actorName}</div>
                        <span className="text-[10px] text-gray-400 font-mono">{actorRole}</span>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span>{log.status || "Success"}</span>
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs font-mono">
                    <div className="flex items-center justify-between text-gray-400">
                      <span>Action:</span>
                      <span className="text-sky-400 bg-sky-950/30 border border-sky-500/20 px-2 py-0.5 rounded">
                        {log.action}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-gray-400">
                      <span>Target:</span>
                      <span className="text-gray-200 truncate max-w-[180px]">{log.target || log.entityId || "—"}</span>
                    </div>
                    <div className="flex items-center justify-between text-gray-400">
                      <span>Time:</span>
                      <span className="text-gray-400 text-[11px]">{dateFormatted}</span>
                    </div>
                    {log.ipAddress && (
                      <div className="flex items-center justify-between text-gray-400">
                        <span>IP:</span>
                        <span className="text-gray-500 text-[11px]">{log.ipAddress}</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-white/5 flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleViewDetail(log._id, log)}
                      className="inline-flex items-center gap-1.5 text-xs text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg border border-white/10 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5 text-emerald-400" />
                      <span>View Payload</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table (hidden sm:block) */}
          <div className="hidden sm:block bg-[#0e131f] border border-white/10 rounded-xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[700px]">
                <thead>
                  <tr className="border-b border-white/10 bg-[#090d16] text-[10px] font-mono font-semibold text-gray-400 uppercase tracking-wider">
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Actor</th>
                    <th className="py-3 px-4">Action</th>
                    <th className="py-3 px-4">Resource Target</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">IP Address</th>
                    <th className="py-3 px-4 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredLogs.map((log) => {
                    const actorName = log.actorName || log.userId?.name || log.userEmail || "System";
                    const actorRole = log.actorRole || "Member";
                    const initials = actorName
                      .split(" ")
                      .map((w) => w[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2) || "SY";

                    const dateFormatted = new Date(log.createdAt).toLocaleString([], {
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    });

                    return (
                      <tr key={log._id} className="hover:bg-white/5 transition-colors">
                        <td className="py-3.5 px-4 font-mono text-gray-400 text-[11px] whitespace-nowrap">
                          {dateFormatted}
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-slate-800 border border-white/10 text-emerald-400 flex items-center justify-center text-[10px] font-mono font-bold shrink-0">
                              {initials}
                            </div>
                            <span className="font-semibold text-white">{actorName}</span>
                            <span className="text-[10px] text-gray-500 font-mono">({actorRole})</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="font-mono text-xs text-sky-400 bg-sky-950/30 border border-sky-500/20 px-2 py-0.5 rounded">
                            {log.action}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 font-mono text-gray-300 max-w-[200px] truncate">
                          {log.target || log.entityId || "—"}
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            <span>{log.status || "Success"}</span>
                          </span>
                        </td>

                        <td className="py-3.5 px-4 font-mono text-gray-500 text-[11px]">
                          {log.ipAddress || log.ip || "—"}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleViewDetail(log._id, log)}
                            className="p-1.5 rounded-md hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-[#0e131f] border border-white/10 rounded-xl p-4 sm:p-6 w-full max-w-lg shadow-2xl space-y-4 max-h-[calc(100vh-2rem)] flex flex-col">
            <div className="flex items-center justify-between border-b border-white/10 pb-3 shrink-0">
              <h3 className="text-sm font-bold text-white font-mono truncate mr-2">
                Audit Event: {selectedLog.action}
              </h3>
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="text-gray-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-[#080c14] border border-white/10 rounded-lg p-3 sm:p-4 font-mono text-xs text-gray-200 overflow-auto flex-1 leading-relaxed">
              <pre className="whitespace-pre-wrap break-all">{JSON.stringify(selectedLog, null, 2)}</pre>
            </div>

            <div className="flex justify-end pt-2 shrink-0">
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="bg-white/10 hover:bg-white/20 text-white text-xs px-4 py-1.5 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
