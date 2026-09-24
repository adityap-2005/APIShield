/**
 * IntegrationsPage.jsx
 *
 * Full Integration, Environment & Upstream API management page.
 * Hierarchy: Organization -> Team -> Integration -> Environment -> Upstream APIs
 *
 * Capabilities:
 * - Select Team
 * - View Integrations list with Environment badges & status
 * - Create Integration + initial Environment + initial Upstream API atomically
 * - Select / inspect an Integration
 * - Add additional Environments (PRODUCTION, STAGING, DEVELOPMENT, TEST) to an Integration
 * - Manage Upstream APIs per Environment:
 *     - List upstream APIs (name, baseUrl, path, status, encrypted credentials)
 *     - Add Upstream API with credentials encrypted on backend
 *     - Edit Upstream API (name, baseUrl, path, rotate credential, status)
 *     - Toggle status (ACTIVE / REVOKED)
 * - Test Gateway live with APIShield Access Key (x-api-key) against /gateway/upstream/:upstreamApiId/weather
 * - Direct link to manage APIShield Access Keys for any Environment
 */

import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useOrg } from "../context/OrgContext";
import teamsApi from "../api/teams";
import integrationsApi from "../api/integrations";
import upstreamApisApi from "../api/upstreamApis";
import gatewayApi from "../api/gateway";

import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";
import EmptyState from "../components/EmptyState";
import Badge from "../components/Badge";
import Modal from "../components/Modal";
import ConfirmModal from "../components/ConfirmModal";

import {
  Blocks,
  Plus,
  Server,
  KeyRound,
  Ban,
  Activity,
  ChevronRight,
  ChevronDown,
  Edit2,
  CheckCircle2,
  AlertTriangle,
  Globe,
  Layers,
  ArrowRight,
  Lock,
  Play,
  Copy,
  Check,
  RefreshCw,
  ExternalLink
} from "lucide-react";

const ENV_OPTIONS = ["PRODUCTION", "STAGING", "DEVELOPMENT", "TEST"];

