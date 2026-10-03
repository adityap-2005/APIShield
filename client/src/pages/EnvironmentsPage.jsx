/**
 * EnvironmentsPage.jsx
 *
 * Developer console for managing isolated deployment/testing environments.
 * Matches reference image media_1791022357702.jpg
 * Clicking an environment card navigates directly to the Integrations page with that environment filtered.
 */

import { useState, useEffect, useMemo } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useOrg } from "../context/OrgContext";
import apiKeysApi from "../api/apiKeys";
import integrationsApi from "../api/integrations";

import Modal from "../components/Modal";
import {
  Plus,
  Blocks,
  Server,
  KeyRound,
  MoreVertical,
  Layers,
} from "lucide-react";

const ENV_STAGE_META = {
  DEVELOPMENT: {
    dot: "bg-blue-400",
    desc: "Developer sandbox and local testing gateway routing.",
  },
  STAGING: {
    dot: "bg-amber-400",
    desc: "Pre-production integration testing environment with simulated downstream services.",
  },
  PRODUCTION: {
    dot: "bg-emerald-400",
    desc: "High-availability gateway orchestrating live traffic for critical production systems.",
  },
  TEST: {
    dot: "bg-purple-400",
    desc: "Automated regression testing and mock sandbox environment.",
  },
};

function formatTimeAgo(dateInput) {
  if (!dateInput) return "Active today";
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return "Active today";
  const now = new Date();
  const diffMs = now - date;
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays >= 30) {
    const months = Math.floor(diffDays / 30);
    return `Updated ${months} ${months === 1 ? "month" : "months"} ago`;
  }
  if (diffDays >= 7) {
    const weeks = Math.floor(diffDays / 7);
    return `Updated ${weeks} ${weeks === 1 ? "week" : "weeks"} ago`;
  }
  if (diffDays === 1) return "Updated 1 day ago";
  if (diffDays > 1) return `Updated ${diffDays} days ago`;
  if (diffHours === 1) return "Updated 1 hour ago";
  if (diffHours > 1) return `Updated ${diffHours} hours ago`;
  if (diffMins > 1) return `Updated ${diffMins} minutes ago`;
  return "Updated just now";
}

