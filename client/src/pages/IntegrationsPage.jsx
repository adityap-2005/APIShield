/**
 * IntegrationsPage.jsx
 *
 * Professional developer console for managing Integrations and upstream connections.
 * Hierarchy: Organization -> Project -> Environment -> Integration -> Upstream API
 */

import { useState, useEffect, useMemo } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { useOrg } from "../context/OrgContext";
import projectsApi from "../api/projects";
import integrationsApi from "../api/integrations";
import upstreamApisApi from "../api/upstreamApis";

import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";
import EmptyState from "../components/EmptyState";
import Modal from "../components/Modal";
import ConfirmModal from "../components/ConfirmModal";

import {
  Blocks,
  Plus,
  Server,
  Play,
  Search,
  Settings,
} from "lucide-react";

const ENV_STAGE_STYLES = {
  PRODUCTION: {
    badge: "text-[#f59e0b] border-[#f59e0b]/40 bg-[#f59e0b]/10",
    dot: "bg-[#f59e0b]",
  },
  STAGING: {
    badge: "text-purple-400 border-purple-500/40 bg-purple-500/10",
    dot: "bg-purple-400",
  },
  DEVELOPMENT: {
    badge: "text-blue-400 border-blue-500/40 bg-blue-500/10",
    dot: "bg-blue-400",
  },
  TEST: {
    badge: "text-emerald-400 border-emerald-500/40 bg-emerald-500/10",
    dot: "bg-emerald-400",
  },
};

