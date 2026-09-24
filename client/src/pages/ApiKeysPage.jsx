/**
 * ApiKeysPage.jsx
 *
 * Full API key management page.
 * Hierarchy: Team -> Integration -> Environment -> API Key
 *
 * Allows team selection, key creation (with one-time secret display), rotation, revocation, and archiving.
 * API keys are associated with an Environment (environmentId).
 * Creation flow allows selecting Integration -> Environment, or accepts preselected environmentId from query params.
 */

import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useOrg } from "../context/OrgContext";
import teamsApi from "../api/teams";
import apiKeysApi from "../api/apiKeys";
import integrationsApi from "../api/integrations";

import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";
import EmptyState from "../components/EmptyState";
import Badge, { getApiKeyStatusVariant } from "../components/Badge";
import Modal from "../components/Modal";
import ConfirmModal from "../components/ConfirmModal";

import {
  KeyRound,
  Plus,
  RefreshCw,
  Ban,
  Archive,
  Copy,
  Check,
  ShieldAlert,
  Blocks,
  Filter
} from "lucide-react";

export default function ApiKeysPage() {
  const { activeOrg } = useOrg();
  const [searchParams] = useSearchParams();

  const [teams, setTeams] = useState([]);
  const [selectedTeamId, setSelectedTeamId] = useState(searchParams.get("teamId") || "");
  const [apiKeys, setApiKeys] = useState([]);
  const [integrations, setIntegrations] = useState([]);

  // Filter keys by environment or integration if desired
  const [filterEnvId, setFilterEnvId] = useState(searchParams.get("envId") || "ALL");

  const [loadingTeams, setLoadingTeams] = useState(true);
  const [loadingKeys, setLoadingKeys] = useState(false);
  const [error, setError] = useState("");

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createdSecret, setCreatedSecret] = useState(null);
  const [copied, setCopied] = useState(false);

  // Confirm Modal state
  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    actionType: null, // "rotate" | "revoke" | "archive"
    apiKeyId: null,
    title: "",
    description: "",
    confirmText: "",
    variant: "danger",
    loading: false,
  });

  // Form State for Creation
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedIntegrationId, setSelectedIntegrationId] = useState("");
  const [selectedEnvironmentId, setSelectedEnvironmentId] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [selectedScopes, setSelectedScopes] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState("");

  const availableScopes = [
    "users:read",
    "users:write",
    "teams:read",
    "teams:write",
    "api_keys:read",
    "api_keys:write"
  ];

  // Helper map: environmentId -> { envName, integrationName, baseUrl, status, upstreamApisCount }
  const envMap = {};
  integrations.forEach((integration) => {
    (integration.environments || []).forEach((env) => {
      envMap[env._id] = {
        envName: env.name,
        integrationName: integration.name,
        integrationId: integration._id,
        status: env.status,
        integrationStatus: integration.status,
        upstreamApisCount: (env.upstreamApis || []).length,
      };
    });
  });

  useEffect(() => {
    if (!activeOrg) return;
    loadTeams();
  }, [activeOrg]);

  useEffect(() => {
    if (selectedTeamId) {
      loadApiKeys(selectedTeamId);
      loadIntegrations(selectedTeamId);
    } else {
      setApiKeys([]);
      setIntegrations([]);
    }
  }, [selectedTeamId]);

  // Set filterEnvId if passed via search param
  useEffect(() => {
    const queryEnvId = searchParams.get("envId");
    if (queryEnvId) {
      setFilterEnvId(queryEnvId);
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
      setError("Failed to load teams.");
    } finally {
      setLoadingTeams(false);
    }
  };

  const loadApiKeys = async (teamId) => {
    try {
      setLoadingKeys(true);
      setError("");
      const response = await apiKeysApi.getAll(activeOrg._id, teamId);
      setApiKeys(response.data?.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load API keys for this team.");
    } finally {
      setLoadingKeys(false);
    }
  };

  const loadIntegrations = async (teamId) => {
    try {
      const response = await integrationsApi.getAll(activeOrg._id, teamId);
      setIntegrations(response.data?.data || []);
    } catch (err) {
      console.error("Failed to load integrations for team:", err);
    }
  };

  const handleOpenCreateModal = (preselectedEnvId = null) => {
    setName("");
    setDescription("");
    setExpiresAt("");
    setSelectedScopes([]);
    setModalError("");

    if (preselectedEnvId && envMap[preselectedEnvId]) {
      const meta = envMap[preselectedEnvId];
      setSelectedIntegrationId(meta.integrationId);
      setSelectedEnvironmentId(preselectedEnvId);
    } else if (integrations.length > 0) {
      // Find first integration with environments
      const withEnvs = integrations.find((i) => i.environments && i.environments.length > 0) || integrations[0];
      setSelectedIntegrationId(withEnvs._id);
      const firstEnv = withEnvs.environments?.[0];
      setSelectedEnvironmentId(firstEnv ? firstEnv._id : "");
    } else {
      setSelectedIntegrationId("");
      setSelectedEnvironmentId("");
    }

    setShowCreateModal(true);
  };

  const handleIntegrationChange = (integrationId) => {
    setSelectedIntegrationId(integrationId);
    const chosen = integrations.find((i) => i._id === integrationId);
    const firstEnv = chosen?.environments?.[0];
    setSelectedEnvironmentId(firstEnv ? firstEnv._id : "");
  };

  const handleScopeToggle = (scope) => {
    setSelectedScopes((prev) =>
      prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope]
    );
  };

  const handleCreateApiKey = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setModalError("Key name is required.");
      return;
    }
    if (!selectedEnvironmentId) {
      setModalError("Please select a target Environment.");
      return;
    }

    try {
      setSubmitting(true);
      setModalError("");

      const payload = {
        name: name.trim(),
        description: description.trim() || undefined,
        environmentId: selectedEnvironmentId,
        scopes: selectedScopes,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
      };

      const response = await apiKeysApi.create(activeOrg._id, selectedTeamId, payload);
      const secret = response.data?.data?.apiKey;

      setShowCreateModal(false);
      setName("");
      setDescription("");
      setExpiresAt("");
      setSelectedScopes([]);

      setCreatedSecret(secret);
      loadApiKeys(selectedTeamId);
    } catch (err) {
      setModalError(err.response?.data?.message || "Failed to create API Key.");
    } finally {
      setSubmitting(false);
    }
  };

  // Trigger Confirmation Modal for Actions
  const openConfirmModal = (type, apiKeyId, keyName) => {
    if (type === "rotate") {
      setConfirmState({
        isOpen: true,
        actionType: "rotate",
        apiKeyId,
        title: "Rotate API Key?",
        description: `Are you sure you want to rotate secret for "${keyName}"?\nThe current API key secret will be permanently invalidated. Applications using the old key will stop working until updated with the new key secret.`,
        confirmText: "Rotate Key",
        variant: "warning",
        loading: false,
      });
    } else if (type === "revoke") {
      setConfirmState({
        isOpen: true,
        actionType: "revoke",
        apiKeyId,
        title: "Revoke API Key?",
        description: `Are you sure you want to revoke API key "${keyName}"?\nThis will permanently prevent the key from making API requests. This action cannot be undone.`,
        confirmText: "Revoke Key",
        variant: "danger",
        loading: false,
      });
    } else if (type === "archive") {
      setConfirmState({
        isOpen: true,
        actionType: "archive",
        apiKeyId,
        title: "Archive API Key?",
        description: `Are you sure you want to archive API key "${keyName}"?\nArchived keys are moved to dark storage and removed from active key lists.`,
        confirmText: "Archive Key",
        variant: "primary",
        loading: false,
      });
    }
  };

  // Execute Confirmed Action
  const handleConfirmAction = async () => {
    const { actionType, apiKeyId } = confirmState;
    try {
      setConfirmState((prev) => ({ ...prev, loading: true }));
      if (actionType === "rotate") {
        const response = await apiKeysApi.rotate(activeOrg._id, selectedTeamId, apiKeyId);
        const secret = response.data?.data?.apiKey;
        setCreatedSecret(secret);
      } else if (actionType === "revoke") {
        await apiKeysApi.revoke(activeOrg._id, selectedTeamId, apiKeyId);
      } else if (actionType === "archive") {
        await apiKeysApi.archive(activeOrg._id, selectedTeamId, apiKeyId);
      }
      setConfirmState({ isOpen: false, actionType: null, apiKeyId: null, title: "", description: "", confirmText: "", variant: "danger", loading: false });
      loadApiKeys(selectedTeamId);
    } catch (err) {
      alert(err.response?.data?.message || `Failed to execute ${actionType} action.`);
      setConfirmState((prev) => ({ ...prev, loading: false }));
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Available environments for selected integration in create modal
  const activeModalIntegration = integrations.find((i) => i._id === selectedIntegrationId);
  const availableModalEnvs = activeModalIntegration?.environments || [];

  // Filtered API Keys
  const filteredApiKeys = apiKeys.filter((key) => {
    if (filterEnvId === "ALL") return true;
    return key.environmentId === filterEnvId;
  });

  if (loadingTeams) {
    return <LoadingSpinner message="Loading teams..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-blue-400" />
            API Keys
          </h1>
          <p className="page-description">
            Manage environment-scoped credentials and tokens for your team
          </p>
        </div>

        {selectedTeamId && (
          <button
            onClick={() => handleOpenCreateModal(filterEnvId !== "ALL" ? filterEnvId : null)}
            className="btn-primary text-xs"
          >
            <Plus className="w-4 h-4" />
            Create API Key
          </button>
        )}
      </div>

      {/* Team Filter & Environment Filter Bar */}
      {teams.length === 0 ? (
        <EmptyState
          message="No teams found in this workspace. You must belong to a team to manage API keys."
        />
      ) : (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#161b22] border border-white/10 p-4 rounded-xl">
          <div className="flex items-center gap-3">
            <label className="text-xs font-mono font-semibold text-gray-400 uppercase tracking-wider">
              Select Team:
            </label>
            <select
              className="input max-w-xs text-xs"
              value={selectedTeamId}
              onChange={(e) => {
                setSelectedTeamId(e.target.value);
                setFilterEnvId("ALL");
              }}
            >
              {teams.map((team) => (
                <option key={team._id} value={team._id}>
                  {team.name}
                </option>
              ))}
            </select>
          </div>

          {/* Environment Filter Selector */}
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-xs text-gray-400 font-mono">Filter Environment:</span>
            <select
              className="input text-xs py-1 max-w-xs"
              value={filterEnvId}
              onChange={(e) => setFilterEnvId(e.target.value)}
            >
              <option value="ALL">All Environments</option>
              {integrations.map((i) =>
                (i.environments || []).map((env) => (
                  <option key={env._id} value={env._id}>
                    {i.name} — {env.name}
                  </option>
                ))
              )}
            </select>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && <ErrorMessage message={error} onRetry={() => loadApiKeys(selectedTeamId)} />}

      {/* Keys Table */}
      {selectedTeamId && !loadingKeys && !error && (
        filteredApiKeys.length === 0 ? (
          <EmptyState
            message={
              filterEnvId !== "ALL"
                ? "No API keys found for the selected environment."
                : integrations.length === 0
                ? "No integrations configured yet. Create an integration and environment before generating API keys."
                : "No API keys found for this team."
            }
            action={
              integrations.length === 0 ? (
                <Link
                  to={`/org/${activeOrg._id}/integrations?teamId=${selectedTeamId}`}
                  className="btn-primary text-xs flex items-center gap-1.5"
                >
                  <Blocks className="w-4 h-4" /> Go to Integrations
                </Link>
              ) : (
                <button
                  onClick={() => handleOpenCreateModal(filterEnvId !== "ALL" ? filterEnvId : null)}
                  className="btn-primary text-xs"
                >
                  <Plus className="w-4 h-4" />
                  Create First API Key
                </button>
              )
            }
          />
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Name / Key Prefix</th>
                  <th>Integration & Environment</th>
                  <th>Status</th>
                  <th>Scopes</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredApiKeys.map((key) => {
                  const envDetails = envMap[key.environmentId];
                  return (
                    <tr key={key._id}>
                      <td>
                        <div className="font-semibold text-white">{key.name}</div>
                        <div className="font-mono text-[11px] text-blue-300 mt-0.5">
                          {key.publicKeyId}...
                        </div>
                        {key.description && (
                          <div className="text-xs text-gray-400 mt-0.5">{key.description}</div>
                        )}
                      </td>
                      <td>
                        {envDetails ? (
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              <span className="text-white text-xs font-medium">
                                {envDetails.integrationName}
                              </span>
                              <Badge
                                variant={
                                  envDetails.status === "ACTIVE" ? "info" : "danger"
                                }
                              >
                                {envDetails.envName}
                              </Badge>
                            </div>
                            <div className="text-[10px] text-gray-500 font-mono">
                              {envDetails.upstreamApisCount || 0} Upstream {envDetails.upstreamApisCount === 1 ? "API" : "APIs"}
                            </div>
                            {envDetails.status === "REVOKED" && (
                              <span className="text-[10px] text-red-400 font-mono block">
                                (Environment Disabled)
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="font-mono text-xs text-gray-500">
                            Env ID: {key.environmentId?.slice(-6)}
                          </span>
                        )}
                      </td>
                      <td>
                        <Badge variant={getApiKeyStatusVariant(key.status)}>{key.status}</Badge>
                      </td>
                      <td>
                        <div className="flex flex-wrap gap-1">
                          {key.scopes && key.scopes.length > 0 ? (
                            key.scopes.map((s) => (
                              <span
                                key={s}
                                className="text-[10px] bg-[#1c2128] border border-white/5 text-gray-400 px-1.5 py-0.5 rounded font-mono"
                              >
                                {s}
                              </span>
                            ))
                          ) : (
                            <span className="text-[10px] text-gray-500 font-mono">All scopes</span>
                          )}
                        </div>
                      </td>
                      <td className="text-xs font-mono text-gray-400">
                        {new Date(key.createdAt).toLocaleDateString()}
                      </td>
                      <td>
                        <div className="flex items-center gap-1.5">
                          {key.status === "ACTIVE" && (
                            <>
                              <button
                                onClick={() => openConfirmModal("rotate", key._id, key.name)}
                                className="p-1.5 hover:bg-white/5 rounded text-yellow-400 hover:text-yellow-300 transition-colors"
                                title="Rotate Secret"
                              >
                                <RefreshCw className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => openConfirmModal("revoke", key._id, key.name)}
                                className="p-1.5 hover:bg-white/5 rounded text-red-400 hover:text-red-300 transition-colors"
                                title="Revoke Key"
                              >
                                <Ban className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}

                          {key.status === "REVOKED" && (
                            <button
                              onClick={() => openConfirmModal("archive", key._id, key.name)}
                              className="p-1.5 hover:bg-white/5 rounded text-gray-400 hover:text-white transition-colors"
                              title="Archive Key"
                            >
                              <Archive className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* Modal: Create API Key Form */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New API Key"
        size="lg"
      >
        <form onSubmit={handleCreateApiKey} className="space-y-4">
          {modalError && (
            <div className="p-3 bg-red-950/60 border border-red-800/60 rounded-md text-red-300 text-xs">
              {modalError}
            </div>
          )}

          {integrations.length === 0 ? (
            <div className="p-4 bg-yellow-950/40 border border-yellow-800/60 rounded-xl space-y-3">
              <p className="text-yellow-300 text-xs">
                No integrations found for this team. An API key must belong to an Environment of an Integration.
              </p>
              <Link
                to={`/org/${activeOrg._id}/integrations?teamId=${selectedTeamId}`}
                className="btn-primary text-xs inline-flex items-center gap-1"
                onClick={() => setShowCreateModal(false)}
              >
                <Blocks className="w-3.5 h-3.5" /> Configure Integration First
              </Link>
            </div>
          ) : (
            <>
              <div className="p-3 bg-[#1c2128] border border-white/10 rounded-lg text-xs text-gray-400 flex items-start gap-2">
                <KeyRound className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <span>
                  APIShield Access Keys authenticate client applications with the APIShield Gateway (<code className="text-blue-300 font-mono">x-api-key</code>). The gateway handles upstream provider credentials securely on the backend.
                </span>
              </div>

              <div>
                <label className="label">Key Name *</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. Weather Service Production Key"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={submitting}
                  required
                />
              </div>

              {/* Hierarchy: Integration -> Environment */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="label">Integration Provider *</label>
                  <select
                    className="input"
                    value={selectedIntegrationId}
                    onChange={(e) => handleIntegrationChange(e.target.value)}
                    disabled={submitting}
                    required
                  >
                    {integrations.map((item) => (
                      <option key={item._id} value={item._id}>
                        {item.name} ({item.status})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label">Target Environment *</label>
                  {availableModalEnvs.length === 0 ? (
                    <p className="text-xs text-red-400 italic py-2">
                      No environments found for this integration.
                    </p>
                  ) : (
                    <select
                      className="input"
                      value={selectedEnvironmentId}
                      onChange={(e) => setSelectedEnvironmentId(e.target.value)}
                      disabled={submitting}
                      required
                    >
                      {availableModalEnvs.map((env) => (
                        <option key={env._id} value={env._id}>
                          {env.name} ({env.status}) • {(env.upstreamApis || []).length} Upstream { (env.upstreamApis || []).length === 1 ? "API" : "APIs" }
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              <div>
                <label className="label">Description (Optional)</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Primary key used for backend microservice proxy calls"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={submitting}
                />
              </div>

              <div>
                <label className="label">Expiration Date (Optional)</label>
                <input
                  type="date"
                  className="input"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  disabled={submitting}
                />
              </div>

              <div>
                <label className="label">API Scopes (Optional)</label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  {availableScopes.map((scope) => (
                    <label
                      key={scope}
                      className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedScopes.includes(scope)}
                        onChange={() => handleScopeToggle(scope)}
                        className="rounded bg-[#0e131b] border-white/10 text-[#2f81f7] focus:ring-blue-500"
                      />
                      <span className="font-mono">{scope}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn-secondary text-xs"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary text-xs"
                  disabled={submitting || !selectedEnvironmentId}
                >
                  {submitting ? "Generating..." : "Generate API Key"}
                </button>
              </div>
            </>
          )}
        </form>
      </Modal>

      {/* Modal: Display One-Time Created Secret */}
      <Modal
        isOpen={Boolean(createdSecret)}
        onClose={() => setCreatedSecret(null)}
        title="API Key Generated Successfully"
      >
        <div className="space-y-4">
          <div className="p-3 bg-yellow-950/40 border border-yellow-800/60 rounded-xl flex items-start gap-3 text-yellow-300 text-xs">
            <ShieldAlert className="w-5 h-5 shrink-0 text-yellow-400 mt-0.5" />
            <div>
              <span className="font-bold block">Save this key in a secure location!</span>
              This secret key will only be shown once. It cannot be recovered after closing this window.
            </div>
          </div>

          <div>
            <label className="label">Full Plain-Text API Key</label>
            <div className="flex items-center gap-2 mt-1">
              <input
                type="text"
                readOnly
                value={createdSecret || ""}
                className="input font-mono text-xs select-all text-blue-300 bg-[#0d1117]"
              />
              <button
                onClick={() => copyToClipboard(createdSecret)}
                className="btn-primary text-xs px-3 py-2 shrink-0"
              >
                {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t border-white/10">
            <button onClick={() => setCreatedSecret(null)} className="btn-secondary text-xs">
              Done & Close
            </button>
          </div>
        </div>
      </Modal>

      {/* Reusable Confirm Modal for dangerous key actions */}
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
