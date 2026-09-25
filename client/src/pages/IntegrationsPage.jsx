/**
 * IntegrationsPage.jsx
 *
 * Primary Operational Workspace for Environments, Integrations & Gateway Access.
 *
 * Conceptual Hierarchy:
 * Organization -> Team -> Environment -> (Integrations -> Upstream APIs) & (APIShield Access Keys)
 *
 * UX Model:
 * The user experiences Environment as the primary operational workspace:
 * - Environment workspace tabs (TEST, PRODUCTION, STAGING, DEVELOPMENT)
 * - Under selected Environment:
 *     1. Integrations (e.g. OpenWeather) -> Upstream APIs (Current Weather, Forecast)
 *     2. Gateway Access (Environment-scoped APIShield Access Keys)
 *
 * Security Guarantee:
 * Never displays provider credentials, encrypted strings, IVs, or auth tags.
 */

import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useOrg } from "../context/OrgContext";
import teamsApi from "../api/teams";
import integrationsApi from "../api/integrations";
import upstreamApisApi from "../api/upstreamApis";
import apiKeysApi from "../api/apiKeys";
import gatewayApi from "../api/gateway";

import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";
import EmptyState from "../components/EmptyState";
import Badge, { getApiKeyStatusVariant } from "../components/Badge";
import Modal from "../components/Modal";
import ConfirmModal from "../components/ConfirmModal";

import {
  Blocks,
  Plus,
  Server,
  KeyRound,
  Ban,
  Activity,
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
  ExternalLink,
  Shield,
  Clock
} from "lucide-react";

const ENV_LIST = ["TEST", "DEVELOPMENT", "STAGING", "PRODUCTION"];