export default function IntegrationsPage() {
  const { activeOrg, activeProject, switchUpstreamApi, switchIntegration } = useOrg();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Project state
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(
    searchParams.get("projectId") || activeProject?._id || ""
  );
  const [loadingProjects, setLoadingProjects] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterEnv, setFilterEnv] = useState(
    searchParams.get("env")?.toUpperCase() || "ALL"
  ); // ALL | DEVELOPMENT | STAGING | PRODUCTION | TEST

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
  const [newEnvironment, setNewEnvironment] = useState("PRODUCTION");
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

  // Handle URL query actions and environment filters
  useEffect(() => {
    if (searchParams.get("action") === "create") {
      setShowCreateModal(true);
    }
    const envParam = searchParams.get("env");
    if (envParam) {
      setFilterEnv(envParam.toUpperCase());
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

  // Flattened integrations by environment for easy filtering
  const flattenedIntegrations = useMemo(() => {
    const list = [];
    integrations.forEach((integ) => {
      const envs = integ.environments || [];
      if (envs.length === 0) {
        list.push({
          ...integ,
          envName: "PRODUCTION",
          envStatus: integ.status || "ACTIVE",
          upstreamApis: [],
        });
      } else {
        envs.forEach((env) => {
          list.push({
            ...integ,
            envId: env._id,
            envName: env.name || "PRODUCTION",
            envStatus: env.status || "ACTIVE",
            upstreamApis: env.upstreamApis || [],
          });
        });
      }
    });

    return list.filter((item) => {
      const matchEnv =
        filterEnv === "ALL" ||
        item.envName.toUpperCase() === filterEnv.toUpperCase();
      const matchSearch =
        searchQuery === "" ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.envName.toLowerCase().includes(searchQuery.toLowerCase());
      return matchEnv && matchSearch;
    });
  }, [integrations, filterEnv, searchQuery]);

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

    try {
      setCreateSubmitting(true);
      setCreateError("");

      const payload = {
        name: newIntegrationName.trim(),
        environment: newEnvironment,
        upstreamApiName: newUpstreamName.trim() || undefined,
        baseUrl: newBaseUrl.trim() || undefined,
        path: newPath.trim() || undefined,
        upstreamCredential: newCredential.trim() ? {
          type: newAuthType,
          headerName: newAuthKeyName.trim() || undefined,
          apiKey: newCredential.trim(),
        } : undefined,
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
    setNewEnvironment("PRODUCTION");
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

  const handleTestIntegration = (integ, api) => {
    switchIntegration(integ);
    if (api) {
      switchUpstreamApi(api);
    }
    navigate("/test-api");
  };

  if (loadingProjects) {
    return <LoadingSpinner message="Loading workspace projects..." />;
  }

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
          <h1 className="text-xl font-bold text-white tracking-tight">Integrations</h1>
          <p className="text-xs text-gray-400 mt-1">
            Manage connections to your upstream APIs across environments.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Project Selector if multiple projects exist */}
          {projects.length > 1 && (
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="bg-[#0e131f] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
            >
              {projects.map((p) => (
                <option key={p._id} value={p._id}>
                  Project: {p.name}
                </option>
              ))}
            </select>
          )}

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-[#10b981] hover:bg-emerald-400 text-black font-semibold text-xs transition-colors shadow-sm shadow-emerald-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>Add Integration</span>
          </button>
        </div>
      </div>

      {error && <ErrorMessage message={error} />}

      {/* ── SEARCH & FILTER CONTROLS ───────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0e131f] border border-white/10 rounded-xl p-3">
        {/* Search input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search integrations by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#070b12] border border-white/10 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Environment Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          {["ALL", "DEVELOPMENT", "STAGING", "PRODUCTION", "TEST"].map((env) => {
            const isActive = filterEnv === env;
            return (
              <button
                key={env}
                onClick={() => setFilterEnv(env)}
                className={`px-3 py-1 rounded-md text-xs font-mono font-medium transition-colors uppercase ${
                  isActive
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                {env}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── INTEGRATIONS TABLE ──────────────────────────────────────────────── */}
      {loadingData ? (
        <LoadingSpinner message="Loading integrations..." />
      ) : flattenedIntegrations.length === 0 ? (
        <div className="bg-[#0e131f] border border-white/10 rounded-xl p-12 text-center">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-4">
            <Blocks className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-white mb-1">No Integrations Configured</h3>
          <p className="text-xs text-gray-400 max-w-md mx-auto mb-6">
            Connect your first upstream API service to enable routing, rate limiting, and analytics.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#10b981] hover:bg-emerald-400 text-black font-semibold text-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Integration</span>
          </button>
        </div>
      ) : (
        <div className="bg-[#0e131f] border border-white/10 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.02] text-[11px] font-mono text-gray-400 uppercase tracking-wider">
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Environment</th>
                  <th className="px-4 py-3 font-medium">Upstream APIs</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Last Activity</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {flattenedIntegrations.map((item, idx) => {
                  const upper = item.envName.toUpperCase();
                  const stage = ENV_STAGE_STYLES[upper] || ENV_STAGE_STYLES.PRODUCTION;
                  const apisCount = (item.upstreamApis || []).length;
                  const isActive = item.status === "ACTIVE";

                  return (
                    <tr key={`${item._id}-${item.envName}-${idx}`} className="hover:bg-white/[0.02] transition-colors">
                      {/* Name */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-emerald-400 shrink-0">
                            <Blocks className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-semibold text-white text-xs">{item.name}</div>
                            <div className="text-[11px] text-gray-500 font-mono">
                              ID: {item._id.slice(-8)}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Environment */}
                      <td className="px-4 py-3.5 font-mono">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider ${stage.badge}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${stage.dot}`} />
                          {item.envName}
                        </span>
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

                      {/* Last Activity */}
                      <td className="px-4 py-3.5 text-gray-400 font-mono text-[11px]">
                        {item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : "Active today"}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleTestIntegration(item, item.upstreamApis?.[0])}
                            className="p-1.5 rounded-md hover:bg-emerald-500/10 text-emerald-400 hover:text-emerald-300 border border-white/5 hover:border-emerald-500/30 transition-colors"
                            title="Test API"
                          >
                            <Play className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleToggleStatus(item)}
                            className="p-1.5 rounded-md hover:bg-white/10 text-gray-400 hover:text-white border border-white/5 transition-colors"
                            title={isActive ? "Disable Integration" : "Enable Integration"}
                          >
                            <Settings className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
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
            <div className="p-3 bg-red-950/60 border border-red-800/60 rounded-md text-red-300 text-xs">
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

          <div>
            <label className="label">Target Environment *</label>
            <select
              value={newEnvironment}
              onChange={(e) => setNewEnvironment(e.target.value)}
              className="input"
            >
              <option value="PRODUCTION">Production</option>
              <option value="STAGING">Staging</option>
              <option value="DEVELOPMENT">Development</option>
              <option value="TEST">Test</option>
            </select>
          </div>

          <div className="pt-2 border-t border-white/10">
            <h4 className="text-xs font-mono font-semibold text-gray-300 uppercase tracking-wider mb-2">
              Initial Upstream API (Optional)
            </h4>

            <div className="space-y-3">
              <div>
                <label className="label">Upstream Name</label>
                <input
                  type="text"
                  placeholder="e.g. Current Weather Forecast"
                  value={newUpstreamName}
                  onChange={(e) => setNewUpstreamName(e.target.value)}
                  className="input"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="label">Base URL</label>
                  <input
                    type="url"
                    placeholder="https://api.open-meteo.com"
                    value={newBaseUrl}
                    onChange={(e) => setNewBaseUrl(e.target.value)}
                    className="input font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="label">Gateway Path</label>
                  <input
                    type="text"
                    placeholder="/v1/forecast"
                    value={newPath}
                    onChange={(e) => setNewPath(e.target.value)}
                    className="input font-mono text-xs"
                  />
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

              {newAuthType !== "NONE" && (
                <div>
                  <label className="label">Upstream Secret / Token</label>
                  <input
                    type="password"
                    placeholder="Secret key for upstream target"
                    value={newCredential}
                    onChange={(e) => setNewCredential(e.target.value)}
                    className="input font-mono text-xs"
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

      {/* Confirmation Dialog */}
      <ConfirmModal
        isOpen={confirmState.isOpen}
        onClose={() => setConfirmState((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmState.action}
        title={confirmState.title}
        message={confirmState.description}
        confirmText={confirmState.confirmText}
        loading={confirmState.loading}
      />
    </div>
  );
}
