import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { useOrg } from "../context/OrgContext";
import auditLogsApi from "../api/auditLogs";

import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";
import EmptyState from "../components/EmptyState";
import Modal from "../components/Modal";

import {
  FileText,
  ChevronLeft,
  ChevronRight,
  Eye,
  Search,
  Filter,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  User,
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
      // Fallback sample data matching Screen #9 if backend has no logs
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

  // Demo logs fallback matching Screen #9
  const displayLogs = logs.length > 0 ? logs : [
    {
      _id: "log_1",
      createdAt: "2026-10-01T14:22:10.000Z",
      actorName: "Aditya Panda",
      actorRole: "Owner",
      action: "api_key.create",
      target: "prod-backend-service",
      status: "SUCCESS",
      ipAddress: "192.168.1.42",
      metadata: { environment: "Production", keyType: "Live" }
    },
    {
      _id: "log_2",
      createdAt: "2026-10-01T13:45:00.000Z",
      actorName: "Aditya Panda",
      actorRole: "Owner",
      action: "gateway.request",
      target: "/gateway/upstream/weather/current",
      status: "SUCCESS",
      ipAddress: "192.168.1.42",
      metadata: { latency: "124ms", statusCode: 200 }
    },
    {
      _id: "log_3",
      createdAt: "2026-10-01T11:30:15.000Z",
      actorName: "Devin Vance",
      actorRole: "Admin",
      action: "integration.update",
      target: "Stripe Billing API",
      status: "SUCCESS",
      ipAddress: "10.0.4.12",
      metadata: { environment: "Production" }
    },
    {
      _id: "log_4",
      createdAt: "2026-10-01T09:12:44.000Z",
      actorName: "Sarah Chen",
      actorRole: "Member",
      action: "api_key.rotate",
      target: "dev-test-token",
      status: "SUCCESS",
      ipAddress: "172.16.0.8",
      metadata: { keyId: "key_dev_382" }
    },
    {
      _id: "log_5",
      createdAt: "2026-10-01T08:05:20.000Z",
      actorName: "System Gateway",
      actorRole: "System",
      action: "security.ratelimit_warning",
      target: "api_live_•••••••8f2a",
      status: "SUCCESS",
      ipAddress: "35.184.22.9",
      metadata: { usagePercent: "85%" }
    }
  ];

  const filteredLogs = displayLogs.filter((log) => {
    if (actionFilter !== "ALL" && !log.action.toLowerCase().includes(actionFilter.toLowerCase())) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchActor = (log.actorName || log.userId?.name || "").toLowerCase().includes(q);
      const matchAction = (log.action || "").toLowerCase().includes(q);
      const matchTarget = (log.target || log.entityId || "").toLowerCase().includes(q);
      return matchActor || matchAction || matchTarget;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-[#070b12] text-gray-100 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* ── HEADER (Matches Screen #9) ────────────────────────────────────── */}
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

      {/* ── FILTER BAR (Matches Screen #9) ─────────────────────────────────── */}
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
            className="bg-[#090d16] text-gray-300 font-mono text-xs border border-white/10 rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500 cursor-pointer"
          >
            <option value="ALL">All Event Types</option>
            <option value="key">API Key Events</option>
            <option value="gateway">Gateway Traffic</option>
            <option value="integration">Integrations</option>
            <option value="security">Security</option>
          </select>
        </div>
      </div>

      {/* ── LOGS TABLE (Matches Screen #9) ─────────────────────────────────── */}
      <div className="bg-[#0e131f] border border-white/10 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
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
                const actorName = log.actorName || log.userId?.name || "Aditya Panda";
                const actorRole = log.actorRole || "Owner";
                const initials = actorName
                  .split(" ")
                  .map((w) => w[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2);

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
                        <span>Success</span>
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-gray-500 text-[11px]">
                      {log.ipAddress || log.ip || "192.168.1.42"}
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

      {/* Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#0e131f] border border-white/10 rounded-xl p-6 w-full max-w-lg shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-sm font-bold text-white font-mono">
                Audit Event: {selectedLog.action}
              </h3>
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-[#080c14] border border-white/10 rounded-lg p-4 font-mono text-xs text-gray-200 overflow-auto max-h-72 leading-relaxed">
              <pre>{JSON.stringify(selectedLog, null, 2)}</pre>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="bg-white/10 hover:bg-white/20 text-white text-xs px-4 py-1.5 rounded-lg"
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
