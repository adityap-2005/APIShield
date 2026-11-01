import { useState, useEffect, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useOrg } from "../context/OrgContext";
import projectsApi from "../api/projects";
import integrationsApi from "../api/integrations";

import LoadingSpinner from "../components/LoadingSpinner";
import Modal from "../components/Modal";
import ConfirmModal from "../components/ConfirmModal";
import { canManageIntegrations } from "../utils/permissions";

import {
  Blocks,
  Server,
  Plus,
  Settings,
  Search,
} from "lucide-react";

export default function IntegrationsPage() {
  const { activeOrg, activeProject } = useOrg();
  const [searchParams] = useSearchParams();

  // Project state
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(
    searchParams.get("projectId") || activeProject?._id || ""
  );
  const [loadingProjects, setLoadingProjects] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");

  // Data state
  const [integrations, setIntegrations] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState("");

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState("");

  // Create form state
  const [newIntegrationName, setNewIntegrationName] = useState("");
  const [newUpstreamName, setNewUpstreamName] = useState("");
  const [newBaseUrl, setNewBaseUrl] = useState("");
  const [newPath, setNewPath] = useState("");
  const [newAuthType, setNewAuthType] = useState("NONE");
  const [newAuthKeyName, setNewAuthKeyName] = useState("");
  const [newCredential, setNewCredential] = useState("");

  // Confirmation Modal
  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    integrationId: null,
    title: "",
    description: "",
    confirmText: "",
    action: null,
    loading: false,
  });

  // Load projects
  useEffect(() => {
    if (!activeOrg?._id) return;
    loadProjects();
  }, [activeOrg]);

  // Sync selectedProjectId when activeProject changes
  useEffect(() => {
    if (activeProject?._id && !searchParams.get("projectId")) {
      setSelectedProjectId(activeProject._id);
    }
  }, [activeProject]);

  // Load Integrations when project changes
  useEffect(() => {
    if (selectedProjectId) {
      loadIntegrations(selectedProjectId);
    } else {
      setIntegrations([]);
    }
  }, [selectedProjectId]);

  // Handle URL query actions
  useEffect(() => {
    if (searchParams.get("action") === "create") {
      setShowCreateModal(true);
    }
  }, [searchParams]);

  const loadProjects = async () => {
    try {
      setLoadingProjects(true);
      setError("");
      const response = await projectsApi.getAll(activeOrg._id);
      const projectList = response.data?.data || [];
      setProjects(projectList);
      if (projectList.length > 0 && !selectedProjectId) {
        setSelectedProjectId(projectList[0]._id);
      }
    } catch {
      setError("Failed to load workspace projects.");
    } finally {
      setLoadingProjects(false);
    }
  };

  const loadIntegrations = async (projectId) => {
    try {
      setLoadingData(true);
      setError("");
      const response = await integrationsApi.getAll(activeOrg._id, projectId);
      setIntegrations(response.data?.data || []);
    } catch {
      setError("Failed to load integrations for selected project.");
    } finally {
      setLoadingData(false);
    }
  };

  const filteredIntegrations = useMemo(() => {
    return integrations.filter((item) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        item.name?.toLowerCase().includes(q) ||
        (item.upstreamApis || []).some((api) => api.name?.toLowerCase().includes(q))
      );
    });
  }, [integrations, searchQuery]);

  const handleCreateIntegration = async (e) => {
    e.preventDefault();
    if (!newIntegrationName.trim()) {
      setCreateError("Integration name is required.");
      return;
    }
    if (!selectedProjectId) {
      setCreateError("Please select a project first.");
      return;
    }
    if (!newBaseUrl.trim()) {
      setCreateError("Upstream target base URL is required.");
      return;
    }
    if (newAuthType === "API_KEY_HEADER" && !newAuthKeyName.trim()) {
      setCreateError("Authentication key name is required for API key authentication.");
      return;
    }
    if (newAuthType !== "NONE" && !newCredential.trim()) {
      setCreateError("Upstream secret / credential is required.");
      return;
    }

    try {
      setCreateSubmitting(true);
      setCreateError("");

      const cleanPath = newPath.trim()
        ? (newPath.trim().startsWith("/") ? newPath.trim() : `/${newPath.trim()}`)
        : "/";

      const payload = {
        name: newIntegrationName.trim(),
        upstreamApiName: newUpstreamName.trim() || `${newIntegrationName.trim()} API`,
        baseUrl: newBaseUrl.trim(),
        path: cleanPath,
        authentication: {
          type: newAuthType,
          keyName: newAuthType === "API_KEY_HEADER" ? (newAuthKeyName.trim() || "x-api-key") : undefined,
        },
        upstreamCredential: newCredential.trim() || undefined,
      };

      await integrationsApi.create(activeOrg._id, selectedProjectId, payload);
      setShowCreateModal(false);
      resetForm();
      loadIntegrations(selectedProjectId);
    } catch (err) {
      setCreateError(err.response?.data?.message || "Failed to create integration.");
    } finally {
      setCreateSubmitting(false);
    }
  };

  const resetForm = () => {
    setNewIntegrationName("");
    setNewUpstreamName("");
    setNewBaseUrl("");
    setNewPath("");
    setNewAuthType("NONE");
    setNewAuthKeyName("");
    setNewCredential("");
  };

  const handleToggleStatus = (integ) => {
    const isCurrentlyActive = integ.status === "ACTIVE";
    setConfirmState({
      isOpen: true,
      integrationId: integ._id,
      title: isCurrentlyActive ? "Disable Integration" : "Enable Integration",
      description: isCurrentlyActive
        ? `Are you sure you want to disable ${integ.name}? Gateway traffic through this integration will be blocked.`
        : `Enable ${integ.name} to resume gateway traffic routing.`,
      confirmText: isCurrentlyActive ? "Disable" : "Enable",
      action: async () => {
        try {
          setConfirmState((prev) => ({ ...prev, loading: true }));
          await integrationsApi.update(activeOrg._id, selectedProjectId, integ._id, {
            status: isCurrentlyActive ? "DISABLED" : "ACTIVE",
          });
          setConfirmState((prev) => ({ ...prev, isOpen: false, loading: false }));
          loadIntegrations(selectedProjectId);
        } catch {
          setConfirmState((prev) => ({ ...prev, loading: false }));
        }
      },
    });
  };

  if (loadingProjects) {
    return <LoadingSpinner message="Loading workspace projects..." />;
  }

  const currentProject = projects.find((p) => p._id === selectedProjectId) || activeProject;
  const canManage = canManageIntegrations(activeOrg, currentProject);

  return (
    <div className="space-y-6">
      {/* ── HEADER ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-gray-400 font-mono mb-2">
            <Link to="/" className="hover:text-white transition-colors">
              APIShield
            </Link>
            <span>/</span>
            <span className="text-gray-300">Integrations</span>
          </nav>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Integrations</h1>
          <p className="text-xs text-gray-400 mt-1">
            Manage connections to your upstream APIs and service providers.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto flex-wrap">
          {/* Project Selector if multiple projects exist */}
          {projects.length > 1 && (
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="bg-[#0e131f] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
            >
              {projects.map((p) => (
                <option key={p._id} value={p._id}>
                  Project: {p.name}
                </option>
              ))}
            </select>
          )}

          {canManage && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-[#10b981] hover:bg-[#059669] text-[#052e16] font-semibold text-xs px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg shadow-emerald-950/40 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Integration</span>
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-950/60 border border-red-800/60 rounded-xl text-red-300 text-xs">
          {error}
        </div>
      )}

      {/* ── SEARCH BAR ──────────────────────────────────────────────────────── */}
      <div className="bg-[#0e131f] border border-white/10 rounded-xl p-3 shadow-md max-w-md">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search integrations by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#070b12] border border-white/10 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 font-mono"
          />
        </div>
      </div>

      {/* ── INTEGRATIONS DATA (Cards for mobile, Table for tablet/desktop) ── */}
      {loadingData ? (
        <LoadingSpinner message="Loading integrations..." />
      ) : filteredIntegrations.length === 0 ? (
        <div className="bg-[#0e131f] border border-white/10 rounded-xl p-12 text-center">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-4">
            <Blocks className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-white mb-1">No Integrations Configured</h3>
          <p className="text-xs text-gray-400 max-w-md mx-auto mb-6">
            Connect your first upstream API service to enable routing, rate limiting, and analytics.
          </p>
          {canManage && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#10b981] hover:bg-emerald-400 text-black font-semibold text-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Integration</span>
            </button>
          )}
        </div>
      ) : (
        <div className="bg-[#0e131f] border border-white/10 rounded-xl overflow-hidden shadow-sm">
          {/* Mobile Card List View (< 640px) */}
          <div className="sm:hidden divide-y divide-white/5">
            {filteredIntegrations.map((item) => {
              const apisCount = (item.upstreamApis || []).length;
              const isActive = item.status === "ACTIVE";

              return (
                <div key={item._id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-emerald-400 shrink-0">
                        <Blocks className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-semibold text-white text-xs truncate">{item.name}</h4>
                        <p className="text-[10px] text-gray-500 font-mono">ID: {item._id.slice(-8)}</p>
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase shrink-0 ${
                        isActive
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : "bg-gray-500/10 text-gray-400 border border-gray-500/20"
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-emerald-400" : "bg-gray-400"}`} />
                      {isActive ? "Active" : "Disabled"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs font-mono text-gray-400 pt-1 border-t border-white/5">
                    <div className="flex items-center gap-1.5">
                      <Server className="w-3.5 h-3.5 text-gray-500" />
                      <span>{apisCount} {apisCount === 1 ? "endpoint" : "endpoints"}</span>
                    </div>

                    {canManage && (
                      <button
                        onClick={() => handleToggleStatus(item)}
                        className="p-1.5 rounded-md hover:bg-white/10 text-gray-400 hover:text-white border border-white/10 transition-colors"
                        title={isActive ? "Disable Integration" : "Enable Integration"}
                        aria-label="Toggle Integration Status"
                      >
                        <Settings className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table View (>= 640px) */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[640px]">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.02] text-[11px] font-mono text-gray-400 uppercase tracking-wider">
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Upstream APIs</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Created At</th>
                  <th className="px-4 py-3 font-medium">Last Activity</th>
                  {canManage && <th className="px-4 py-3 font-medium text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredIntegrations.map((item) => {
                  const apisCount = (item.upstreamApis || []).length;
                  const isActive = item.status === "ACTIVE";

                  return (
                    <tr key={item._id} className="hover:bg-white/[0.02] transition-colors">
                      {/* Name */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-emerald-400 shrink-0">
                            <Blocks className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-white text-xs truncate max-w-[180px]">{item.name}</div>
                            <div className="text-[11px] text-gray-500 font-mono">
                              ID: {item._id.slice(-8)}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Upstream APIs */}
                      <td className="px-4 py-3.5 font-mono text-gray-300">
                        <div className="flex items-center gap-1.5">
                          <Server className="w-3.5 h-3.5 text-gray-400" />
                          <span>{apisCount} {apisCount === 1 ? "endpoint" : "endpoints"}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5 font-mono">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                          isActive
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : "bg-gray-500/10 text-gray-400 border border-gray-500/20"
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-emerald-400" : "bg-gray-400"}`} />
                          {isActive ? "Active" : "Disabled"}
                        </span>
                      </td>

                      {/* Created At */}
                      <td className="px-4 py-3.5 text-gray-400 font-mono text-[11px]">
                        {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "N/A"}
                      </td>

                      {/* Last Activity */}
                      <td className="px-4 py-3.5 text-gray-400 font-mono text-[11px]">
                        {item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : "N/A"}
                      </td>

                      {/* Actions */}
                      {canManage && (
                        <td className="px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleToggleStatus(item)}
                              className="p-1.5 rounded-md hover:bg-white/10 text-gray-400 hover:text-white border border-white/5 transition-colors"
                              title={isActive ? "Disable Integration" : "Enable Integration"}
                              aria-label="Toggle status"
                            >
                              <Settings className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── CREATE INTEGRATION MODAL ────────────────────────────────────────── */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Add New Integration"
      >
        <form onSubmit={handleCreateIntegration} className="space-y-4">
          {createError && (
            <div className="p-3 bg-red-950/60 border border-red-800/60 rounded-xl text-red-300 text-xs">
              {createError}
            </div>
          )}

          <div>
            <label className="label">Integration Name *</label>
            <input
              type="text"
              placeholder="e.g. OpenWeather Service, Stripe Billing"
              value={newIntegrationName}
              onChange={(e) => setNewIntegrationName(e.target.value)}
              className="input"
              required
            />
          </div>

          <div className="pt-2 border-t border-white/10">
            <h4 className="text-xs font-mono font-semibold text-gray-300 uppercase tracking-wider mb-2">
              Initial Upstream API Configuration
            </h4>

            <div className="space-y-3">
              <div>
                <label className="label">Upstream API Name (Optional)</label>
                <input
                  type="text"
                  placeholder={newIntegrationName.trim() ? `${newIntegrationName.trim()} API` : "e.g. Weather Forecast Endpoint"}
                  value={newUpstreamName}
                  onChange={(e) => setNewUpstreamName(e.target.value)}
                  className="input"
                />
                <span className="text-[10px] text-gray-500 font-mono mt-1 block">
                  Defaults to your integration name if left blank
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="label">Upstream Base URL *</label>
                  <input
                    type="url"
                    placeholder="https://api.open-meteo.com"
                    value={newBaseUrl}
                    onChange={(e) => setNewBaseUrl(e.target.value)}
                    className="input font-mono text-xs"
                    required
                  />
                  <span className="text-[10px] text-gray-500 font-mono mt-1 block">Root URL of destination API</span>
                </div>
                <div>
                  <label className="label">Upstream Path</label>
                  <input
                    type="text"
                    placeholder="/v1/forecast"
                    value={newPath}
                    onChange={(e) => setNewPath(e.target.value)}
                    className="input font-mono text-xs"
                  />
                  <span className="text-[10px] text-gray-500 font-mono mt-1 block">Target path, defaults to /</span>
                </div>
              </div>

              <div>
                <label className="label">Authentication Type</label>
                <select
                  value={newAuthType}
                  onChange={(e) => setNewAuthType(e.target.value)}
                  className="input"
                >
                  <option value="NONE">None (Public API)</option>
                  <option value="API_KEY_HEADER">API Key Header</option>
                  <option value="BEARER">Bearer Token</option>
                </select>
              </div>

              {newAuthType === "API_KEY_HEADER" && (
                <div>
                  <label className="label">Header Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. x-api-key or Authorization"
                    value={newAuthKeyName}
                    onChange={(e) => setNewAuthKeyName(e.target.value)}
                    className="input font-mono text-xs"
                    required
                  />
                </div>
              )}

              {newAuthType !== "NONE" && (
                <div>
                  <label className="label">Upstream Secret / Token *</label>
                  <input
                    type="password"
                    placeholder="Secret key for upstream target"
                    value={newCredential}
                    onChange={(e) => setNewCredential(e.target.value)}
                    className="input font-mono text-xs"
                    required
                  />
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="btn-secondary text-xs"
              disabled={createSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary text-xs"
              disabled={createSubmitting}
            >
              {createSubmitting ? "Creating..." : "Create Integration"}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── CONFIRMATION MODAL ────────────────────────────────────────────── */}
      <ConfirmModal
        isOpen={confirmState.isOpen}
        onClose={() => setConfirmState((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmState.action}
        title={confirmState.title}
        description={confirmState.description}
        confirmText={confirmState.confirmText}
        loading={confirmState.loading}
      />
    </div>
  );
}
