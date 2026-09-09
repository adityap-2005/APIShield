/**
 * ApiKeysPage.jsx
 *
 * Full API key management page.
 * Allows team selection, key creation (with one-time secret display), rotation, revocation, and archiving.
 * Uses custom in-app ConfirmModal for all key mutations (NO window.confirm).
 */

import { useState, useEffect } from "react";
import { useOrg } from "../context/OrgContext";
import teamsApi from "../api/teams";
import apiKeysApi from "../api/apiKeys";

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
  ShieldAlert
} from "lucide-react";

export default function ApiKeysPage() {
  const { activeOrg } = useOrg();

  const [teams, setTeams] = useState([]);
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [apiKeys, setApiKeys] = useState([]);

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
  const [environment, setEnvironment] = useState("DEVELOPMENT");
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

  useEffect(() => {
    if (!activeOrg) return;
    loadTeams();
  }, [activeOrg]);

  useEffect(() => {
    if (selectedTeamId) {
      loadApiKeys(selectedTeamId);
    } else {
      setApiKeys([]);
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
        setSelectedTeamId(teamList[0]._id);
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

    try {
      setSubmitting(true);
      setModalError("");

      const payload = {
        name: name.trim(),
        description: description.trim() || undefined,
        environment,
        scopes: selectedScopes,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined
      };

      const response = await apiKeysApi.create(activeOrg._id, selectedTeamId, payload);
      const secret = response.data?.data?.apiKey;

      setShowCreateModal(false);
      setName("");
      setDescription("");
      setEnvironment("DEVELOPMENT");
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
          <p className="page-description">Manage API credentials and scoped tokens for your team</p>
        </div>

        {selectedTeamId && (
          <button onClick={() => setShowCreateModal(true)} className="btn-primary text-xs">
            <Plus className="w-4 h-4" />
            Create API Key
          </button>
        )}
      </div>

      {/* Team Filter selector */}
      {teams.length === 0 ? (
        <EmptyState
          message="No teams found in this workspace. You must belong to a team to manage API keys."
        />
      ) : (
        <div className="flex items-center gap-3 bg-[#161b22] border border-white/10 p-4 rounded-xl">
          <label className="text-xs font-mono font-semibold text-gray-400 uppercase tracking-wider">Select Team:</label>
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
      )}

      {/* Error state */}
      {error && <ErrorMessage message={error} onRetry={() => loadApiKeys(selectedTeamId)} />}

      {/* Keys Table */}
      {selectedTeamId && !loadingKeys && !error && (
        apiKeys.length === 0 ? (
          <EmptyState
            message="No API keys found for this team."
            action={
              <button onClick={() => setShowCreateModal(true)} className="btn-primary text-xs">
                <Plus className="w-4 h-4" />
                Create First API Key
              </button>
            }
          />
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Name / Key Prefix</th>
                  <th>Environment</th>
                  <th>Status</th>
                  <th>Scopes</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {apiKeys.map((key) => (
                  <tr key={key._id}>
                    <td>
                      <div className="font-semibold text-white">{key.name}</div>
                      <div className="font-mono text-[11px] text-blue-300 mt-0.5">{key.publicKeyId}...</div>
                      {key.description && (
                        <div className="text-xs text-gray-400 mt-0.5">{key.description}</div>
                      )}
                    </td>
                    <td>
                      <Badge variant="info">{key.environment}</Badge>
                    </td>
                    <td>
                      <Badge variant={getApiKeyStatusVariant(key.status)}>{key.status}</Badge>
                    </td>
                    <td>
                      <div className="flex flex-wrap gap-1">
                        {key.scopes && key.scopes.length > 0 ? (
                          key.scopes.map((s) => (
                            <span key={s} className="text-[10px] bg-[#1c2128] border border-white/5 text-gray-400 px-1.5 py-0.5 rounded font-mono">
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
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* Modal: Create API Key Form */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create New API Key" size="lg">
        <form onSubmit={handleCreateApiKey} className="space-y-4">
          {modalError && (
            <div className="p-3 bg-red-950/60 border border-red-800/60 rounded-md text-red-300 text-xs">
              {modalError}
            </div>
          )}

          <div>
            <label className="label">Key Name *</label>
            <input
              type="text"
              className="input"
              placeholder="e.g. Production Service Key"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={submitting}
              required
            />
          </div>

          <div>
            <label className="label">Environment *</label>
            <select
              className="input"
              value={environment}
              onChange={(e) => setEnvironment(e.target.value)}
              disabled={submitting}
            >
              <option value="DEVELOPMENT">DEVELOPMENT (aps_dev_)</option>
              <option value="STAGING">STAGING (aps_stage_)</option>
              <option value="PRODUCTION">PRODUCTION (aps_live_)</option>
              <option value="TEST">TEST (aps_test_)</option>
            </select>
          </div>

          <div>
            <label className="label">Description (Optional)</label>
            <input
              type="text"
              className="input"
              placeholder="Primary API key for payment webhook service"
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
                <label key={scope} className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
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
            <button type="button" onClick={() => setShowCreateModal(false)} className="btn-secondary text-xs" disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn-primary text-xs" disabled={submitting}>
              {submitting ? "Generating..." : "Generate API Key"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Display One-Time Created Secret */}
      <Modal isOpen={Boolean(createdSecret)} onClose={() => setCreatedSecret(null)} title="API Key Generated Successfully">
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
