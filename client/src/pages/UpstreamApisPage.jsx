/**
 * UpstreamApisPage.jsx
 *
 * Developer console for managing Upstream APIs and proxy targets.
 * Matches reference image media_1790937951688.jpg
 */

import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useOrg } from "../context/OrgContext";
import integrationsApi from "../api/integrations";
import upstreamApisApi from "../api/upstreamApis";

import Modal from "../components/Modal";
import EmptyState from "../components/EmptyState";
import {
  Server,
  Play,
  Search,
  Plus,
  Lock,
  Check,
  Globe,
  Settings,
  X,
  Layers,
  ChevronDown
} from "lucide-react";

export default function UpstreamApisPage() {
  const {
    activeOrg,
    activeProject,
    integrations,
    activeIntegration,
    activeEnvironment,
    switchUpstreamApi,
    switchIntegration,
    fetchHierarchyResources,
  } = useOrg();

  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  // Add Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedIntegrationId, setSelectedIntegrationId] = useState("");
  const [selectedEnvName, setSelectedEnvName] = useState("PRODUCTION");
  const [apiName, setApiName] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [path, setPath] = useState("");
  const [authType, setAuthType] = useState("NONE");
  const [authKeyName, setAuthKeyName] = useState("");
  const [credential, setCredential] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState("");

  // Extract real upstream APIs strictly scoped to activeIntegration and activeEnvironment if selected
  const allUpstreamApis = useMemo(() => {
    const list = [];
    const targetIntegrations = activeIntegration
      ? integrations.filter((i) => String(i._id) === String(activeIntegration._id))
      : integrations;

    targetIntegrations.forEach((integ) => {
      const targetEnvironments = activeEnvironment
        ? (integ.environments || []).filter(
            (e) => (e.name || "").toUpperCase() === (activeEnvironment.name || "").toUpperCase()
          )
        : integ.environments || [];

      const envsToProcess = targetEnvironments.length > 0 ? targetEnvironments : (integ.environments || []);

      envsToProcess.forEach((env) => {
        (env.upstreamApis || []).forEach((api) => {
          list.push({
            ...api,
            integrationId: integ._id,
            integrationName: integ.name,
            environmentName: env.name || "Production",
            environmentId: env._id,
          });
        });
      });
    });

    if (!searchQuery.trim()) return list;

    const q = searchQuery.toLowerCase();
    return list.filter(
      (api) =>
        api.name?.toLowerCase().includes(q) ||
        api.baseUrl?.toLowerCase().includes(q) ||
        api.integrationName?.toLowerCase().includes(q) ||
        api.path?.toLowerCase().includes(q)
    );
  }, [integrations, activeIntegration, activeEnvironment, searchQuery]);

  const handleOpenAddModal = () => {
    setSelectedIntegrationId(activeIntegration?._id || (integrations.length > 0 ? integrations[0]._id : ""));
    setSelectedEnvName((activeEnvironment?.name || "PRODUCTION").toUpperCase());
    setApiName("");
    setBaseUrl("");
    setPath("");
    setAuthType("NONE");
    setAuthKeyName("");
    setCredential("");
    setModalError("");
    setShowAddModal(true);
  };

  const handleCreateUpstreamApi = async (e) => {
    e.preventDefault();
    if (!apiName.trim() || !baseUrl.trim()) {
      setModalError("API name and Base URL are required.");
      return;
    }

    if (!activeOrg?._id || !activeProject?._id) {
      setModalError("Please select an organization and project first.");
      return;
    }

    try {
      setSubmitting(true);
      setModalError("");

      // If no integration exists, create one or use existing
      let targetIntegId = selectedIntegrationId;
      if (!targetIntegId && integrations.length > 0) {
        targetIntegId = integrations[0]._id;
      }

      if (!targetIntegId) {
        // Create an integration first
        const integRes = await integrationsApi.create(activeOrg._id, activeProject._id, {
          name: `${apiName.trim()} Integration`,
          environment: selectedEnvName,
          upstreamApiName: apiName.trim(),
          baseUrl: baseUrl.trim(),
          path: path.trim() || undefined,
          upstreamCredential: credential.trim() ? {
            type: authType,
            headerName: authKeyName.trim() || undefined,
            apiKey: credential.trim(),
          } : undefined,
        });
      } else {
        // Find environment in integration
        const integ = integrations.find((i) => i._id === targetIntegId);
        const env = (integ?.environments || []).find(
          (e) => (e.name || "").toUpperCase() === selectedEnvName.toUpperCase()
        );

        if (env?._id) {
          await upstreamApisApi.create(
            activeOrg._id,
            activeProject._id,
            targetIntegId,
            env._id,
            {
              name: apiName.trim(),
              baseUrl: baseUrl.trim(),
              path: path.trim() || undefined,
              authentication: {
                type: authType,
                headerName: authKeyName.trim() || undefined,
              },
            }
          );
        } else {
          // Add environment to integration
          const envRes = await integrationsApi.createEnvironment(
            activeOrg._id,
            activeProject._id,
            targetIntegId,
            { name: selectedEnvName }
          );
          const newEnv = envRes.data?.data;
          if (newEnv?._id) {
            await upstreamApisApi.create(
              activeOrg._id,
              activeProject._id,
              targetIntegId,
              newEnv._id,
              {
                name: apiName.trim(),
                baseUrl: baseUrl.trim(),
                path: path.trim() || undefined,
                authentication: {
                  type: authType,
                  headerName: authKeyName.trim() || undefined,
                },
              }
            );
          }
        }
      }

      await fetchHierarchyResources(activeOrg._id, activeProject._id);
      setShowAddModal(false);
    } catch (err) {
      setModalError(err.response?.data?.message || "Failed to create upstream API.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleTestApi = (api) => {
    const integ = integrations.find((i) => i._id === api.integrationId);
    if (integ) switchIntegration(integ);
    switchUpstreamApi(api);
    navigate("/test-api");
  };

  return (
    <div className="space-y-6">
      {/* ── HEADER (Matches media_1790937951688.jpg) ───────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Upstream APIs
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Routing proxies directing incoming developer payload calls to specific services.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#10b981] hover:bg-emerald-400 text-black font-semibold text-xs transition-colors shadow-sm shadow-emerald-500/20 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Upstream API</span>
        </button>
      </div>

      {/* ── SEARCH BAR ──────────────────────────────────────────────────────── */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search upstream endpoints..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-[#0e131f] border border-white/10 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
        />
      </div>

      {/* ── TABLE / EMPTY STATE ────────────────────────────────────────────── */}
      {allUpstreamApis.length === 0 ? (
        <div className="bg-[#0e131f] border border-white/10 rounded-xl p-12 text-center">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-4">
            <Server className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-white mb-1">No upstream APIs yet</h3>
          <p className="text-xs text-gray-400 max-w-md mx-auto mb-6">
            Connect an upstream service to begin routing API traffic through APIShield.
          </p>
          <button
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#10b981] hover:bg-emerald-400 text-black font-semibold text-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Upstream API</span>
          </button>
        </div>
      ) : (
        <div className="bg-[#0e131f] border border-white/10 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.02] text-[11px] font-mono text-gray-400 uppercase tracking-wider">
                  <th className="px-4 py-3 font-medium">NAME</th>
                  <th className="px-4 py-3 font-medium">BASE URL</th>
                  <th className="px-4 py-3 font-medium">STATUS</th>
                  <th className="px-4 py-3 font-medium">LAST CALLED</th>
                  <th className="px-4 py-3 font-medium text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {allUpstreamApis.map((api) => {
                  const isActive = api.status !== "DISABLED";
                  return (
                    <tr key={api._id} className="hover:bg-white/[0.02] transition-colors">
                      {/* Name + via Provider */}
                      <td className="px-4 py-3.5">
                        <div>
                          <div className="font-semibold text-white text-xs">{api.name}</div>
                          <div className="text-[11px] text-gray-400 font-mono">
                            via {api.integrationName || "Direct"}
                          </div>
                        </div>
                      </td>

                      {/* Base URL */}
                      <td className="px-4 py-3.5 font-mono text-gray-300 text-xs">
                        {api.baseUrl}
                        {api.path && <span className="text-gray-500">{api.path}</span>}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5 font-mono">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                            isActive
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : "bg-gray-500/10 text-gray-400 border border-gray-500/20"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isActive ? "bg-emerald-400" : "bg-gray-400"
                            }`}
                          />
                          {isActive ? "ACTIVE" : "DISABLED"}
                        </span>
                      </td>

                      {/* Last Called */}
                      <td className="px-4 py-3.5 text-gray-400 font-mono text-[11px]">
                        {api.lastUsed ? new Date(api.lastUsed).toLocaleTimeString() : "Never"}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleTestApi(api)}
                            className="p-1.5 rounded-md hover:bg-emerald-500/10 text-emerald-400 hover:text-emerald-300 border border-white/5 hover:border-emerald-500/30 transition-colors"
                            title="Test API Console"
                          >
                            <Play className="w-3.5 h-3.5" />
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

      {/* ── ADD UPSTREAM API MODAL ──────────────────────────────────────────── */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add Upstream API"
      >
        <form onSubmit={handleCreateUpstreamApi} className="space-y-4">
          {modalError && (
            <div className="p-3 bg-red-950/60 border border-red-800/60 rounded-md text-red-300 text-xs">
              {modalError}
            </div>
          )}

          {integrations.length > 0 && (
            <div>
              <label className="label">Integration Provider</label>
              <select
                value={selectedIntegrationId}
                onChange={(e) => setSelectedIntegrationId(e.target.value)}
                className="input"
              >
                {integrations.map((i) => (
                  <option key={i._id} value={i._id}>
                    {i.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="label">Environment *</label>
            <select
              value={selectedEnvName}
              onChange={(e) => setSelectedEnvName(e.target.value)}
              className="input"
            >
              <option value="PRODUCTION">Production</option>
              <option value="STAGING">Staging</option>
              <option value="DEVELOPMENT">Development</option>
              <option value="TEST">Test</option>
            </select>
          </div>

          <div>
            <label className="label">API Name *</label>
            <input
              type="text"
              placeholder="e.g. GitHub Users API, Stripe Charges"
              value={apiName}
              onChange={(e) => setApiName(e.target.value)}
              className="input"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="label">Base URL *</label>
              <input
                type="url"
                placeholder="https://api.github.com"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                className="input font-mono text-xs"
                required
              />
            </div>
            <div>
              <label className="label">Path Prefix</label>
              <input
                type="text"
                placeholder="/users"
                value={path}
                onChange={(e) => setPath(e.target.value)}
                className="input font-mono text-xs"
              />
            </div>
          </div>

          <div>
            <label className="label">Authentication Type</label>
            <select
              value={authType}
              onChange={(e) => setAuthType(e.target.value)}
              className="input"
            >
              <option value="NONE">None (Public)</option>
              <option value="API_KEY_HEADER">API Key Header</option>
              <option value="BEARER">Bearer Token</option>
            </select>
          </div>

          {authType !== "NONE" && (
            <div>
              <label className="label">Upstream Secret Token</label>
              <input
                type="password"
                placeholder="Secret token"
                value={credential}
                onChange={(e) => setCredential(e.target.value)}
                className="input font-mono text-xs"
              />
            </div>
          )}

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
              {submitting ? "Adding..." : "Add Upstream API"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