export default function IntegrationsPage() {
  const { activeOrg } = useOrg();
  const [searchParams, setSearchParams] = useSearchParams();

  // Team state
  const [teams, setTeams] = useState([]);
  const [selectedTeamId, setSelectedTeamId] = useState(searchParams.get("teamId") || "");
  const [loadingTeams, setLoadingTeams] = useState(true);

  // Active Environment workspace tab
  const [activeEnvName, setActiveEnvName] = useState("TEST");

  // Data state
  const [integrations, setIntegrations] = useState([]);
  const [apiKeys, setApiKeys] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState("");

  // Modals state
  const [showCreateIntegrationModal, setShowCreateIntegrationModal] = useState(false);
  const [showAddEnvModal, setShowAddEnvModal] = useState(false);
  const [selectedIntegrationForEnv, setSelectedIntegrationForEnv] = useState(null);

  const [showAddUpstreamModal, setShowAddUpstreamModal] = useState(false);
  const [targetIntegrationIdForUpstream, setTargetIntegrationIdForUpstream] = useState(null);
  const [targetEnvIdForUpstream, setTargetEnvIdForUpstream] = useState(null);

  const [showEditUpstreamModal, setShowEditUpstreamModal] = useState(false);
  const [editingUpstreamApi, setEditingUpstreamApi] = useState(null);
  const [editingIntegrationId, setEditingIntegrationId] = useState(null);
  const [editingEnvId, setEditingEnvId] = useState(null);

  // Quick Create Access Key Modal scoped to active environment
  const [showCreateKeyModal, setShowCreateKeyModal] = useState(false);
  const [targetEnvIdForKey, setTargetEnvIdForKey] = useState(null);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyDesc, setNewKeyDesc] = useState("");
  const [newKeyExpiration, setNewKeyExpiration] = useState("NEVER");
  const [createKeySubmitting, setCreateKeySubmitting] = useState(false);
  const [createKeyError, setCreateKeyError] = useState("");
  const [createdSecret, setCreatedSecret] = useState(null);
  const [copiedSecret, setCopiedSecret] = useState(false);

  // Gateway Test Modal state
  const [showGatewayTestModal, setShowGatewayTestModal] = useState(false);
  const [testUpstreamApi, setTestUpstreamApi] = useState(null);
  const [testEnv, setTestEnv] = useState(null);
  const [testApiKey, setTestApiKey] = useState("");
  const [testCity, setTestCity] = useState("London");
  const [testingGateway, setTestingGateway] = useState(false);
  const [gatewayTestResult, setGatewayTestResult] = useState(null);
  const [copiedTestResponse, setCopiedTestResponse] = useState(false);

  // Forms state
  // 1. Create Integration (Atomic)
  const [newIntegrationName, setNewIntegrationName] = useState("");
  const [newUpstreamName, setNewUpstreamName] = useState("");
  const [newBaseUrl, setNewBaseUrl] = useState("");
  const [newPath, setNewPath] = useState("");
  const [newUpstreamCredential, setNewUpstreamCredential] = useState("");
  const [createIntegrationSubmitting, setCreateIntegrationSubmitting] = useState(false);
  const [createIntegrationError, setCreateIntegrationError] = useState("");

  // 2. Add Upstream API
  const [addApiName, setAddApiName] = useState("");
  const [addApiBaseUrl, setAddApiBaseUrl] = useState("");
  const [addApiPath, setAddApiPath] = useState("");
  const [addApiCredential, setAddApiCredential] = useState("");
  const [addApiSubmitting, setAddApiSubmitting] = useState(false);
  const [addApiError, setAddApiError] = useState("");

  // 3. Edit Upstream API
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
    type: null,
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

  // Load Integrations and Keys when team changes
  useEffect(() => {
    if (selectedTeamId) {
      loadWorkspaceData(selectedTeamId);
    } else {
      setIntegrations([]);
      setApiKeys([]);
    }
  }, [selectedTeamId]);

  // Handle URL query actions
  useEffect(() => {
    const action = searchParams.get("action");
    if (action === "create") {
      handleOpenCreateIntegrationModal();
    }
  }, [searchParams]);

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
      setError("Failed to load workspace teams.");
    } finally {
      setLoadingTeams(false);
    }
  };

  const loadWorkspaceData = async (teamId) => {
    try {
      setLoadingData(true);
      setError("");
      const [integrationsRes, keysRes] = await Promise.all([
        integrationsApi.getAll(activeOrg._id, teamId).catch(() => ({ data: { data: [] } })),
        apiKeysApi.getAll(activeOrg._id, teamId).catch(() => ({ data: { data: [] } })),
      ]);

      setIntegrations(integrationsRes.data?.data || []);
      setApiKeys(keysRes.data?.data || []);
    } catch (err) {
      setError("Failed to load workspace environment data.");
    } finally {
      setLoadingData(false);
    }
  };

  // ── Derived Data for Active Environment Workspace ──────────────────────────
  // Filter integrations that have the currently selected environment configured
  const envIntegrations = [];
  const envIdMap = {}; // envName -> envId

  integrations.forEach((item) => {
    const matchedEnv = (item.environments || []).find((e) => e.name === activeEnvName);
    if (matchedEnv) {
      envIdMap[activeEnvName] = matchedEnv._id;
      envIntegrations.push({
        integrationId: item._id,
        integrationName: item.name,
        integrationStatus: item.status,
        createdAt: item.createdAt,
        envId: matchedEnv._id,
        envStatus: matchedEnv.status,
        upstreamApis: matchedEnv.upstreamApis || [],
      });
    }
  });

  // Collect all unique environment IDs for the active environment name
  const activeEnvIds = envIntegrations.map((ei) => ei.envId);

  // Access Keys scoped to active environment
  const envAccessKeys = apiKeys.filter((key) => activeEnvIds.includes(key.environmentId));

  // ── Modal Openers ──────────────────────────────────────────────────────────
  const handleOpenCreateIntegrationModal = () => {
    setNewIntegrationName("");
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
        environment: activeEnvName,
        upstreamApiName: newUpstreamName.trim(),
        baseUrl: newBaseUrl.trim(),
        path: newPath.trim(),
        upstreamCredential: newUpstreamCredential.trim(),
      };

      await integrationsApi.create(activeOrg._id, selectedTeamId, payload);
      setShowCreateIntegrationModal(false);
      await loadWorkspaceData(selectedTeamId);
    } catch (err) {
      setCreateIntegrationError(err.response?.data?.message || "Failed to create integration.");
    } finally {
      setCreateIntegrationSubmitting(false);
    }
  };

  const handleOpenAddUpstreamModal = (integrationId, envId) => {
    setTargetIntegrationIdForUpstream(integrationId);
    setTargetEnvIdForUpstream(envId);
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
        targetIntegrationIdForUpstream,
        targetEnvIdForUpstream,
        payload
      );

      setShowAddUpstreamModal(false);
      await loadWorkspaceData(selectedTeamId);
    } catch (err) {
      setAddApiError(err.response?.data?.message || "Failed to add Upstream API.");
    } finally {
      setAddApiSubmitting(false);
    }
  };

  const handleOpenEditUpstreamModal = (integrationId, envId, api) => {
    setEditingIntegrationId(integrationId);
    setEditingEnvId(envId);
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
        editingIntegrationId,
        editingEnvId,
        editingUpstreamApi._id,
        payload
      );

      setShowEditUpstreamModal(false);
      await loadWorkspaceData(selectedTeamId);
    } catch (err) {
      setEditApiError(err.response?.data?.message || "Failed to update Upstream API.");
    } finally {
      setEditApiSubmitting(false);
    }
  };

  // Quick Create Access Key scoped to this environment
  const handleOpenQuickCreateKey = (envId) => {
    setTargetEnvIdForKey(envId);
    setNewKeyName("");
    setNewKeyDesc("");
    setNewKeyExpiration("NEVER");
    setCreateKeyError("");
    setShowCreateKeyModal(true);
  };

  const handleCreateAccessKey = async (e) => {
    e.preventDefault();
    if (!newKeyName.trim()) {
      setCreateKeyError("Key name is required.");
      return;
    }

    let calculatedExpiresAt = undefined;
    if (newKeyExpiration === "30_DAYS") {
      calculatedExpiresAt = new Date(Date.now() + 30 * 86400000).toISOString();
    } else if (newKeyExpiration === "90_DAYS") {
      calculatedExpiresAt = new Date(Date.now() + 90 * 86400000).toISOString();
    } else if (newKeyExpiration === "365_DAYS") {
      calculatedExpiresAt = new Date(Date.now() + 365 * 86400000).toISOString();
    }

    try {
      setCreateKeySubmitting(true);
      setCreateKeyError("");

      const payload = {
        name: newKeyName.trim(),
        description: newKeyDesc.trim() || undefined,
        environmentId: targetEnvIdForKey,
        expiresAt: calculatedExpiresAt,
      };

      const response = await apiKeysApi.create(activeOrg._id, selectedTeamId, payload);
      const secret = response.data?.data?.apiKey;

      setShowCreateKeyModal(false);
      setCreatedSecret(secret);
      await loadWorkspaceData(selectedTeamId);
    } catch (err) {
      setCreateKeyError(err.response?.data?.message || "Failed to create Access Key.");
    } finally {
      setCreateKeySubmitting(false);
    }
  };

  // ── Gateway Live Testing ───────────────────────────────────────────────────
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

  // ── Status Confirmations ───────────────────────────────────────────────────
  const openDisableIntegrationConfirm = (integrationId, name) => {
    setConfirmState({
      isOpen: true,
      type: "disableIntegration",
      targetId: integrationId,
      title: `Disable Integration "${name}"?`,
      description: `Disabling this integration will stop all gateway requests routing through its upstream APIs.`,
      confirmText: "Disable Integration",
      variant: "danger",
      loading: false,
    });
  };

  const openRevokeKeyConfirm = (apiKeyId, name) => {
    setConfirmState({
      isOpen: true,
      type: "revokeKey",
      targetId: apiKeyId,
      title: `Revoke Access Key "${name}"?`,
      description: `This key will immediately stop working. Client applications using this key will be rejected at the gateway.`,
      confirmText: "Revoke Key",
      variant: "danger",
      loading: false,
    });
  };

  const handleConfirmAction = async () => {
    const { type, targetId } = confirmState;
    try {
      setConfirmState((prev) => ({ ...prev, loading: true }));
      if (type === "disableIntegration") {
        await integrationsApi.disable(activeOrg._id, selectedTeamId, targetId);
      } else if (type === "revokeKey") {
        await apiKeysApi.revoke(activeOrg._id, selectedTeamId, targetId);
      }
      setConfirmState({
        isOpen: false,
        type: null,
        targetId: null,
        title: "",
        description: "",
        confirmText: "",
        variant: "danger",
        loading: false,
      });
      await loadWorkspaceData(selectedTeamId);
    } catch (err) {
      alert(err.response?.data?.message || "Action failed.");
      setConfirmState((prev) => ({ ...prev, loading: false }));
    }
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
            <Globe className="w-5 h-5 text-blue-400" />
            Environments & Integrations
          </h1>
          <p className="page-description">
            Operational workspace for managing upstream API connections and gateway access
          </p>
        </div>

        {selectedTeamId && (
          <button onClick={handleOpenCreateIntegrationModal} className="btn-primary text-xs">
            <Plus className="w-4 h-4" />
            Add Integration
          </button>
        )}
      </div>

      {/* Team Filter & Environment Workspace Tabs */}
      {teams.length === 0 ? (
        <EmptyState
          message="No teams found in this workspace. You must belong to a team to access environments."
        />
      ) : (
        <div className="space-y-4">
          {/* Team selector bar */}
          <div className="flex items-center gap-3 bg-[#161b22] border border-white/10 p-4 rounded-xl">
            <label className="text-xs font-mono font-semibold text-gray-400 uppercase tracking-wider">
              Working Team:
            </label>
            <select
              className="input max-w-xs text-xs"
              value={selectedTeamId}
              onChange={(e) => setSelectedTeamId(e.target.value)}
            >
              {teams.map((team) => (
                <option key={team._id} value={team._id}>
                  {team.name}
                </option>
              ))}
            </select>
          </div>

          {/* Environment Operational Tabs */}
          <div className="flex items-center gap-2 border-b border-white/10 pb-2">
            <span className="text-xs font-mono font-semibold text-gray-400 uppercase tracking-wider mr-2 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-blue-400" />
              Environment:
            </span>
            {ENV_LIST.map((env) => {
              const isSelected = activeEnvName === env;
              return (
                <button
                  key={env}
                  onClick={() => setActiveEnvName(env)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all border ${
                    isSelected
                      ? "bg-[#1c2128] text-white border-blue-500 shadow-sm shadow-blue-950/40"
                      : "text-gray-400 hover:text-white hover:bg-white/5 border-transparent"
                  }`}
                >
                  {env}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {error && <ErrorMessage message={error} onRetry={() => loadWorkspaceData(selectedTeamId)} />}

      {/* Environment Operational Content */}
      {selectedTeamId && !loadingData && !error && (
        <div className="space-y-8">
          {/* ── SECTION 1: Integrations in this Environment ─────────────────── */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <Server className="w-4 h-4 text-blue-400" />
                  Integrations ({activeEnvName})
                </h2>
                <p className="text-xs text-gray-500">
                  External provider connections configured for the {activeEnvName} environment
                </p>
              </div>

              <button
                onClick={handleOpenCreateIntegrationModal}
                className="btn-secondary text-xs flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5 text-blue-400" />
                Add Integration to {activeEnvName}
              </button>
            </div>

            {envIntegrations.length === 0 ? (
              <EmptyState
                message={`No integrations configured in ${activeEnvName} yet.`}
                action={
                  <button
                    onClick={handleOpenCreateIntegrationModal}
                    className="btn-primary text-xs flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" /> Create Integration in {activeEnvName}
                  </button>
                }
              />
            ) : (
              <div className="space-y-4">
                {envIntegrations.map((item) => {
                  const isRevoked = item.integrationStatus === "REVOKED";

                  return (
                    <div
                      key={item.integrationId}
                      className="card bg-[#161b22] border border-white/10 rounded-xl overflow-hidden shadow-sm"
                    >
                      {/* Integration Card Header */}
                      <div className="p-4 bg-[#1c2128]/80 border-b border-white/5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-sm">
                              {item.integrationName}
                            </span>
                            <Badge variant={isRevoked ? "danger" : "success"}>
                              {item.integrationStatus}
                            </Badge>
                            <span className="text-[11px] font-mono text-gray-500">
                              {item.upstreamApis.length} Upstream{" "}
                              {item.upstreamApis.length === 1 ? "API" : "APIs"}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              handleOpenAddUpstreamModal(item.integrationId, item.envId)
                            }
                            className="btn-secondary text-xs py-1 px-2.5 flex items-center gap-1"
                            title="Add endpoint to this integration"
                          >
                            <Plus className="w-3 h-3 text-blue-400" />
                            Add Upstream API
                          </button>

                          {item.integrationStatus === "ACTIVE" && (
                            <button
                              onClick={() =>
                                openDisableIntegrationConfirm(
                                  item.integrationId,
                                  item.integrationName
                                )
                              }
                              className="p-1.5 text-gray-400 hover:text-red-400 rounded hover:bg-white/5 transition-colors"
                              title="Disable Integration"
                            >
                              <Ban className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Upstream APIs List */}
                      <div className="p-4 space-y-3">
                        {item.upstreamApis.length === 0 ? (
                          <div className="text-center py-6 text-xs text-gray-500 font-mono space-y-2">
                            <p>No Upstream APIs defined for this integration in {activeEnvName}.</p>
                            <button
                              onClick={() =>
                                handleOpenAddUpstreamModal(item.integrationId, item.envId)
                              }
                              className="btn-secondary text-xs inline-flex items-center gap-1"
                            >
                              <Plus className="w-3 h-3 text-blue-400" /> Add Upstream API
                            </button>
                          </div>
                        ) : (
                          <div className="divide-y divide-white/5">
                            {item.upstreamApis.map((api) => {
                              const isApiRevoked =
                                api.status === "REVOKED" || isRevoked;

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
                                      <span>Provider Credential: •••••••• (AES-256-GCM Secured)</span>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2 shrink-0">
                                    {/* Test Gateway */}
                                    <button
                                      onClick={() =>
                                        handleOpenGatewayTestModal(
                                          { name: activeEnvName, _id: item.envId },
                                          api
                                        )
                                      }
                                      disabled={isApiRevoked}
                                      className="btn-secondary text-[11px] py-1 px-2.5 flex items-center gap-1.5"
                                      title="Test gateway connectivity"
                                    >
                                      <Play className="w-3 h-3 text-green-400 fill-green-400" />
                                      Test Gateway
                                    </button>

                                    {/* Edit Upstream API */}
                                    <button
                                      onClick={() =>
                                        handleOpenEditUpstreamModal(
                                          item.integrationId,
                                          item.envId,
                                          api
                                        )
                                      }
                                      className="p-1.5 text-gray-400 hover:text-white rounded hover:bg-white/5 transition-colors"
                                      title="Edit Upstream API"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
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

          {/* ── SECTION 2: Gateway Access (APIShield Access Keys) ─────────── */}
          <div className="space-y-4 pt-4 border-t border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-blue-400" />
                  Gateway Access ({activeEnvName})
                </h2>
                <p className="text-xs text-gray-500">
                  APIShield Access Keys permitted to make gateway requests to {activeEnvName}
                </p>
              </div>

              {activeEnvIds.length > 0 && (
                <button
                  onClick={() => handleOpenQuickCreateKey(activeEnvIds[0])}
                  className="btn-primary text-xs flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Create Access Key
                </button>
              )}
            </div>

            {envAccessKeys.length === 0 ? (
              <EmptyState
                message={`No Access Keys created for ${activeEnvName} yet.`}
                action={
                  activeEnvIds.length > 0 ? (
                    <button
                      onClick={() => handleOpenQuickCreateKey(activeEnvIds[0])}
                      className="btn-primary text-xs flex items-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" /> Create {activeEnvName} Access Key
                    </button>
                  ) : (
                    <p className="text-xs text-gray-500 italic">
                      Configure an integration first to create Access Keys for {activeEnvName}.
                    </p>
                  )
                }
              />
            ) : (
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Key Name</th>
                      <th>Public Key ID</th>
                      <th>Status</th>
                      <th>Expires</th>
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {envAccessKeys.map((key) => (
                      <tr key={key._id}>
                        <td>
                          <div className="font-semibold text-white text-xs">{key.name}</div>
                          {key.description && (
                            <div className="text-[11px] text-gray-500 mt-0.5 truncate max-w-xs">
                              {key.description}
                            </div>
                          )}
                        </td>
                        <td>
                          <code className="text-[11px] font-mono text-blue-300 bg-[#0d1117] px-2 py-0.5 rounded border border-white/5">
                            {key.publicKeyId}
                          </code>
                        </td>
                        <td>
                          <Badge variant={getApiKeyStatusVariant(key.status)}>{key.status}</Badge>
                        </td>
                        <td className="text-xs font-mono text-gray-400">
                          {key.expiresAt ? (
                            new Date(key.expiresAt).toLocaleDateString()
                          ) : (
                            <span className="text-gray-500">Never</span>
                          )}
                        </td>
                        <td className="text-xs font-mono text-gray-500">
                          {new Date(key.createdAt).toLocaleDateString()}
                        </td>
                        <td>
                          <div className="flex items-center gap-1">
                            {key.status === "ACTIVE" && (
                              <button
                                onClick={() => openRevokeKeyConfirm(key._id, key.name)}
                                className="p-1.5 hover:bg-white/5 rounded text-red-400 hover:text-red-300 transition-colors"
                                title="Revoke Key"
                              >
                                <Ban className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <Link
                              to={`/org/${activeOrg._id}/api-keys?teamId=${selectedTeamId}&envId=${key.environmentId}`}
                              className="p-1.5 hover:bg-white/5 rounded text-gray-400 hover:text-white transition-colors"
                              title="Manage in API Keys"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Modal: Create Integration (Atomic) ─────────────────────────────── */}
      <Modal
        isOpen={showCreateIntegrationModal}
        onClose={() => setShowCreateIntegrationModal(false)}
        title={`Add Integration & Initial Endpoint (${activeEnvName})`}
        size="lg"
      >
        <form onSubmit={handleCreateIntegration} className="space-y-4">
          {createIntegrationError && (
            <div className="p-3 bg-red-950/60 border border-red-800/60 rounded-md text-red-300 text-xs">
              {createIntegrationError}
            </div>
          )}

          <div>
            <label className="label">Integration Name *</label>
            <input
              type="text"
              className="input text-xs"
              placeholder="e.g. OpenWeather Service, Stripe, GitHub"
              value={newIntegrationName}
              onChange={(e) => setNewIntegrationName(e.target.value)}
              disabled={createIntegrationSubmitting}
              required
            />
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
                className="input text-xs"
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
              <label className="label">Upstream Provider Credential / Secret Key *</label>
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
                Encrypted with AES-256-GCM on the backend. Never exposed in the UI.
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

      {/* ── Modal: Add Upstream API ────────────────────────────────────────── */}
      <Modal
        isOpen={showAddUpstreamModal}
        onClose={() => setShowAddUpstreamModal(false)}
        title="Add Upstream API Endpoint"
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
              className="input text-xs"
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
            <label className="label">Provider Credential / Secret Key *</label>
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
              className="input text-xs"
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
            <label className="label">Replace Provider Credential (Optional)</label>
            <input
              type="password"
              className="input font-mono text-xs"
              placeholder="Leave blank to preserve existing credential [••••••••]"
              value={editApiCredential}
              onChange={(e) => setEditApiCredential(e.target.value)}
              disabled={editApiSubmitting}
            />
            <p className="text-[11px] text-gray-500 font-mono mt-1">
              Existing credentials remain encrypted on the backend. Only enter a value to replace.
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

      {/* ── Modal: Quick Create Access Key Scoped to Environment ──────────── */}
      <Modal
        isOpen={showCreateKeyModal}
        onClose={() => setShowCreateKeyModal(false)}
        title={`Create Access Key (${activeEnvName})`}
        size="md"
      >
        <form onSubmit={handleCreateAccessKey} className="space-y-4">
          {createKeyError && (
            <div className="p-3 bg-red-950/60 border border-red-800/60 rounded-md text-red-300 text-xs">
              {createKeyError}
            </div>
          )}

          <div>
            <label className="label">Key Name *</label>
            <input
              type="text"
              className="input text-xs"
              placeholder="e.g. Backend Test Key"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              disabled={createKeySubmitting}
              required
            />
          </div>

          <div>
            <label className="label">Description (Optional)</label>
            <input
              type="text"
              className="input text-xs"
              placeholder="e.g. Service testing machine key"
              value={newKeyDesc}
              onChange={(e) => setNewKeyDesc(e.target.value)}
              disabled={createKeySubmitting}
            />
          </div>

          <div>
            <label className="label">Expiration</label>
            <select
              className="input text-xs"
              value={newKeyExpiration}
              onChange={(e) => setNewKeyExpiration(e.target.value)}
              disabled={createKeySubmitting}
            >
              <option value="NEVER">Never expires</option>
              <option value="30_DAYS">30 days</option>
              <option value="90_DAYS">90 days</option>
              <option value="365_DAYS">1 year</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={() => setShowCreateKeyModal(false)}
              className="btn-secondary text-xs"
              disabled={createKeySubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary text-xs"
              disabled={createKeySubmitting}
            >
              {createKeySubmitting ? "Generating..." : "Generate Access Key"}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Modal: One-Time Secret Display ─────────────────────────────────── */}
      <Modal
        isOpen={Boolean(createdSecret)}
        onClose={() => setCreatedSecret(null)}
        title="Access Key Created"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-xs text-gray-300">
            Your access key will only be shown once. Copy and store this secret securely.
          </p>

          <div className="flex items-center gap-2 p-3 bg-[#0d1117] border border-white/10 rounded-lg">
            <code className="text-blue-300 font-mono text-xs break-all flex-1 select-all">
              {createdSecret}
            </code>
            <button
              onClick={() => {
                navigator.clipboard.writeText(createdSecret);
                setCopiedSecret(true);
                setTimeout(() => setCopiedSecret(false), 2000);
              }}
              className="btn-primary text-xs py-1.5 px-3 shrink-0 flex items-center gap-1.5"
            >
              {copiedSecret ? (
                <>
                  <Check className="w-3.5 h-3.5 text-green-300" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Copy
                </>
              )}
            </button>
          </div>

          <div className="p-3 bg-yellow-950/40 border border-yellow-800/60 rounded-lg text-yellow-300 text-xs flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-yellow-400 mt-0.5" />
            <span>
              <strong>Warning:</strong> Store this key securely. APIShield cannot display it
              again.
            </span>
          </div>

          <div className="flex justify-end pt-2 border-t border-white/10">
            <button
              onClick={() => setCreatedSecret(null)}
              className="btn-secondary text-xs"
            >
              Done
            </button>
          </div>
        </div>
      </Modal>

      {/* ── Modal: Live Gateway Execution Test ─────────────────────────────── */}
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
              placeholder="e.g. apishield_test_..."
              value={testApiKey}
              onChange={(e) => setTestApiKey(e.target.value)}
              disabled={testingGateway}
              required
            />
            <p className="text-[11px] text-gray-400 font-mono mt-1">
              Provide an active Access Key generated for the{" "}
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
              to={`/org/${activeOrg._id}/api-keys?teamId=${selectedTeamId}`}
              className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium"
              target="_blank"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Manage Access Keys
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
