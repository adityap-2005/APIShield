/**
 * ApiKeysPage.jsx
 *
 * Professional API Key management console.
 * Real backend data only. Hierarchy: Organization -> Project -> API Key
 */

import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useOrg } from "../context/OrgContext";
import projectsApi from "../api/projects";
import apiKeysApi from "../api/apiKeys";

import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";
import Modal from "../components/Modal";
import ConfirmModal from "../components/ConfirmModal";
import { canManageApiKeys } from "../utils/permissions";

import {
  KeyRound,
  Plus,
  Copy,
  Check,
  Ban,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";

export default function ApiKeysPage() {
  const { activeOrg, activeProject } = useOrg();
  const [searchParams] = useSearchParams();

  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(
    searchParams.get("projectId") || activeProject?._id || ""
  );
  const [apiKeys, setApiKeys] = useState([]);

  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingKeys, setLoadingKeys] = useState(false);
  const [error, setError] = useState("");

  // Modals state
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [createdSecret, setCreatedSecret] = useState(null);
  const [secretAction, setSecretAction] = useState("generated");
  const [copiedSecret, setCopiedSecret] = useState(false);

  // Form State
  const [keyName, setKeyName] = useState("");
  const [keyDescription, setKeyDescription] = useState("");
  const [expirationPreset, setExpirationPreset] = useState("NEVER");
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState("");

  // Confirmation state
  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    keyId: null,
    title: "",
    description: "",
    confirmText: "",
    action: null,
    loading: false,
  });

  // Load Projects
  useEffect(() => {
    if (!activeOrg?._id) return;
    loadProjects();
  }, [activeOrg]);

  // Sync with activeProject
  useEffect(() => {
    if (activeProject?._id && !searchParams.get("projectId")) {
      setSelectedProjectId(activeProject._id);
    }
  }, [activeProject]);

  // Load Keys when project changes
  useEffect(() => {
    if (selectedProjectId && activeOrg?._id) {
      loadApiKeys(selectedProjectId);
    } else {
      setApiKeys([]);
    }
  }, [selectedProjectId, activeOrg]);

  const loadProjects = async () => {
    try {
      setLoadingProjects(true);
      setError("");
      const res = await projectsApi.getAll(activeOrg._id);
      const list = res.data?.data || [];
      setProjects(list);
      if (list.length > 0 && !selectedProjectId) {
        setSelectedProjectId(list[0]._id);
      }
    } catch {
      setError("Failed to load workspace projects.");
    } finally {
      setLoadingProjects(false);
    }
  };

  const loadApiKeys = async (projectId) => {
    try {
      setLoadingKeys(true);
      setError("");
      const res = await apiKeysApi.getAll(activeOrg._id, projectId);
      setApiKeys(res.data?.data || []);
    } catch {
      setError("Failed to load API keys.");
    } finally {
      setLoadingKeys(false);
    }
  };

  const handleGenerateKey = async (e) => {
    e.preventDefault();
    if (!keyName.trim()) {
      setModalError("Key name is required.");
      return;
    }

    try {
      setSubmitting(true);
      setModalError("");

      let expiresAt;
      if (expirationPreset === "30_DAYS") {
        expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      } else if (expirationPreset === "90_DAYS") {
        expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();
      } else if (expirationPreset === "1_YEAR") {
        expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
      }

      const res = await apiKeysApi.create(activeOrg._id, selectedProjectId, {
        name: keyName.trim(),
        description: keyDescription.trim() || undefined,
        expiresAt,
      });

      const data = res.data?.data;
      if (data?.apiKey || data?.key || data?.secret) {
        setCreatedSecret(data.apiKey || data.key || data.secret);
        setSecretAction("generated");
      }
      setKeyName("");
      setKeyDescription("");
      await loadApiKeys(selectedProjectId);
    } catch (err) {
      setModalError(err.response?.data?.message || "Failed to generate API key.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRotateKey = (keyItem) => {
    setConfirmState({
      isOpen: true,
      keyId: keyItem._id,
      title: "Rotate API Key",
      description: `Are you sure you want to rotate "${keyItem.name}"? The current secret will stop working and a new secret will be shown once. Save it immediately.`,
      confirmText: "Rotate Key",
      variant: "warning",
      action: async () => {
        try {
          setConfirmState((prev) => ({ ...prev, loading: true }));
          const res = await apiKeysApi.rotate(
            activeOrg._id,
            selectedProjectId,
            keyItem._id
          );
          const data = res.data?.data;
          const newSecret = data?.apiKey || data?.key || data?.secret;

          if (!newSecret) {
            throw new Error("The rotation response did not include a new secret.");
          }

          setCreatedSecret(newSecret);
          setSecretAction("rotated");
          setCopiedSecret(false);
          setShowGenerateModal(true);
          setConfirmState((prev) => ({ ...prev, isOpen: false, loading: false }));
          await loadApiKeys(selectedProjectId);
        } catch (err) {
          setError(err.response?.data?.message || err.message || "Failed to rotate API key.");
          setConfirmState((prev) => ({ ...prev, loading: false }));
        }
      },
    });
  };

  const closeSecretModal = () => {
    setShowGenerateModal(false);
    setCreatedSecret(null);
    setCopiedSecret(false);
  };

  const handleRevokeKey = (keyItem) => {
    setConfirmState({
      isOpen: true,
      keyId: keyItem._id,
      title: "Revoke API Key",
      description: `Are you sure you want to revoke "${keyItem.name}"? Applications using this key will immediately be blocked by the Gateway.`,
      confirmText: "Revoke Key",
      action: async () => {
        try {
          setConfirmState((prev) => ({ ...prev, loading: true }));
          await apiKeysApi.revoke(activeOrg._id, selectedProjectId, keyItem._id);
          setConfirmState((prev) => ({ ...prev, isOpen: false, loading: false }));
          await loadApiKeys(selectedProjectId);
        } catch (err) {
          setError(err.response?.data?.message || "Failed to revoke API key.");
          setConfirmState((prev) => ({ ...prev, loading: false }));
        }
      },
    });
  };

  const currentProject = projects.find((p) => p._id === selectedProjectId) || activeProject;
  const canManage = canManageApiKeys(currentProject);

  if (loadingProjects) {
    return <LoadingSpinner message="Loading workspace projects..." />;
  }

  return (
    <div className="space-y-6">
      {/* ── HEADER ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            API Keys
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Credentials used to authenticate and authorize client application traffic.
          </p>
        </div>

        {canManage && (
          <button
            onClick={() => {
              setCreatedSecret(null);
              setSecretAction("generated");
              setShowGenerateModal(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#10b981] hover:bg-emerald-400 text-black font-semibold text-xs transition-colors shadow-sm shadow-emerald-500/20 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Generate API Key</span>
          </button>
        )}
      </div>

      {error && <ErrorMessage message={error} />}

      {/* ── API KEYS TABLE ─────────────────────────────────────────────────── */}
      {loadingKeys ? (
        <LoadingSpinner message="Loading API keys..." />
      ) : apiKeys.length === 0 ? (
        <div className="bg-[#0e131f] border border-white/10 rounded-xl p-12 text-center">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-4">
            <KeyRound className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-white mb-1">No API keys yet</h3>
          <p className="text-xs text-gray-400 max-w-md mx-auto mb-6">
            Generate an API access key to authenticate gateway requests.
          </p>
          {canManage && (
            <button
              onClick={() => {
                setCreatedSecret(null);
                setShowGenerateModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#10b981] hover:bg-emerald-400 text-black font-semibold text-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Generate API Key</span>
            </button>
          )}
        </div>
      ) : (
        <div className="bg-[#0e131f] border border-white/10 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.02] text-[11px] font-mono text-gray-400 uppercase tracking-wider">
                  <th className="px-4 py-3 font-medium">KEY NAME</th>
                  <th className="px-4 py-3 font-medium">CREATED</th>
                  <th className="px-4 py-3 font-medium">LAST USED</th>
                  <th className="px-4 py-3 font-medium">EXPIRES</th>
                  <th className="px-4 py-3 font-medium">LAST ROTATED</th>
                  <th className="px-4 py-3 font-medium">STATUS</th>
                  {canManage && <th className="px-4 py-3 font-medium text-right">ACTIONS</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {apiKeys.map((k) => {
                  const isRevoked = k.status === "REVOKED";
                  const isExpired = k.status === "EXPIRED";
                  const isArchived = k.status === "ARCHIVED";
                  const isActive = k.status === "ACTIVE";

                  // Safe key display
                  const safeKeyDisplay = k.publicKeyId || "Identifier unavailable";
                  const statusLabel = isActive
                    ? "ACTIVE"
                    : isRevoked
                      ? "REVOKED"
                      : isExpired
                        ? "EXPIRED"
                        : isArchived
                          ? "ARCHIVED"
                          : k.status || "UNKNOWN";

                  return (
                    <tr key={k._id} className="hover:bg-white/[0.02] transition-colors">
                      {/* Key Name + Safe Identifier */}
                      <td className="px-4 py-3.5">
                        <div>
                          <div className="font-semibold text-white text-xs">{k.name}</div>
                          <div className="text-[11px] text-gray-500 font-mono flex items-center gap-1.5 mt-0.5">
                            <span>{safeKeyDisplay}</span>
                          </div>
                        </div>
                      </td>

                      {/* Created */}
                      <td className="px-4 py-3.5 text-gray-400 font-mono text-[11px]">
                        {k.createdAt ? new Date(k.createdAt).toLocaleDateString() : "Active"}
                      </td>

                      {/* Last Used */}
                      <td className="px-4 py-3.5 text-gray-400 font-mono text-[11px]">
                        {k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleTimeString() : "Never"}
                      </td>

                      {/* Expiration */}
                      <td className="px-4 py-3.5 text-gray-400 font-mono text-[11px]">
                        {k.expiresAt ? new Date(k.expiresAt).toLocaleDateString() : "Never"}
                      </td>

                      {/* Last Rotated */}
                      <td className="px-4 py-3.5 text-gray-400 font-mono text-[11px]">
                        {k.lastRotatedAt || k.rotatedAt
                          ? new Date(k.lastRotatedAt || k.rotatedAt).toLocaleString()
                          : "Never"}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5 font-mono">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                            isActive
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                          }`}
                        >
                          {statusLabel}
                        </span>
                      </td>

                      {/* Actions */}
                      {canManage && (
                        <td className="px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {isActive && (
                              <>
                                <button
                                  onClick={() => handleRotateKey(k)}
                                  className="p-1.5 rounded-md hover:bg-amber-500/10 text-gray-400 hover:text-amber-400 transition-colors"
                                  title="Rotate Key"
                                >
                                  <RefreshCw className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleRevokeKey(k)}
                                  className="p-1.5 rounded-md hover:bg-rose-500/10 text-gray-400 hover:text-rose-400 transition-colors"
                                  title="Revoke Key"
                                >
                                  <Ban className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
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

      {/* ── GENERATE KEY MODAL ──────────────────────────────────────────────── */}
      <Modal
        isOpen={showGenerateModal}
        onClose={closeSecretModal}
        title={createdSecret ? `API Key ${secretAction === "rotated" ? "Rotated" : "Generated"}` : "Generate API Key"}
      >
        {createdSecret ? (
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-300 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
              <div>
                <span className="font-semibold block">Copy your API key now</span>
                <span className="text-[11px] text-amber-300/80 mt-0.5 block">
                  This secret will not be shown again once this dialog is closed. Save it immediately.
                </span>
              </div>
            </div>

            <div>
              <label className="label">Generated Secret Key</label>
              <div className="flex items-center justify-between p-2.5 bg-[#070b12] border border-white/10 rounded-lg font-mono text-xs text-emerald-400 break-all">
                <span>{createdSecret}</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(createdSecret);
                    setCopiedSecret(true);
                    setTimeout(() => setCopiedSecret(false), 2000);
                  }}
                  className="ml-2 p-1.5 rounded bg-white/10 hover:bg-white/20 text-white shrink-0"
                >
                  {copiedSecret ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={closeSecretModal}
                className="btn-primary text-xs"
              >
                I have saved my key
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleGenerateKey} className="space-y-4">
            {modalError && (
              <div className="p-3 bg-red-950/60 border border-red-800/60 rounded-md text-red-300 text-xs">
                {modalError}
              </div>
            )}

            <div>
              <label className="label">Key Name *</label>
              <input
                type="text"
                placeholder="e.g. Production Mobile App, CI/CD Deployment Key"
                value={keyName}
                onChange={(e) => setKeyName(e.target.value)}
                className="input"
                required
                autoFocus
              />
            </div>

            <div>
              <label className="label">Expiration</label>
              <select
                value={expirationPreset}
                onChange={(e) => setExpirationPreset(e.target.value)}
                className="input"
              >
                <option value="NEVER">Never expires</option>
                <option value="30_DAYS">30 days</option>
                <option value="90_DAYS">90 days</option>
                <option value="1_YEAR">1 year</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setShowGenerateModal(false)}
                className="btn-secondary text-xs"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary text-xs"
                disabled={submitting}
              >
                {submitting ? "Generating..." : "Generate Key"}
              </button>
            </div>
          </form>
        )}
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
