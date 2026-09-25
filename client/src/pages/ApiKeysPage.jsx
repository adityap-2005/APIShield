/**
 * ApiKeysPage.jsx
 *
 * Professional developer console for APIShield Access Key management.
 * Conceptual Hierarchy: Organization -> Team -> Environment -> APIShield Access Keys
 *
 * APIShield Access Keys are environment-scoped persistent machine credentials
 * used by client applications to authenticate requests against the APIShield Gateway.
 *
 * Features:
 * - Team selector & Environment filter
 * - Simple creation form: Name, Description, Environment, Expiration (No obsolete scopes)
 * - One-time secret display with immediate clipboard copy
 * - Key details modal with full metadata
 * - Single-key rotation workflow (displays newly generated secret once)
 * - Revocation & Archiving with clear confirmation dialogs
 * - Full historical visibility (ACTIVE, REVOKED, EXPIRED, ARCHIVED)
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
  Filter,
  Eye,
  Calendar,
  Layers,
  Lock,
  ExternalLink
} from "lucide-react";

export default function ApiKeysPage() {
  const { activeOrg } = useOrg();
  const [searchParams] = useSearchParams();

  const [teams, setTeams] = useState([]);
  const [selectedTeamId, setSelectedTeamId] = useState(searchParams.get("teamId") || "");
  const [apiKeys, setApiKeys] = useState([]);
  const [integrations, setIntegrations] = useState([]);

  // Filter keys by environment
  const [filterEnvId, setFilterEnvId] = useState(searchParams.get("envId") || "ALL");

  const [loadingTeams, setLoadingTeams] = useState(true);
  const [loadingKeys, setLoadingKeys] = useState(false);
  const [error, setError] = useState("");

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedKeyForDetails, setSelectedKeyForDetails] = useState(null);
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
  const [selectedEnvironmentId, setSelectedEnvironmentId] = useState("");
  const [expirationPreset, setExpirationPreset] = useState("NEVER");
  const [customExpiresAt, setCustomExpiresAt] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState("");

  // Flattened environments from integrations
  const envMap = {};
  const allEnvironments = [];

  integrations.forEach((integration) => {
    (integration.environments || []).forEach((env) => {
      if (!envMap[env._id]) {
        envMap[env._id] = {
          envId: env._id,
          envName: env.name,
          integrationName: integration.name,
          integrationId: integration._id,
          status: env.status,
          upstreamApisCount: (env.upstreamApis || []).length,
        };
        allEnvironments.push({
          _id: env._id,
          name: env.name,
          status: env.status,
          integrationName: integration.name,
          upstreamApisCount: (env.upstreamApis || []).length,
        });
      }
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
    const queryAction = searchParams.get("action");
    if (queryAction === "create") {
      handleOpenCreateModal(queryEnvId);
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
    setExpirationPreset("NEVER");
    setCustomExpiresAt("");
    setModalError("");

    if (preselectedEnvId && envMap[preselectedEnvId]) {
      setSelectedEnvironmentId(preselectedEnvId);
    } else if (allEnvironments.length > 0) {
      setSelectedEnvironmentId(allEnvironments[0]._id);
    } else {
      setSelectedEnvironmentId("");
    }

    setShowCreateModal(true);
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

    let calculatedExpiresAt = undefined;
    if (expirationPreset === "30_DAYS") {
      calculatedExpiresAt = new Date(Date.now() + 30 * 86400000).toISOString();
    } else if (expirationPreset === "90_DAYS") {
      calculatedExpiresAt = new Date(Date.now() + 90 * 86400000).toISOString();
    } else if (expirationPreset === "180_DAYS") {
      calculatedExpiresAt = new Date(Date.now() + 180 * 86400000).toISOString();
    } else if (expirationPreset === "365_DAYS") {
      calculatedExpiresAt = new Date(Date.now() + 365 * 86400000).toISOString();
    } else if (expirationPreset === "CUSTOM") {
      if (!customExpiresAt) {
        setModalError("Please specify an expiration date.");
        return;
      }
      calculatedExpiresAt = new Date(customExpiresAt).toISOString();
    }

    try {
      setSubmitting(true);
      setModalError("");

      const payload = {
        name: name.trim(),
        description: description.trim() || undefined,
        environmentId: selectedEnvironmentId,
        expiresAt: calculatedExpiresAt,
      };

      const response = await apiKeysApi.create(activeOrg._id, selectedTeamId, payload);
      const secret = response.data?.data?.apiKey;

      setShowCreateModal(false);
      setName("");
      setDescription("");
      setExpirationPreset("NEVER");
      setCustomExpiresAt("");

      // Show one-time secret modal
      setCreatedSecret(secret);
      loadApiKeys(selectedTeamId);
    } catch (err) {
      setModalError(err.response?.data?.message || "Failed to create Access Key.");
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
        title: "Rotate Access Key?",
        description: `A new secret will be generated for "${keyName}". The existing key will remain active until you revoke it.`,
        confirmText: "Rotate Key",
        variant: "warning",
        loading: false,
      });
    } else if (type === "revoke") {
      setConfirmState({
        isOpen: true,
        actionType: "revoke",
        apiKeyId,
        title: "Revoke Access Key?",
        description: `This key will immediately stop working. Client applications using this key will be unable to access the APIShield Gateway. This action cannot be undone.`,
        confirmText: "Revoke Key",
        variant: "danger",
        loading: false,
      });
    } else if (type === "archive") {
      setConfirmState({
        isOpen: true,
        actionType: "archive",
        apiKeyId,
        title: "Archive Access Key?",
        description: `Archived keys remain in history for auditing purposes but are permanently inactive.`,
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
        if (selectedKeyForDetails?._id === apiKeyId) {
          setSelectedKeyForDetails(null);
        }
      } else if (actionType === "revoke") {
        await apiKeysApi.revoke(activeOrg._id, selectedTeamId, apiKeyId);
        if (selectedKeyForDetails?._id === apiKeyId) {
          setSelectedKeyForDetails((prev) => ({ ...prev, status: "REVOKED" }));
        }
      } else if (actionType === "archive") {
        await apiKeysApi.archive(activeOrg._id, selectedTeamId, apiKeyId);
        if (selectedKeyForDetails?._id === apiKeyId) {
          setSelectedKeyForDetails((prev) => ({ ...prev, status: "ARCHIVED" }));
        }
      }
      setConfirmState({
        isOpen: false,
        actionType: null,
        apiKeyId: null,
        title: "",
        description: "",
        confirmText: "",
        variant: "danger",
        loading: false,
      });
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

  // Filtered API Keys
  const filteredApiKeys = apiKeys.filter((key) => {
    if (filterEnvId === "ALL") return true;
    return key.environmentId === filterEnvId;
  });

  if (loadingTeams) {
    return <LoadingSpinner message="Loading workspace teams..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-blue-400" />
            APIShield Access Keys
          </h1>
          <p className="page-description">
            Environment-scoped machine credentials for authenticating gateway traffic
          </p>
        </div>

        {selectedTeamId && (
          <button
            onClick={() => handleOpenCreateModal(filterEnvId !== "ALL" ? filterEnvId : null)}
            className="btn-primary text-xs"
          >
            <Plus className="w-4 h-4" />
            Create Access Key
          </button>
        )}
      </div>

      {/* Team Filter & Environment Filter Bar */}
      {teams.length === 0 ? (
        <EmptyState
          message="No teams found in this workspace. You must belong to a team to manage Access Keys."
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
            <span className="text-xs text-gray-400 font-mono">Environment:</span>
            <select
              className="input text-xs py-1 max-w-xs"
              value={filterEnvId}
              onChange={(e) => setFilterEnvId(e.target.value)}
            >
              <option value="ALL">All Environments</option>
              {allEnvironments.map((env) => (
                <option key={env._id} value={env._id}>
                  {env.name} ({env.integrationName})
                </option>
              ))}
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
                ? "No Access Keys found for this environment."
                : allEnvironments.length === 0
                ? "No environments configured yet. Set up an environment in Integrations before creating Access Keys."
                : "No Access Keys found for this team."
            }
            action={
              allEnvironments.length === 0 ? (
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
                  Create First Access Key
                </button>
              )
            }
          />
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Environment</th>
                  <th>Public Key ID</th>
                  <th>Status</th>
                  <th>Expires</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredApiKeys.map((key) => {
                  const envDetails = envMap[key.environmentId];
                  const isRevoked = key.status === "REVOKED";
                  const isArchived = key.status === "ARCHIVED";

                  return (
                    <tr key={key._id} className={isArchived ? "opacity-60 bg-black/20" : ""}>
                      <td>
                        <div className="font-semibold text-white text-xs">{key.name}</div>
                        {key.description && (
                          <div className="text-[11px] text-gray-500 mt-0.5 truncate max-w-xs">
                            {key.description}
                          </div>
                        )}
                      </td>
                      <td>
                        {envDetails ? (
                          <div className="flex items-center gap-1.5">
                            <Badge variant="info">{envDetails.envName}</Badge>
                            <span className="text-gray-500 font-mono text-[10px]">
                              ({envDetails.integrationName})
                            </span>
                          </div>
                        ) : (
                          <Badge variant="default">Environment</Badge>
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
                      <td className="text-xs font-mono text-gray-500 whitespace-nowrap">
                        {new Date(key.createdAt).toLocaleDateString()}
                      </td>
                      <td>
                        <div className="flex items-center gap-1">
                          {/* View details */}
                          <button
                            onClick={() => setSelectedKeyForDetails(key)}
                            className="p-1.5 hover:bg-white/5 rounded text-gray-400 hover:text-white transition-colors"
                            title="View Key Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Rotate Key */}
                          {key.status === "ACTIVE" && (
                            <button
                              onClick={() => openConfirmModal("rotate", key._id, key.name)}
                              className="p-1.5 hover:bg-white/5 rounded text-yellow-400 hover:text-yellow-300 transition-colors"
                              title="Rotate Secret"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Revoke Key */}
                          {key.status === "ACTIVE" && (
                            <button
                              onClick={() => openConfirmModal("revoke", key._id, key.name)}
                              className="p-1.5 hover:bg-white/5 rounded text-red-400 hover:text-red-300 transition-colors"
                              title="Revoke Key"
                            >
                              <Ban className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Archive Key */}
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

      {/* ── Modal: Create Access Key ────────────────────────────────────────── */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Access Key"
        size="md"
      >
        <form onSubmit={handleCreateApiKey} className="space-y-4">
          {modalError && (
            <div className="p-3 bg-red-950/60 border border-red-800/60 rounded-md text-red-300 text-xs">
              {modalError}
            </div>
          )}

          {allEnvironments.length === 0 ? (
            <div className="p-4 bg-yellow-950/40 border border-yellow-800/60 rounded-xl space-y-3">
              <p className="text-yellow-300 text-xs">
                No environments configured yet. An Access Key must belong to an Environment.
              </p>
              <Link
                to={`/org/${activeOrg._id}/integrations?teamId=${selectedTeamId}`}
                className="btn-primary text-xs inline-flex items-center gap-1"
                onClick={() => setShowCreateModal(false)}
              >
                <Blocks className="w-3.5 h-3.5" /> Configure Integrations & Environments
              </Link>
            </div>
          ) : (
            <>
              <div className="p-3 bg-[#1c2128] border border-white/10 rounded-lg text-xs text-gray-400 flex items-start gap-2">
                <Lock className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <span>
                  APIShield Access Keys are environment-scoped credentials used by client
                  applications to authenticate gateway requests (<code className="text-blue-300 font-mono">x-api-key</code>).
                </span>
              </div>

              <div>
                <label className="label">Key Name *</label>
                <input
                  type="text"
                  className="input text-xs"
                  placeholder="e.g. Backend Test Key, Microservice Key"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={submitting}
                  required
                />
              </div>

              <div>
                <label className="label">Target Environment *</label>
                <select
                  className="input text-xs"
                  value={selectedEnvironmentId}
                  onChange={(e) => setSelectedEnvironmentId(e.target.value)}
                  disabled={submitting}
                  required
                >
                  {allEnvironments.map((env) => (
                    <option key={env._id} value={env._id}>
                      {env.name} ({env.integrationName})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Description (Optional)</label>
                <input
                  type="text"
                  className="input text-xs"
                  placeholder="e.g. Used by backend service during integration testing"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={submitting}
                />
              </div>

              <div>
                <label className="label">Expiration</label>
                <select
                  className="input text-xs"
                  value={expirationPreset}
                  onChange={(e) => setExpirationPreset(e.target.value)}
                  disabled={submitting}
                >
                  <option value="NEVER">Never expires</option>
                  <option value="30_DAYS">30 days</option>
                  <option value="90_DAYS">90 days</option>
                  <option value="180_DAYS">180 days</option>
                  <option value="365_DAYS">1 year</option>
                  <option value="CUSTOM">Custom date...</option>
                </select>
              </div>

              {expirationPreset === "CUSTOM" && (
                <div>
                  <label className="label">Custom Expiration Date *</label>
                  <input
                    type="date"
                    className="input text-xs font-mono"
                    value={customExpiresAt}
                    onChange={(e) => setCustomExpiresAt(e.target.value)}
                    disabled={submitting}
                    required
                  />
                </div>
              )}

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
                  {submitting ? "Creating..." : "Create Access Key"}
                </button>
              </div>
            </>
          )}
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
              onClick={() => copyToClipboard(createdSecret)}
              className="btn-primary text-xs py-1.5 px-3 shrink-0 flex items-center gap-1.5"
            >
              {copied ? (
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
            <ShieldAlert className="w-4 h-4 shrink-0 text-yellow-400 mt-0.5" />
            <span>
              <strong>Warning:</strong> Store this key securely. APIShield cannot display it
              again. If you lose this key, you will need to rotate it.
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

      {/* ── Modal: Key Details ─────────────────────────────────────────────── */}
      <Modal
        isOpen={Boolean(selectedKeyForDetails)}
        onClose={() => setSelectedKeyForDetails(null)}
        title="Access Key Details"
        size="md"
      >
        {selectedKeyForDetails && (
          <div className="space-y-4 text-xs">
            <div className="space-y-2 bg-[#1c2128] border border-white/10 p-4 rounded-lg">
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-gray-400">Name:</span>
                <span className="font-semibold text-white">{selectedKeyForDetails.name}</span>
              </div>
              {selectedKeyForDetails.description && (
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-gray-400">Description:</span>
                  <span className="text-gray-300">{selectedKeyForDetails.description}</span>
                </div>
              )}
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-gray-400">Environment:</span>
                <Badge variant="info">
                  {envMap[selectedKeyForDetails.environmentId]?.envName || "Environment"}
                </Badge>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-gray-400">Public Key ID:</span>
                <code className="text-blue-300 font-mono">
                  {selectedKeyForDetails.publicKeyId}
                </code>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-gray-400">Status:</span>
                <Badge variant={getApiKeyStatusVariant(selectedKeyForDetails.status)}>
                  {selectedKeyForDetails.status}
                </Badge>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-gray-400">Expires:</span>
                <span className="font-mono text-gray-300">
                  {selectedKeyForDetails.expiresAt
                    ? new Date(selectedKeyForDetails.expiresAt).toLocaleString()
                    : "Never"}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-400">Created:</span>
                <span className="font-mono text-gray-300">
                  {new Date(selectedKeyForDetails.createdAt).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Actions in Details Modal */}
            <div className="flex items-center justify-between pt-3 border-t border-white/10">
              <div className="flex items-center gap-2">
                {selectedKeyForDetails.status === "ACTIVE" && (
                  <>
                    <button
                      onClick={() =>
                        openConfirmModal(
                          "rotate",
                          selectedKeyForDetails._id,
                          selectedKeyForDetails.name
                        )
                      }
                      className="btn-secondary text-xs text-yellow-400 hover:text-yellow-300 flex items-center gap-1"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Rotate Key
                    </button>
                    <button
                      onClick={() =>
                        openConfirmModal(
                          "revoke",
                          selectedKeyForDetails._id,
                          selectedKeyForDetails.name
                        )
                      }
                      className="btn-danger text-xs flex items-center gap-1"
                    >
                      <Ban className="w-3.5 h-3.5" />
                      Revoke Key
                    </button>
                  </>
                )}

                {selectedKeyForDetails.status === "REVOKED" && (
                  <button
                    onClick={() =>
                      openConfirmModal(
                        "archive",
                        selectedKeyForDetails._id,
                        selectedKeyForDetails.name
                      )
                    }
                    className="btn-secondary text-xs flex items-center gap-1"
                  >
                    <Archive className="w-3.5 h-3.5" />
                    Archive Key
                  </button>
                )}
              </div>

              <button
                onClick={() => setSelectedKeyForDetails(null)}
                className="btn-secondary text-xs"
              >
                Close
              </button>
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