export default function EnvironmentsPage() {
  const {
    activeOrg,
    activeProject,
    environments,
    integrations,
    switchEnvironment,
    fetchHierarchyResources,
  } = useOrg();

  const params = useParams();
  const navigate = useNavigate();
  const orgId = params.organizationId || activeOrg?._id;

  const [apiKeys, setApiKeys] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEnvName, setNewEnvName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState("");

  // Load real API keys for counting
  useEffect(() => {
    const loadKeys = async () => {
      if (!orgId || !activeProject?._id) return;
      try {
        const res = await apiKeysApi.getAll(orgId, activeProject._id);
        setApiKeys(res.data?.data || []);
      } catch {
        setApiKeys([]);
      }
    };
    loadKeys();
  }, [orgId, activeProject]);

  const envList = useMemo(() => {
    if (environments && environments.length > 0) return environments;
    return [
      { _id: "development", name: "DEVELOPMENT", status: "ACTIVE" },
      { _id: "staging", name: "STAGING", status: "ACTIVE" },
      { _id: "production", name: "PRODUCTION", status: "ACTIVE" },
      { _id: "test", name: "TEST", status: "ACTIVE" },
    ];
  }, [environments]);

  const handleEnvironmentClick = (env) => {
    switchEnvironment(env);
    const envUpper = (env.name || "").toUpperCase();
    if (orgId) {
      navigate(`/org/${orgId}/integrations?env=${envUpper}`);
    } else {
      navigate(`/integrations?env=${envUpper}`);
    }
  };

  const handleCreateEnvironment = async (e) => {
    e.preventDefault();
    if (!newEnvName.trim()) {
      setModalError("Environment name is required.");
      return;
    }

    try {
      setSubmitting(true);
      setModalError("");

      if (orgId && activeProject?._id && integrations.length > 0) {
        // Create environment on the first integration
        await integrationsApi.createEnvironment(orgId, activeProject._id, integrations[0]._id, {
          name: newEnvName.trim().toUpperCase(),
        });
        await fetchHierarchyResources(orgId, activeProject._id);
      }
      setShowAddModal(false);
      setNewEnvName("");
    } catch (err) {
      setModalError(err.response?.data?.message || "Failed to create environment.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── HEADER (Matches Reference Image) ──────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Environments
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Manage your gateway environments for different stages of the development cycle.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setModalError("");
            setNewEnvName("");
            setShowAddModal(true);
          }}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#10b981] hover:bg-emerald-400 text-black font-semibold text-xs transition-colors shadow-sm shadow-emerald-500/20 self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4 text-black" />
          <span>Create Environment</span>
        </button>
      </div>

      {/* ── ENVIRONMENTS CARDS LIST (Matches Reference Image) ──────────────── */}
      <div className="space-y-4">
        {envList.map((env) => {
          const rawName = env.name || "PRODUCTION";
          const envUpper = rawName.toUpperCase();
          const meta = ENV_STAGE_META[envUpper] || {
            dot: "bg-blue-400",
            desc: "Isolated stage for custom environment traffic.",
          };
          const formattedTitle = rawName.charAt(0).toUpperCase() + rawName.slice(1).toLowerCase();

          // Real counts for this environment
          const matchedIntegrations = integrations.filter((integ) =>
            (integ.environments || []).some(
              (e) => (e.name || "").toUpperCase() === envUpper
            )
          );
          const integCount = matchedIntegrations.length;

          let upstreamCount = 0;
          let latestDate = null;
          integrations.forEach((integ) => {
            const matchedEnv = (integ.environments || []).find(
              (e) => (e.name || "").toUpperCase() === envUpper
            );
            if (matchedEnv) {
              upstreamCount += (matchedEnv.upstreamApis || []).length;
              if (integ.updatedAt) {
                const d = new Date(integ.updatedAt);
                if (!latestDate || d > latestDate) latestDate = d;
              }
            }
          });

          const envKeys = apiKeys.filter((k) => {
            const kEnvName = (k.environment?.name || k.environmentName || "").toUpperCase();
            const kEnvId = k.environment?._id || k.environmentId;
            return kEnvName === envUpper || (env._id && kEnvId === env._id);
          });
          const keyCount = envKeys.length;

          envKeys.forEach((k) => {
            if (k.updatedAt || k.createdAt) {
              const d = new Date(k.updatedAt || k.createdAt);
              if (!latestDate || d > latestDate) latestDate = d;
            }
          });

          const timeAgoDisplay = formatTimeAgo(latestDate);

          return (
            <div
              key={env._id || env.name}
              onClick={() => handleEnvironmentClick(env)}
              className="bg-[#0e131f] border border-white/10 hover:border-white/20 hover:bg-white/[0.015] rounded-xl p-5 shadow-sm transition-all cursor-pointer text-left w-full group"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleEnvironmentClick(env);
                }
              }}
            >
              {/* Top Row: Dot + Title & Status Badge + Overflow Icon */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className={`w-2 h-2 rounded-full ${meta.dot} shrink-0`} />
                  <h2 className="text-sm font-bold text-white tracking-tight group-hover:text-emerald-400 transition-colors">
                    {formattedTitle}
                  </h2>
                </div>

                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    ACTIVE
                  </span>
                  <div className="p-1 text-gray-500 group-hover:text-gray-400 transition-colors">
                    <MoreVertical className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>

              {/* Middle Row: Description */}
              <p className="text-xs text-gray-400 mt-2.5 leading-relaxed max-w-2xl">
                {meta.desc}
              </p>

              {/* Bottom Row: Stats & Timestamp */}
              <div className="mt-5 pt-4 border-t border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-5 text-gray-300 font-mono flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <Blocks className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    <span>
                      {integCount} {integCount === 1 ? "Integration" : "Integrations"}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Server className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span>
                      {upstreamCount} Upstream {upstreamCount === 1 ? "API" : "APIs"}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>
                      {keyCount} API {keyCount === 1 ? "Key" : "Keys"}
                    </span>
                  </div>
                </div>

                <div className="text-gray-500 font-mono text-[11px] self-start sm:self-auto">
                  {timeAgoDisplay}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── CREATE ENVIRONMENT MODAL ───────────────────────────────────────── */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Create Environment"
      >
        <form onSubmit={handleCreateEnvironment} className="space-y-4">
          {modalError && (
            <div className="p-3 bg-red-950/60 border border-red-800/60 rounded-md text-red-300 text-xs">
              {modalError}
            </div>
          )}

          <div>
            <label className="label">Environment Name *</label>
            <input
              type="text"
              value={newEnvName}
              onChange={(e) => setNewEnvName(e.target.value)}
              placeholder="e.g. CANARY or QA"
              className="input font-mono uppercase"
              required
              autoFocus
            />
            <span className="text-[10px] text-gray-500 font-mono mt-1 block">
              Stage will be configured across project integrations.
            </span>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
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
              {submitting ? "Creating..." : "Create Environment"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