export default function IntegrationsPage() {
  const { activeOrg } = useOrg();
  const [searchParams] = useSearchParams();

  // Team state
  const [teams, setTeams] = useState([]);
  const [selectedTeamId, setSelectedTeamId] = useState(searchParams.get("teamId") || "");
  const [loadingTeams, setLoadingTeams] = useState(true);

  // Integrations state
  const [integrations, setIntegrations] = useState([]);
  const [loadingIntegrations, setLoadingIntegrations] = useState(false);
  const [error, setError] = useState("");

  // Selected Integration for detailed drawer/view
  const [selectedIntegrationId, setSelectedIntegrationId] = useState(null);

  // Modals state
  const [showCreateIntegrationModal, setShowCreateIntegrationModal] = useState(false);
  const [showAddEnvModal, setShowAddEnvModal] = useState(false);
  const [showAddUpstreamModal, setShowAddUpstreamModal] = useState(false);
  const [showEditUpstreamModal, setShowEditUpstreamModal] = useState(false);
  const [showGatewayTestModal, setShowGatewayTestModal] = useState(false);

  // Target Environment for Add Upstream Modal
  const [targetEnvForUpstream, setTargetEnvForUpstream] = useState(null);

  // Target Upstream API for Edit Modal
  const [editingUpstreamApi, setEditingUpstreamApi] = useState(null);
  const [editingUpstreamEnvId, setEditingUpstreamEnvId] = useState(null);

  // Target Upstream API for Gateway Test Modal
  const [testUpstreamApi, setTestUpstreamApi] = useState(null);
  const [testEnv, setTestEnv] = useState(null);
  const [testApiKey, setTestApiKey] = useState("");
  const [testCity, setTestCity] = useState("London");
  const [testingGateway, setTestingGateway] = useState(false);
  const [gatewayTestResult, setGatewayTestResult] = useState(null);
  const [copiedTestResponse, setCopiedTestResponse] = useState(false);

  // Create Integration Form State (Atomic: Integration + Env + Upstream API)
  const [newIntegrationName, setNewIntegrationName] = useState("");
  const [newIntegrationEnv, setNewIntegrationEnv] = useState("DEVELOPMENT");
  const [newUpstreamName, setNewUpstreamName] = useState("");
  const [newBaseUrl, setNewBaseUrl] = useState("");
  const [newPath, setNewPath] = useState("");
  const [newUpstreamCredential, setNewUpstreamCredential] = useState("");
  const [createIntegrationSubmitting, setCreateIntegrationSubmitting] = useState(false);
  const [createIntegrationError, setCreateIntegrationError] = useState("");

  // Add Environment Form State
  const [newEnvName, setNewEnvName] = useState("PRODUCTION");
  const [addEnvSubmitting, setAddEnvSubmitting] = useState(false);
  const [addEnvError, setAddEnvError] = useState("");

  // Add Upstream API Form State
  const [addApiName, setAddApiName] = useState("");
  const [addApiBaseUrl, setAddApiBaseUrl] = useState("");
  const [addApiPath, setAddApiPath] = useState("");
  const [addApiCredential, setAddApiCredential] = useState("");
  const [addApiSubmitting, setAddApiSubmitting] = useState(false);
  const [addApiError, setAddApiError] = useState("");

  // Edit Upstream API Form State
  const [editApiName, setEditApiName] = useState("");
  const [editApiBaseUrl, setEditApiBaseUrl] = useState("");
  const [editApiPath, setEditApiPath] = useState("");
  const [editApiStatus, setEditApiStatus] = useState("ACTIVE");
  const [editApiCredential, setEditApiCredential] = useState("");
  const [editApiSubmitting, setEditApiSubmitting] = useState(false);
  const [editApiError, setEditApiError] = useState("");

  // Confirmation Modal State
  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    type: null, // "disableIntegration" | "disableEnv" | "toggleUpstreamStatus"
    targetId: null,
    meta: null,
    title: "",
    description: "",
    confirmText: "",
    variant: "danger",
    loading: false,
  });

  // Load Teams
  useEffect(() => {
    if (!activeOrg) return;
    loadTeams();
  }, [activeOrg]);

  // Load Integrations when Team changes
  useEffect(() => {
    if (selectedTeamId) {
      loadIntegrations(selectedTeamId);
    } else {
      setIntegrations([]);
      setSelectedIntegrationId(null);
    }
  }, [selectedTeamId]);

  const loadTeams = async () => {
    try {
      setLoadingTeams(true);
      setError("");
      const response = await teamsApi.getAll(activeOrg._id);
      const teamList = response.data?.data || [];
      setTeams(teamList);
      if (teamList.length > 0) {
        const queryTeamId = searchParams.get("teamId");
        const matched = teamList.find((t) => t._id === queryTeamId);
        setSelectedTeamId(matched ? matched._id : teamList[0]._id);
      } else {
        setSelectedTeamId("");
      }
    } catch (err) {
      setError("Failed to load teams.");
    } finally {
      setLoadingTeams(false);
    }
  };

  const loadIntegrations = async (teamId) => {
    try {
      setLoadingIntegrations(true);
      setError("");
      const response = await integrationsApi.getAll(activeOrg._id, teamId);
      const data = response.data?.data || [];
      setIntegrations(data);

      // Auto-select first integration if none or invalid
      if (data.length > 0) {
        setSelectedIntegrationId((prev) => {
          if (prev && data.some((i) => i._id === prev)) return prev;
          return data[0]._id;
        });
      } else {
        setSelectedIntegrationId(null);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load integrations for this team.");
    } finally {
      setLoadingIntegrations(false);
    }
  };

  // Find currently selected integration
  const selectedIntegration = integrations.find((i) => i._id === selectedIntegrationId) || null;

  // ── Create Integration (Atomic) ──────────────────────────────────────────────
  const handleOpenCreateIntegrationModal = () => {
    setNewIntegrationName("");
    setNewIntegrationEnv("DEVELOPMENT");
    setNewUpstreamName("");
    setNewBaseUrl("");
    setNewPath("");
    setNewUpstreamCredential("");
    setCreateIntegrationError("");
    setShowCreateIntegrationModal(true);
  };

  const handleCreateIntegration = async (e) => {
    e.preventDefault();
    if (
      !newIntegrationName.trim() ||
      !newUpstreamName.trim() ||
      !newBaseUrl.trim() ||
      !newPath.trim() ||
      !newUpstreamCredential.trim()
    ) {
      setCreateIntegrationError("All fields including upstream credential are required.");
      return;
    }

    try {
      setCreateIntegrationSubmitting(true);
      setCreateIntegrationError("");

      const payload = {
        name: newIntegrationName.trim(),
        environment: newIntegrationEnv,
        upstreamApiName: newUpstreamName.trim(),
        baseUrl: newBaseUrl.trim(),
        path: newPath.trim(),
        upstreamCredential: newUpstreamCredential.trim(),
      };

      const res = await integrationsApi.create(activeOrg._id, selectedTeamId, payload);
      setShowCreateIntegrationModal(false);

      await loadIntegrations(selectedTeamId);
      if (res.data?.data?.integration?._id) {
        setSelectedIntegrationId(res.data.data.integration._id);
      }
    } catch (err) {
      setCreateIntegrationError(err.response?.data?.message || "Failed to create integration.");
    } finally {
      setCreateIntegrationSubmitting(false);
    }
  };

  // ── Add Environment to Integration ──────────────────────────────────────────
  const handleOpenAddEnvModal = () => {
    // Choose first available env not already present in selected integration
    const existingEnvNames = (selectedIntegration?.environments || []).map((e) => e.name);
    const available = ENV_OPTIONS.filter((opt) => !existingEnvNames.includes(opt));
    setNewEnvName(available[0] || "PRODUCTION");
    setAddEnvError("");
    setShowAddEnvModal(true);
  };

  const handleAddEnvironment = async (e) => {
    e.preventDefault();
    if (!newEnvName) {
      setAddEnvError("Environment name is required.");
      return;
    }

    try {
      setAddEnvSubmitting(true);
      setAddEnvError("");

      await integrationsApi.createEnvironment(
        activeOrg._id,
        selectedTeamId,
        selectedIntegration._id,
        { name: newEnvName }
      );

      setShowAddEnvModal(false);
      await loadIntegrations(selectedTeamId);
    } catch (err) {
      setAddEnvError(err.response?.data?.message || "Failed to add environment.");
    } finally {
      setAddEnvSubmitting(false);
    }
  };

  // ── Add Upstream API to Environment ─────────────────────────────────────────
  const handleOpenAddUpstreamModal = (env) => {
    setTargetEnvForUpstream(env);
    setAddApiName("");
    setAddApiBaseUrl("");
    setAddApiPath("");
    setAddApiCredential("");
    setAddApiError("");
    setShowAddUpstreamModal(true);
  };

  const handleAddUpstreamApi = async (e) => {
    e.preventDefault();
    if (
      !addApiName.trim() ||
      !addApiBaseUrl.trim() ||
      !addApiPath.trim() ||
      !addApiCredential.trim()
    ) {
      setAddApiError("All fields including upstream credential are required.");
      return;
    }

    try {
      setAddApiSubmitting(true);
      setAddApiError("");

      const payload = {
        name: addApiName.trim(),
        baseUrl: addApiBaseUrl.trim(),
        path: addApiPath.trim(),
        upstreamCredential: addApiCredential.trim(),
      };

      await upstreamApisApi.create(
        activeOrg._id,
        selectedTeamId,
        selectedIntegration._id,
        targetEnvForUpstream._id,
        payload
      );

      setShowAddUpstreamModal(false);
      setTargetEnvForUpstream(null);
      await loadIntegrations(selectedTeamId);
    } catch (err) {
      setAddApiError(err.response?.data?.message || "Failed to add Upstream API.");
    } finally {
      setAddApiSubmitting(false);
    }
  };

  // ── Edit Upstream API ───────────────────────────────────────────────────────
  const handleOpenEditUpstreamModal = (envId, api) => {
    setEditingUpstreamEnvId(envId);
    setEditingUpstreamApi(api);
    setEditApiName(api.name || "");
    setEditApiBaseUrl(api.baseUrl || "");
    setEditApiPath(api.path || "");
    setEditApiStatus(api.status || "ACTIVE");
    setEditApiCredential("");
    setEditApiError("");
    setShowEditUpstreamModal(true);
  };

  const handleUpdateUpstreamApi = async (e) => {
    e.preventDefault();
    if (!editApiName.trim() || !editApiBaseUrl.trim() || !editApiPath.trim()) {
      setEditApiError("Name, Base URL, and Path are required.");
      return;
    }

    try {
      setEditApiSubmitting(true);
      setEditApiError("");

      const payload = {
        name: editApiName.trim(),
        baseUrl: editApiBaseUrl.trim(),
        path: editApiPath.trim(),
        status: editApiStatus,
      };

      if (editApiCredential.trim()) {
        payload.upstreamCredential = editApiCredential.trim();
      }

      await upstreamApisApi.update(
        activeOrg._id,
        selectedTeamId,
        selectedIntegration._id,
        editingUpstreamEnvId,
        editingUpstreamApi._id,
        payload
      );

      setShowEditUpstreamModal(false);
      setEditingUpstreamApi(null);
      await loadIntegrations(selectedTeamId);
    } catch (err) {
      setEditApiError(err.response?.data?.message || "Failed to update Upstream API.");
    } finally {
      setEditApiSubmitting(false);
    }
  };

  // ── Status Confirmations ───────────────────────────────────────────────────
  const openDisableIntegrationConfirm = (integration) => {
    setConfirmState({
      isOpen: true,
      type: "disableIntegration",
      targetId: integration._id,
      meta: null,
      title: `Disable Integration "${integration.name}"?`,
      description: `Disabling this integration will block all gateway requests across all environments and upstream APIs under it.`,
      confirmText: "Disable Integration",
      variant: "danger",
      loading: false,
    });
  };

  const openDisableEnvConfirm = (env) => {
    setConfirmState({
      isOpen: true,
      type: "disableEnv",
      targetId: env._id,
      meta: null,
      title: `Disable Environment "${env.name}"?`,
      description: `Disabling this environment will stop all traffic routed through ${env.name}.`,
      confirmText: "Disable Environment",
      variant: "danger",
      loading: false,
    });
  };

  const openToggleUpstreamStatusConfirm = (envId, api) => {
    const isActivating = api.status === "REVOKED";
    setConfirmState({
      isOpen: true,
      type: "toggleUpstreamStatus",
      targetId: api._id,
      meta: { envId, currentStatus: api.status, name: api.name },
      title: isActivating
        ? `Activate Upstream API "${api.name}"?`
        : `Revoke Upstream API "${api.name}"?`,
      description: isActivating
        ? `This will restore gateway traffic forwarding to ${api.name}.`
        : `Revoking this Upstream API will block incoming gateway traffic routed to it immediately.`,
      confirmText: isActivating ? "Activate API" : "Revoke API",
      variant: isActivating ? "primary" : "danger",
      loading: false,
    });
  };

  const handleConfirmAction = async () => {
    const { type, targetId, meta } = confirmState;
    try {
      setConfirmState((prev) => ({ ...prev, loading: true }));
      if (type === "disableIntegration") {
        await integrationsApi.disable(activeOrg._id, selectedTeamId, targetId);
      } else if (type === "disableEnv") {
        await integrationsApi.disableEnvironment(
          activeOrg._id,
          selectedTeamId,
          selectedIntegration._id,
          targetId
        );
      } else if (type === "toggleUpstreamStatus") {
        const nextStatus = meta.currentStatus === "ACTIVE" ? "REVOKED" : "ACTIVE";
        await upstreamApisApi.update(
          activeOrg._id,
          selectedTeamId,
          selectedIntegration._id,
          meta.envId,
          targetId,
          { status: nextStatus }
        );
      }
      setConfirmState({
        isOpen: false,
        type: null,
        targetId: null,
        meta: null,
        title: "",
        description: "",
        confirmText: "",
        variant: "danger",
        loading: false,
      });
      await loadIntegrations(selectedTeamId);
    } catch (err) {
      alert(err.response?.data?.message || "Action failed.");
      setConfirmState((prev) => ({ ...prev, loading: false }));
    }
  };

  // ── Live Gateway Test Modal ────────────────────────────────────────────────
  const handleOpenGatewayTestModal = (env, api) => {
    setTestEnv(env);
    setTestUpstreamApi(api);
    setTestApiKey("");
    setTestCity("London");
    setGatewayTestResult(null);
    setShowGatewayTestModal(true);
  };

  const handleExecuteGatewayTest = async (e) => {
    e.preventDefault();
    if (!testApiKey.trim()) {
      alert("Please provide an APIShield Access Key (x-api-key).");
      return;
    }

    try {
      setTestingGateway(true);
      setGatewayTestResult(null);
      const startTime = performance.now();

      const res = await gatewayApi.callWeather(
        activeOrg._id,
        selectedTeamId,
        testUpstreamApi._id,
        testApiKey.trim(),
        testCity.trim() || "London"
      );

      const endTime = performance.now();
      const latencyMs = Math.round(endTime - startTime);

      setGatewayTestResult({
        success: true,
        status: res.status,
        latencyMs,
        data: res.data,
      });
    } catch (err) {
      const status = err.response?.status || 500;
      const data = err.response?.data || { message: err.message || "Network Error" };
      setGatewayTestResult({
        success: false,
        status,
        data,
      });
    } finally {
      setTestingGateway(false);
    }
  };

  const handleCopyTestResponse = () => {
    if (!gatewayTestResult?.data) return;
    navigator.clipboard.writeText(JSON.stringify(gatewayTestResult.data, null, 2));
    setCopiedTestResponse(true);
    setTimeout(() => setCopiedTestResponse(false), 2000);
  };

  if (loadingTeams) {
    return <LoadingSpinner message="Loading workspace teams..." />;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Blocks className="w-5 h-5 text-blue-400" />
            Integrations & Environments
          </h1>
          <p className="page-description">
            Configure upstream API providers, manage environments, and orchestrate secure upstream endpoints
          </p>
        </div>

        {selectedTeamId && (
          <button onClick={handleOpenCreateIntegrationModal} className="btn-primary text-xs">
            <Plus className="w-4 h-4" />
            Add Integration
          </button>
        )}
      </div>

      {/* Team Filter selector */}
      {teams.length === 0 ? (
        <EmptyState
          message="No teams found in this workspace. You must belong to a team to configure integrations."
        />
      ) : (
        <div className="flex items-center gap-3 bg-[#161b22] border border-white/10 p-4 rounded-xl">
          <label className="text-xs font-mono font-semibold text-gray-400 uppercase tracking-wider">
            Select Team:
          </label>
          <select
            className="input max-w-xs text-xs"
            value={selectedTeamId}
            onChange={(e) => {
              setSelectedTeamId(e.target.value);
              setSelectedIntegrationId(null);
            }}
          >
            {teams.map((team) => (
              <option key={team._id} value={team._id}>
                {team.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {error && <ErrorMessage message={error} onRetry={() => loadIntegrations(selectedTeamId)} />}

      {/* Main Hierarchy UI */}
      {selectedTeamId && !loadingIntegrations && !error && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Integrations List */}
          <div className={`${selectedIntegration ? "lg:col-span-4" : "lg:col-span-12"} space-y-4`}>
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-mono font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-blue-400" />
                Integrations ({integrations.length})
              </h2>
            </div>

            {integrations.length === 0 ? (
              <EmptyState
                message="No integrations configured for this team yet."
                action={
                  <button onClick={handleOpenCreateIntegrationModal} className="btn-primary text-xs">
                    <Plus className="w-4 h-4" />
                    Create First Integration
                  </button>
                }
              />
            ) : (
              <div className="space-y-3">
                {integrations.map((item) => {
                  const isSelected = selectedIntegration?._id === item._id;
                  const isIntegrationRevoked = item.status === "REVOKED";
                  const totalUpstreams = (item.environments || []).reduce(
                    (acc, env) => acc + (env.upstreamApis || []).length,
                    0
                  );

                  return (
                    <div
                      key={item._id}
                      onClick={() => setSelectedIntegrationId(item._id)}
                      className={`card p-4 cursor-pointer transition-all border ${
                        isSelected
                          ? "border-blue-500 bg-[#1c2128] shadow-lg shadow-blue-950/20"
                          : "bg-[#161b22] border-white/10 hover:border-white/20 hover:bg-[#1c2128]/60"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-white text-sm tracking-tight">
                              {item.name}
                            </h3>
                            <Badge variant={isIntegrationRevoked ? "danger" : "success"}>
                              {item.status}
                            </Badge>
                          </div>
                          <p className="text-[11px] text-gray-500 font-mono">
                            {item.environments?.length || 0} envs • {totalUpstreams} upstream APIs
                          </p>
                        </div>

                        <div className="flex items-center gap-1">
                          {item.status === "ACTIVE" && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openDisableIntegrationConfirm(item);
                              }}
                              className="p-1.5 text-gray-400 hover:text-red-400 rounded hover:bg-white/5 transition-colors"
                              title="Disable Integration"
                            >
                              <Ban className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <ChevronRight
                            className={`w-4 h-4 text-gray-400 transition-transform ${
                              isSelected ? "text-blue-400 translate-x-0.5" : ""
                            }`}
                          />
                        </div>
                      </div>

                      {/* Environments pill summary */}
                      <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {item.environments && item.environments.length > 0 ? (
                            item.environments.map((env) => (
                              <span
                                key={env._id}
                                className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                                  env.status === "ACTIVE"
                                    ? "bg-blue-950/40 text-blue-300 border-blue-800/40"
                                    : "bg-red-950/40 text-red-400 border-red-800/40"
                                }`}
                              >
                                {env.name}
                              </span>
                            ))
                          ) : (
                            <span className="text-[10px] text-gray-500 font-mono">No envs</span>
                          )}
                        </div>

                        <span className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-0.5">
                          View details
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Selected Integration -> Environments -> Upstream APIs */}
          {selectedIntegration && (
            <div className="lg:col-span-8 space-y-6">
              {/* Integration Header Card */}
              <div className="card bg-[#161b22] border border-white/10 p-5 rounded-xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Server className="w-5 h-5 text-blue-400" />
                      <h2 className="text-lg font-bold text-white">{selectedIntegration.name}</h2>
                      <Badge variant={selectedIntegration.status === "ACTIVE" ? "success" : "danger"}>
                        {selectedIntegration.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-400 mt-1 font-mono">
                      Integration ID: {selectedIntegration._id}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {selectedIntegration.status === "ACTIVE" && (
                      <button onClick={handleOpenAddEnvModal} className="btn-primary text-xs">
                        <Plus className="w-3.5 h-3.5" />
                        Add Environment
                      </button>
                    )}
                  </div>
                </div>

                {selectedIntegration.status === "REVOKED" && (
                  <div className="p-3 bg-red-950/40 border border-red-800/40 rounded-lg text-red-300 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
                    <span>
                      This integration is disabled. All upstream APIs and APIShield Access Keys under
                      it will be blocked by the gateway proxy.
                    </span>
                  </div>
                )}
              </div>

              {/* Environments Hierarchy */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-mono font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-blue-400" />
                    Environments & Upstream Endpoints ({selectedIntegration.environments?.length || 0})
                  </h3>
                </div>

                {!selectedIntegration.environments || selectedIntegration.environments.length === 0 ? (
                  <EmptyState
                    message="No environments configured for this integration yet."
                    action={
                      selectedIntegration.status === "ACTIVE" ? (
                        <button onClick={handleOpenAddEnvModal} className="btn-primary text-xs">
                          <Plus className="w-4 h-4" /> Add Environment
                        </button>
                      ) : null
                    }
                  />
                ) : (
                  <div className="space-y-5">
                    {selectedIntegration.environments.map((env) => {
                      const isEnvRevoked =
                        env.status === "REVOKED" || selectedIntegration.status === "REVOKED";
                      const upstreams = env.upstreamApis || [];

                      return (
                        <div
                          key={env._id}
                          className="card bg-[#161b22] border border-white/10 rounded-xl overflow-hidden shadow-sm"
                        >
                          {/* Environment Header */}
                          <div className="p-4 bg-[#1c2128]/80 border-b border-white/5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <span className="font-mono text-sm font-bold text-white">
                                {env.name}
                              </span>
                              <Badge variant={env.status === "ACTIVE" ? "success" : "danger"}>
                                {env.status}
                              </Badge>
                              <span className="text-[11px] font-mono text-gray-400">
                                {upstreams.length} Upstream {upstreams.length === 1 ? "API" : "APIs"}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              {env.status === "ACTIVE" && selectedIntegration.status === "ACTIVE" && (
                                <>
                                  <button
                                    onClick={() => handleOpenAddUpstreamModal(env)}
                                    className="btn-secondary text-[11px] py-1 px-2.5 flex items-center gap-1"
                                    title="Add Upstream API endpoint"
                                  >
                                    <Plus className="w-3 h-3 text-blue-400" />
                                    Add Upstream API
                                  </button>
                                  <button
                                    onClick={() => openDisableEnvConfirm(env)}
                                    className="p-1 text-gray-400 hover:text-red-400 rounded hover:bg-white/5 transition-colors"
                                    title="Disable Environment"
                                  >
                                    <Ban className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}

                              <Link
                                to={`/org/${activeOrg._id}/api-keys?teamId=${selectedTeamId}&envId=${env._id}`}
                                className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1 transition-colors pl-2 border-l border-white/10"
                                title="Manage APIShield Access Keys for this environment"
                              >
                                <KeyRound className="w-3.5 h-3.5" />
                                Access Keys <ArrowRight className="w-3 h-3" />
                              </Link>
                            </div>
                          </div>

                          {/* Upstream APIs List */}
                          <div className="p-4 space-y-3">
                            {upstreams.length === 0 ? (
                              <div className="text-center py-6 text-xs text-gray-500 font-mono space-y-2">
                                <p>No Upstream APIs defined for {env.name}.</p>
                                {env.status === "ACTIVE" && selectedIntegration.status === "ACTIVE" && (
                                  <button
                                    onClick={() => handleOpenAddUpstreamModal(env)}
                                    className="btn-secondary text-[11px] inline-flex items-center gap-1"
                                  >
                                    <Plus className="w-3 h-3" /> Add Upstream API
                                  </button>
                                )}
                              </div>
                            ) : (
                              <div className="divide-y divide-white/5">
                                {upstreams.map((api) => {
                                  const isApiRevoked =
                                    api.status === "REVOKED" || isEnvRevoked;

                                  return (
                                    <div
                                      key={api._id}
                                      className="py-3 first:pt-0 last:pb-0 flex flex-col md:flex-row md:items-center justify-between gap-3"
                                    >
                                      <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                          <span className="font-semibold text-white text-xs">
                                            {api.name}
                                          </span>
                                          <Badge
                                            variant={api.status === "ACTIVE" ? "success" : "danger"}
                                          >
                                            {api.status}
                                          </Badge>
                                        </div>

                                        <div className="flex items-center gap-2 text-xs font-mono text-gray-400">
                                          <code className="text-blue-300 bg-[#0d1117] px-2 py-0.5 rounded border border-white/5 truncate max-w-lg">
                                            {api.baseUrl}
                                            {api.path}
                                          </code>
                                        </div>

                                        <div className="flex items-center gap-2 text-[10px] font-mono text-gray-500">
                                          <Lock className="w-3 h-3 text-green-400" />
                                          <span>Upstream Secret: •••••••• (AES-256-GCM Secured)</span>
                                        </div>
                                      </div>

                                      {/* Upstream API Actions */}
                                      <div className="flex items-center gap-2 shrink-0">
                                        {/* Test Gateway */}
                                        <button
                                          onClick={() => handleOpenGatewayTestModal(env, api)}
                                          disabled={isApiRevoked}
                                          className="btn-secondary text-[11px] py-1 px-2.5 flex items-center gap-1.5"
                                          title="Test calling this upstream via APIShield Gateway"
                                        >
                                          <Play className="w-3 h-3 text-green-400 fill-green-400" />
                                          Test Gateway
                                        </button>

                                        {/* Edit Upstream API */}
                                        <button
                                          onClick={() => handleOpenEditUpstreamModal(env._id, api)}
                                          className="p-1.5 text-gray-400 hover:text-white rounded hover:bg-white/5 transition-colors"
                                          title="Edit Upstream API"
                                        >
                                          <Edit2 className="w-3.5 h-3.5" />
                                        </button>

                                        {/* Revoke / Activate Upstream API */}
                                        <button
                                          onClick={() =>
                                            openToggleUpstreamStatusConfirm(env._id, api)
                                          }
                                          className={`p-1.5 rounded hover:bg-white/5 transition-colors ${
                                            api.status === "ACTIVE"
                                              ? "text-gray-400 hover:text-red-400"
                                              : "text-gray-400 hover:text-green-400"
                                          }`}
                                          title={
                                            api.status === "ACTIVE"
                                              ? "Revoke Upstream API"
                                              : "Activate Upstream API"
                                          }
                                        >
                                          <Ban className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Modal: Create Integration (Atomic) ─────────────────────────────── */}
      <Modal
        isOpen={showCreateIntegrationModal}
        onClose={() => setShowCreateIntegrationModal(false)}
        title="Add Integration & Initial Upstream API"
        size="lg"
      >
        <form onSubmit={handleCreateIntegration} className="space-y-4">
          {createIntegrationError && (
            <div className="p-3 bg-red-950/60 border border-red-800/60 rounded-md text-red-300 text-xs">
              {createIntegrationError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label">Integration Name *</label>
              <input
                type="text"
                className="input"
                placeholder="e.g. OpenWeather Service, Stripe"
                value={newIntegrationName}
                onChange={(e) => setNewIntegrationName(e.target.value)}
                disabled={createIntegrationSubmitting}
                required
              />
            </div>

            <div>
              <label className="label">Initial Environment *</label>
              <select
                className="input"
                value={newIntegrationEnv}
                onChange={(e) => setNewIntegrationEnv(e.target.value)}
                disabled={createIntegrationSubmitting}
              >
                {ENV_OPTIONS.map((env) => (
                  <option key={env} value={env}>
                    {env}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-2 border-t border-white/5 space-y-3">
            <h4 className="text-xs font-mono font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-blue-400" />
              Initial Upstream API Configuration
            </h4>

            <div>
              <label className="label">Upstream API Name *</label>
              <input
                type="text"
                className="input"
                placeholder="e.g. Current Weather Endpoint"
                value={newUpstreamName}
                onChange={(e) => setNewUpstreamName(e.target.value)}
                disabled={createIntegrationSubmitting}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="label">Base URL *</label>
                <input
                  type="url"
                  className="input font-mono text-xs"
                  placeholder="https://api.openweathermap.org"
                  value={newBaseUrl}
                  onChange={(e) => setNewBaseUrl(e.target.value)}
                  disabled={createIntegrationSubmitting}
                  required
                />
              </div>

              <div>
                <label className="label">Endpoint Path *</label>
                <input
                  type="text"
                  className="input font-mono text-xs"
                  placeholder="/data/2.5/weather"
                  value={newPath}
                  onChange={(e) => setNewPath(e.target.value)}
                  disabled={createIntegrationSubmitting}
                  required
                />
              </div>
            </div>

            <div>
              <label className="label">Upstream API Credential / Secret Key *</label>
              <input
                type="password"
                className="input font-mono text-xs"
                placeholder="External provider secret key or bearer token"
                value={newUpstreamCredential}
                onChange={(e) => setNewUpstreamCredential(e.target.value)}
                disabled={createIntegrationSubmitting}
                required
              />
              <p className="text-[11px] text-gray-500 font-mono mt-1 flex items-center gap-1">
                <Lock className="w-3 h-3 text-green-400" />
                Encrypted with AES-256-GCM on the backend before storage. Never returned to clients.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={() => setShowCreateIntegrationModal(false)}
              className="btn-secondary text-xs"
              disabled={createIntegrationSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary text-xs"
              disabled={createIntegrationSubmitting}
            >
              {createIntegrationSubmitting ? "Creating..." : "Create Integration"}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Modal: Add Environment ─────────────────────────────────────────── */}
      <Modal
        isOpen={showAddEnvModal}
        onClose={() => setShowAddEnvModal(false)}
        title={`Add Environment to ${selectedIntegration?.name}`}
      >
        <form onSubmit={handleAddEnvironment} className="space-y-4">
          {addEnvError && (
            <div className="p-3 bg-red-950/60 border border-red-800/60 rounded-md text-red-300 text-xs">
              {addEnvError}
            </div>
          )}

          <div>
            <label className="label">Select Environment *</label>
            <select
              className="input"
              value={newEnvName}
              onChange={(e) => setNewEnvName(e.target.value)}
              disabled={addEnvSubmitting}
            >
              {ENV_OPTIONS.map((env) => {
                const alreadyExists = (selectedIntegration?.environments || []).some(
                  (e) => e.name === env
                );
                return (
                  <option key={env} value={env} disabled={alreadyExists}>
                    {env} {alreadyExists ? "(Already added)" : ""}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={() => setShowAddEnvModal(false)}
              className="btn-secondary text-xs"
              disabled={addEnvSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary text-xs"
              disabled={addEnvSubmitting}
            >
              {addEnvSubmitting ? "Adding..." : "Add Environment"}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Modal: Add Upstream API ────────────────────────────────────────── */}
      <Modal
        isOpen={showAddUpstreamModal}
        onClose={() => setShowAddUpstreamModal(false)}
        title={`Add Upstream API to ${targetEnvForUpstream?.name}`}
        size="lg"
      >
        <form onSubmit={handleAddUpstreamApi} className="space-y-4">
          {addApiError && (
            <div className="p-3 bg-red-950/60 border border-red-800/60 rounded-md text-red-300 text-xs">
              {addApiError}
            </div>
          )}

          <div>
            <label className="label">Upstream API Name *</label>
            <input
              type="text"
              className="input"
              placeholder="e.g. 5-Day Forecast API"
              value={addApiName}
              onChange={(e) => setAddApiName(e.target.value)}
              disabled={addApiSubmitting}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label">Base URL *</label>
              <input
                type="url"
                className="input font-mono text-xs"
                placeholder="https://api.openweathermap.org"
                value={addApiBaseUrl}
                onChange={(e) => setAddApiBaseUrl(e.target.value)}
                disabled={addApiSubmitting}
                required
              />
            </div>

            <div>
              <label className="label">Endpoint Path *</label>
              <input
                type="text"
                className="input font-mono text-xs"
                placeholder="/data/2.5/forecast"
                value={addApiPath}
                onChange={(e) => setAddApiPath(e.target.value)}
                disabled={addApiSubmitting}
                required
              />
            </div>
          </div>

          <div>
            <label className="label">Upstream API Credential / Secret Key *</label>
            <input
              type="password"
              className="input font-mono text-xs"
              placeholder="Provider API key or secret token"
              value={addApiCredential}
              onChange={(e) => setAddApiCredential(e.target.value)}
              disabled={addApiSubmitting}
              required
            />
            <p className="text-[11px] text-gray-500 font-mono mt-1 flex items-center gap-1">
              <Lock className="w-3 h-3 text-green-400" />
              Encrypted with AES-256-GCM. Stored securely on backend.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={() => setShowAddUpstreamModal(false)}
              className="btn-secondary text-xs"
              disabled={addApiSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary text-xs"
              disabled={addApiSubmitting}
            >
              {addApiSubmitting ? "Adding..." : "Add Upstream API"}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Modal: Edit Upstream API ───────────────────────────────────────── */}
      <Modal
        isOpen={showEditUpstreamModal}
        onClose={() => setShowEditUpstreamModal(false)}
        title={`Edit Upstream API: ${editingUpstreamApi?.name}`}
        size="lg"
      >
        <form onSubmit={handleUpdateUpstreamApi} className="space-y-4">
          {editApiError && (
            <div className="p-3 bg-red-950/60 border border-red-800/60 rounded-md text-red-300 text-xs">
              {editApiError}
            </div>
          )}

          <div>
            <label className="label">API Name *</label>
            <input
              type="text"
              className="input"
              value={editApiName}
              onChange={(e) => setEditApiName(e.target.value)}
              disabled={editApiSubmitting}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label">Base URL *</label>
              <input
                type="url"
                className="input font-mono text-xs"
                value={editApiBaseUrl}
                onChange={(e) => setEditApiBaseUrl(e.target.value)}
                disabled={editApiSubmitting}
                required
              />
            </div>

            <div>
              <label className="label">Endpoint Path *</label>
              <input
                type="text"
                className="input font-mono text-xs"
                value={editApiPath}
                onChange={(e) => setEditApiPath(e.target.value)}
                disabled={editApiSubmitting}
                required
              />
            </div>
          </div>

          <div>
            <label className="label">Status</label>
            <select
              className="input text-xs"
              value={editApiStatus}
              onChange={(e) => setEditApiStatus(e.target.value)}
              disabled={editApiSubmitting}
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="REVOKED">REVOKED</option>
            </select>
          </div>

          <div>
            <label className="label">Rotate Upstream Credential (Optional)</label>
            <input
              type="password"
              className="input font-mono text-xs"
              placeholder="Leave blank to preserve existing encrypted credential"
              value={editApiCredential}
              onChange={(e) => setEditApiCredential(e.target.value)}
              disabled={editApiSubmitting}
            />
            <p className="text-[11px] text-gray-500 font-mono mt-1">
              Only provide a new value if you wish to rotate the upstream secret.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={() => setShowEditUpstreamModal(false)}
              className="btn-secondary text-xs"
              disabled={editApiSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary text-xs"
              disabled={editApiSubmitting}
            >
              {editApiSubmitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Modal: Live Gateway Test ───────────────────────────────────────── */}
      <Modal
        isOpen={showGatewayTestModal}
        onClose={() => setShowGatewayTestModal(false)}
        title="Live Gateway Execution Test"
        size="lg"
      >
        <form onSubmit={handleExecuteGatewayTest} className="space-y-4">
          <div className="p-3 bg-[#1c2128] border border-white/10 rounded-lg space-y-1.5 text-xs font-mono">
            <div className="flex items-center justify-between text-gray-300">
              <span className="text-gray-400">Target Upstream:</span>
              <span className="font-semibold text-white">{testUpstreamApi?.name}</span>
            </div>
            <div className="flex items-center justify-between text-gray-300">
              <span className="text-gray-400">Endpoint:</span>
              <span className="text-blue-300 truncate max-w-sm">
                {testUpstreamApi?.baseUrl}
                {testUpstreamApi?.path}
              </span>
            </div>
            <div className="flex items-center justify-between text-gray-300">
              <span className="text-gray-400">Environment:</span>
              <span className="text-yellow-400 font-semibold">{testEnv?.name}</span>
            </div>
          </div>

          <div>
            <label className="label">
              APIShield Access Key (x-api-key header) *
            </label>
            <input
              type="password"
              className="input font-mono text-xs"
              placeholder="e.g. apishield_dev_..."
              value={testApiKey}
              onChange={(e) => setTestApiKey(e.target.value)}
              disabled={testingGateway}
              required
            />
            <p className="text-[11px] text-gray-400 font-mono mt-1">
              Provide an active APIShield Access Key assigned to the{" "}
              <strong className="text-white">{testEnv?.name}</strong> environment.
            </p>
          </div>

          <div>
            <label className="label">Query Parameter: City</label>
            <input
              type="text"
              className="input text-xs"
              placeholder="London, New York, Tokyo..."
              value={testCity}
              onChange={(e) => setTestCity(e.target.value)}
              disabled={testingGateway}
            />
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-white/10">
            <Link
              to={`/org/${activeOrg._id}/api-keys?teamId=${selectedTeamId}&envId=${testEnv?._id}`}
              className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium"
              target="_blank"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Need an Access Key for {testEnv?.name}?
            </Link>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowGatewayTestModal(false)}
                className="btn-secondary text-xs"
                disabled={testingGateway}
              >
                Close
              </button>
              <button
                type="submit"
                className="btn-primary text-xs flex items-center gap-1.5"
                disabled={testingGateway || !testApiKey.trim()}
              >
                {testingGateway ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Executing Request...
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    Send Request
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        {/* Test Result Display */}
        {gatewayTestResult && (
          <div className="mt-4 pt-4 border-t border-white/10 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant={gatewayTestResult.success ? "success" : "danger"}>
                  HTTP {gatewayTestResult.status}
                </Badge>
                {gatewayTestResult.latencyMs !== undefined && (
                  <span className="text-[11px] font-mono text-gray-400">
                    Latency: {gatewayTestResult.latencyMs} ms
                  </span>
                )}
              </div>

              <button
                onClick={handleCopyTestResponse}
                className="text-xs text-gray-400 hover:text-white flex items-center gap-1 font-mono transition-colors"
                title="Copy Response Body"
              >
                {copiedTestResponse ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-green-400" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Copy JSON
                  </>
                )}
              </button>
            </div>

            <div className="bg-[#0e131b] border border-white/10 rounded-lg p-3 max-h-60 overflow-y-auto text-xs font-mono">
              <pre className="text-gray-300 whitespace-pre-wrap">
                {JSON.stringify(gatewayTestResult.data, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Confirmation Modal ────────────────────────────────────────────── */}
      <ConfirmModal
        isOpen={confirmState.isOpen}
        onClose={() => setConfirmState((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={handleConfirmAction}
        title={confirmState.title}
        description={confirmState.description}
        confirmText={confirmState.confirmText}
        variant={confirmState.variant}
        loading={confirmState.loading}
      />
    </div>
  );
}
