/**
 * AuditLogsPage.jsx
 *
 * Paginated organization audit logs viewer.
 * Integrates with real backend endpoints: GET /organizations/:orgId/audit-logs?page=X&limit=Y
 * and GET /organizations/:orgId/audit-logs/:auditLogId for detailed metadata inspection.
 */

import { useState, useEffect } from "react";
import { useOrg } from "../context/OrgContext";
import auditLogsApi from "../api/auditLogs";

import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";
import EmptyState from "../components/EmptyState";
import Badge from "../components/Badge";
import Modal from "../components/Modal";

import { FileText, ChevronLeft, ChevronRight, Eye } from "lucide-react";

export default function AuditLogsPage() {
  const { activeOrg } = useOrg();

  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [currentPage, setCurrentPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Detail Modal
  const [selectedLog, setSelectedLog] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const loadLogs = async (page = 1) => {
    if (!activeOrg) return;
    try {
      setLoading(true);
      setError("");
      const response = await auditLogsApi.getAll(activeOrg._id, page, 20);
      const data = response.data?.data;
      setLogs(data?.logs || []);
      setPagination(data?.pagination || { page: 1, limit: 20, total: 0, totalPages: 1 });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load audit logs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs(currentPage);
  }, [activeOrg, currentPage]);

  const handleViewDetail = async (auditLogId) => {
    try {
      setLoadingDetail(true);
      const response = await auditLogsApi.getById(activeOrg._id, auditLogId);
      setSelectedLog(response.data?.data);
    } catch (err) {
      alert("Failed to fetch log details.");
    } finally {
      setLoadingDetail(false);
    }
  };

  if (!activeOrg) {
    return <EmptyState message="No active organization selected." />;
  }

  if (loading && logs.length === 0) {
    return <LoadingSpinner message="Loading audit logs..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <FileText className="w-5 h-5 text-brand-400" />
            Audit Logs
          </h1>
          <p className="page-description">Immutable log of security and management events in your organization</p>
        </div>
      </div>

      {error && <ErrorMessage message={error} onRetry={() => loadLogs(currentPage)} />}

      {/* Logs Table */}
      {!error && (
        logs.length === 0 ? (
          <EmptyState message="No audit logs recorded for this organization." />
        ) : (
          <div className="space-y-4">
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Action</th>
                    <th>Actor</th>
                    <th>Entity Type</th>
                    <th>Entity Name / ID</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log._id}>
                      <td className="text-xs font-mono text-gray-400 whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td>
                        <Badge variant="info">{log.action}</Badge>
                      </td>
                      <td>
                        <div className="text-xs font-medium text-gray-200">{log.actor?.name || "System"}</div>
                        <div className="text-[10px] text-gray-500 font-mono">{log.actor?.email}</div>
                      </td>
                      <td>
                        <Badge variant="purple">{log.entity?.type}</Badge>
                      </td>
                      <td className="font-mono text-xs text-gray-300">
                        {log.entity?.name || log.entity?.id}
                      </td>
                      <td>
                        <button
                          onClick={() => handleViewDetail(log._id)}
                          className="p-1.5 hover:bg-gray-800 text-brand-400 rounded transition-colors"
                          title="View Full Metadata"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between pt-2 text-xs">
                <span className="text-gray-400">
                  Page <span className="font-bold text-gray-200">{pagination.page}</span> of{" "}
                  <span className="font-bold text-gray-200">{pagination.totalPages}</span> ({pagination.total} total logs)
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1 || loading}
                    className="btn-secondary text-xs px-3 py-1.5"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" /> Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
                    disabled={currentPage === pagination.totalPages || loading}
                    className="btn-secondary text-xs px-3 py-1.5"
                  >
                    Next <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )
      )}

      {/* Modal: Audit Log Details JSON */}
      <Modal isOpen={Boolean(selectedLog)} onClose={() => setSelectedLog(null)} title="Audit Log Entry Metadata" size="lg">
        {selectedLog && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-xs bg-gray-950 p-3 rounded border border-gray-800">
              <div>
                <span className="text-gray-500 uppercase tracking-wider block font-semibold text-[10px]">Action</span>
                <span className="text-brand-400 font-mono font-semibold">{selectedLog.action}</span>
              </div>
              <div>
                <span className="text-gray-500 uppercase tracking-wider block font-semibold text-[10px]">Timestamp</span>
                <span className="text-gray-300 font-mono">{new Date(selectedLog.createdAt).toLocaleString()}</span>
              </div>
              <div>
                <span className="text-gray-500 uppercase tracking-wider block font-semibold text-[10px]">Actor</span>
                <span className="text-gray-300">{selectedLog.actor?.name} ({selectedLog.actor?.email})</span>
              </div>
              <div>
                <span className="text-gray-500 uppercase tracking-wider block font-semibold text-[10px]">Entity</span>
                <span className="text-gray-300 font-mono">{selectedLog.entity?.type}: {selectedLog.entity?.name || selectedLog.entity?.id}</span>
              </div>
            </div>

            <div>
              <label className="label">Raw Metadata Payload</label>
              <pre className="bg-gray-950 p-3 rounded border border-gray-800 text-[11px] font-mono text-green-400 overflow-x-auto">
                {JSON.stringify(selectedLog.metadata || {}, null, 2)}
              </pre>
            </div>

            <div className="flex justify-end pt-2 border-t border-gray-800">
              <button onClick={() => setSelectedLog(null)} className="btn-secondary text-xs">
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
