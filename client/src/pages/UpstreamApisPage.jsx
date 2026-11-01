/**
 * UpstreamApisPage.jsx
 *
 * Developer console for managing Upstream APIs and proxy targets.
 * Real backend data only. Hierarchy: Organization -> Project -> Integration -> Upstream API
 */

import { useState, useMemo, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useOrg } from "../context/OrgContext";
import integrationsApi from "../api/integrations";
import upstreamApisApi from "../api/upstreamApis";
import axiosInstance from "../api/axiosInstance";

import Modal from "../components/Modal";
import ConfirmModal from "../components/ConfirmModal";
import { canManageUpstreamApis } from "../utils/permissions";
import {
  Server,
  Play,
  Search,
  Plus,
  MoreVertical,
  Copy,
  Check,
  Shield,
  FileCode,
  Info,
  ExternalLink,
  Code2,
} from "lucide-react";

const gatewayBaseUrl = (import.meta.env.VITE_API_BASE_URL || "/api/v1").replace(/\/$/, "");

const getGatewayEndpoint = (organizationId, projectId, upstreamApiId) =>
  `${gatewayBaseUrl}/organizations/${organizationId}/projects/${projectId}/gateway/upstream/${upstreamApiId}`;

function CopyableCodeBlock({ label, value, item, copiedItem, onCopy, language = "bash" }) {
  const copied = copiedItem === item;

  return (
    <div className="border border-white/10 rounded-xl overflow-hidden bg-[#0a0d14] shadow-sm">
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-[#131824] border-b border-white/10">
        <span className="text-[11px] text-gray-300 font-mono font-semibold flex items-center gap-1.5">
          <FileCode className="w-3.5 h-3.5 text-emerald-400" />
          {label}
        </span>
        <button
          onClick={() => onCopy(item, value)}
          className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/5 hover:bg-white/10 text-xs font-mono text-gray-300 hover:text-white transition-colors"
          aria-label={`Copy ${label}`}
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-semibold">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-3.5 overflow-x-auto text-xs leading-relaxed text-gray-200 font-mono whitespace-pre selection:bg-emerald-500/30">
        {value}
      </pre>
    </div>
  );
}

function UpstreamApiDocs({ api, organizationId, projectId, copiedItem, copyError, onCopy }) {
  const endpoint = getGatewayEndpoint(organizationId, projectId, api._id);
  const curlExample = `curl -X GET "${endpoint}" \\\n  -H "x-api-key: YOUR_APISHIELD_API_KEY"`;
  const javascriptExample = `const endpoint = "${endpoint}";

const response = await fetch(endpoint, {
  method: "GET",
  headers: {
    "x-api-key": "YOUR_APISHIELD_API_KEY",
  },
});

const payload = await response.json();
if (!response.ok) {
  throw new Error(payload.message || "APIShield gateway request failed");
}

console.log(payload.data);`;

  return (
    <div className="space-y-6 text-xs">
      {copyError && (
        <div className="p-3 bg-red-950/60 border border-red-800/60 rounded-xl text-red-300">
          {copyError}
        </div>
      )}

      {/* 1. API Overview & Target Header */}
      <div className="p-4 bg-[#0e131f] border border-white/10 rounded-xl space-y-2">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-emerald-400 shrink-0" />
            <h3 className="text-sm font-bold text-white tracking-tight">{api.name}</h3>
          </div>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            {api.status || "ACTIVE"}
          </span>
        </div>
        {api.description && <p className="text-gray-400 leading-relaxed">{api.description}</p>}
        <p className="text-gray-400 leading-relaxed text-[11px]">
          Requests to this gateway endpoint are verified for rate-limiting, usage metering, and security before being forwarded to your upstream target.
        </p>
      </div>

      {/* 2. Gateway Endpoint Box */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-gray-400 font-mono font-semibold uppercase tracking-wider">
            Gateway Endpoint URL
          </span>
          <button
            onClick={() => onCopy("endpoint", endpoint)}
            className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors"
            aria-label="Copy gateway endpoint"
          >
            {copiedItem === "endpoint" ? (
              <span className="text-emerald-400 font-medium inline-flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Copied
              </span>
            ) : (
              <span className="inline-flex items-center gap-1">
                <Copy className="w-3.5 h-3.5" /> Copy URL
              </span>
            )}
          </button>
        </div>
        <div className="px-3.5 py-2.5 bg-[#0a0d14] border border-white/10 rounded-xl text-emerald-300 font-mono text-xs break-all selection:bg-emerald-500/30">
          {endpoint}
        </div>
      </div>

      {/* 3. Authentication & Security */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div className="p-3.5 bg-[#0e131f] border border-white/10 rounded-xl space-y-2">
          <div className="text-[10px] text-gray-400 uppercase font-mono font-semibold flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span>Upstream Authentication</span>
          </div>
          <p className="text-gray-300 leading-relaxed text-[11px]">
            {api.authentication?.type === "NONE"
              ? "No upstream secret credential configured (Public upstream API)."
              : "Configured upstream credentials (API keys / bearer tokens) are stored encrypted and injected server-side by APIShield Gateway."}
          </p>
          <p className="text-gray-500 leading-normal text-[10px]">
            The client application never sees or handles upstream target credentials.
          </p>
        </div>

        <div className="p-3.5 bg-[#0e131f] border border-white/10 rounded-xl space-y-2">
          <div className="text-[10px] text-gray-400 uppercase font-mono font-semibold flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-sky-400" />
            <span>Request Contract</span>
          </div>
          <dl className="space-y-1.5 text-gray-300 text-[11px]">
            <div>
              <dt className="text-gray-500 inline font-mono">Method: </dt>
              <dd className="inline font-medium">Any HTTP method (forwarded transparently)</dd>
            </div>
            <div>
              <dt className="text-gray-500 inline font-mono">Header: </dt>
              <dd className="inline font-mono text-emerald-300">x-api-key: &lt;your_key&gt;</dd>
            </div>
            <div>
              <dt className="text-gray-500 inline font-mono">Query: </dt>
              <dd className="inline font-medium">Forwarded directly to upstream target</dd>
            </div>
            <div>
              <dt className="text-gray-500 inline font-mono">Body: </dt>
              <dd className="inline font-medium">Forwarded for POST/PUT/PATCH requests</dd>
            </div>
          </dl>
        </div>
      </div>

      {/* 4. Code Examples */}
      <div className="space-y-4">
        <CopyableCodeBlock
          label="cURL Command"
          value={curlExample}
          item="curl"
          copiedItem={copiedItem}
          onCopy={onCopy}
        />
        <CopyableCodeBlock
          label="JavaScript (Fetch API)"
          value={javascriptExample}
          item="javascript"
          copiedItem={copiedItem}
          onCopy={onCopy}
          language="javascript"
        />
      </div>

      {/* 5. Response Documentation */}
      <div className="space-y-2.5">
        <div className="text-[10px] text-gray-400 uppercase font-mono font-semibold">
          Gateway Responses
        </div>
        <div className="space-y-2 font-mono text-[11px]">
          <div className="p-3 bg-emerald-950/20 border border-emerald-500/20 rounded-xl text-gray-300">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-emerald-400 font-bold">200 OK — Successful Proxy</span>
            </div>
            <pre className="text-gray-300 whitespace-pre-wrap">{`{
  "success": true,
  "data": { ... } // Original upstream response payload
}`}</pre>
          </div>

          <div className="p-3 bg-rose-950/20 border border-rose-500/20 rounded-xl text-gray-300">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-rose-400" />
              <span className="text-rose-400 font-bold">Gateway Error Codes</span>
            </div>
            <p className="text-gray-400 leading-relaxed font-sans text-xs">
              <span className="font-mono text-white">401</span>: Invalid or missing x-api-key •{" "}
              <span className="font-mono text-white">403</span>: Org/project permission mismatch •{" "}
              <span className="font-mono text-white">404</span>: Upstream API not found or disabled •{" "}
              <span className="font-mono text-white">502</span>: Bad gateway / upstream target unreachable •{" "}
              <span className="font-mono text-white">504</span>: Upstream timeout
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function UpstreamApisPage() {
  const {
    activeOrg,
    activeProject,
    integrations,
    activeIntegration,
    switchUpstreamApi,
    switchIntegration,
    fetchHierarchyResources,
  } = useOrg();

  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  // Add Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedIntegrationId, setSelectedIntegrationId] = useState("");
  const [apiName, setApiName] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [path, setPath] = useState("");
  const [authType, setAuthType] = useState("NONE");
  const [authKeyName, setAuthKeyName] = useState("");
  const [credential, setCredential] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState("");

  // Three-dot action menu state with positioning
  const [menuState, setMenuState] = useState(null); // { id, api, rect, openUpwards }
  const menuRef = useRef(null);

  // Close three-dot menu on outside click, Escape, or scroll
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuState(null);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setMenuState(null);
    };

    if (menuState) {
      document.addEventListener("mousedown", handleOutsideClick);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuState]);

  // Details & Docs Modal
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [detailsApi, setDetailsApi] = useState(null);
  const [detailsTab, setDetailsTab] = useState("details"); // "details" | "docs"
  const [copiedItem, setCopiedItem] = useState("");
  const [copyError, setCopyError] = useState("");

  // Edit Modal State
  const [editingApi, setEditingApi] = useState(null);
  const [editName, setEditName] = useState("");
  const [editBaseUrl, setEditBaseUrl] = useState("");
  const [editPath, setEditPath] = useState("");
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState("");

  const [actionMessage, setActionMessage] = useState("");
  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    title: "",
    description: "",
    confirmText: "Confirm",
    action: null,
    loading: false,
  });

  // Extract real upstream APIs scoped to activeIntegration if selected
  const allUpstreamApis = useMemo(() => {
    const list = [];
    const targetIntegrations = activeIntegration
      ? integrations.filter((i) => String(i._id) === String(activeIntegration._id))
      : integrations;

    targetIntegrations.forEach((integ) => {
      (integ.upstreamApis || []).forEach((api) => {
        list.push({
          ...api,
          integrationId: integ._id,
          integrationName: integ.name,
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
  }, [integrations, activeIntegration, searchQuery]);

  const handleOpenAddModal = () => {
    setSelectedIntegrationId(activeIntegration?._id || (integrations.length > 0 ? integrations[0]._id : ""));
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

    if ((authType === "API_KEY_HEADER" || authType === "API_KEY_QUERY") && !authKeyName.trim()) {
      setModalError("Authentication key name is required for API Key authentication.");
      return;
    }

    // Default path to "/" if omitted
    const cleanPath = path.trim()
      ? (path.trim().startsWith("/") ? path.trim() : `/${path.trim()}`)
      : "/";

    try {
      setSubmitting(true);
      setModalError("");

      let targetIntegId = selectedIntegrationId;
      if (!targetIntegId && integrations.length > 0) {
        targetIntegId = integrations[0]._id;
      }

      if (!targetIntegId) {
        // Create an integration first if none exists
        await integrationsApi.create(activeOrg._id, activeProject._id, {
          name: `${apiName.trim()} Integration`,
          upstreamApiName: apiName.trim(),
          baseUrl: baseUrl.trim(),
          path: cleanPath,
          upstreamCredential: credential.trim() || undefined,
          authentication: {
            type: authType,
            keyName: authKeyName.trim() || (authType === "API_KEY_HEADER" ? "x-api-key" : undefined),
          },
        });
      } else {
        await upstreamApisApi.create(
          activeOrg._id,
          activeProject._id,
          targetIntegId,
          {
            name: apiName.trim(),
            baseUrl: baseUrl.trim(),
            path: cleanPath,
            upstreamCredential: credential.trim() || undefined,
            authentication: {
              type: authType,
              keyName: authKeyName.trim() || (authType === "API_KEY_HEADER" ? "x-api-key" : undefined),
            },
          }
        );
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

  const refreshApis = async () => {
    await fetchHierarchyResources(activeOrg._id, activeProject._id);
  };

  const handleToggleMenu = (e, api) => {
    e.stopPropagation();
    if (menuState?.id === api._id) {
      setMenuState(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUpwards = spaceBelow < 220;
    setMenuState({
      id: api._id,
      api,
      rect,
      openUpwards,
    });
  };

  const handleViewDetails = async (api) => {
    setMenuState(null);
    try {
      const response = await upstreamApisApi.getById(
        activeOrg._id,
        activeProject._id,
        api.integrationId,
        api._id
      );
      setDetailsApi({ ...api, ...(response.data?.data || {}) });
      setDetailsTab("details");
      setCopiedItem("");
      setCopyError("");
      setShowDetailsModal(true);
    } catch {
      setActionMessage("Failed to load upstream API details.");
    }
  };

  const handleOpenDocs = async (api) => {
    setMenuState(null);
    try {
      const response = await upstreamApisApi.getById(
        activeOrg._id,
        activeProject._id,
        api.integrationId,
        api._id
      );
      setDetailsApi({ ...api, ...(response.data?.data || {}) });
      setDetailsTab("docs");
      setCopiedItem("");
      setCopyError("");
      setShowDetailsModal(true);
    } catch {
      setActionMessage("Failed to load upstream API documentation.");
    }
  };

  const handleCopy = async (item, value) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedItem(item);
      setCopyError("");
      window.setTimeout(() => setCopiedItem(""), 2000);
    } catch {
      setCopyError("Could not copy to the clipboard.");
    }
  };

  const handleOpenEdit = (api) => {
    setMenuState(null);
    setEditingApi(api);
    setEditName(api.name || "");
    setEditBaseUrl(api.baseUrl || "");
    setEditPath(api.path || "/");
    setEditError("");
  };

  const handleUpdateApi = async (e) => {
    e.preventDefault();
    if (!editName.trim() || !editBaseUrl.trim()) {
      setEditError("API name and Base URL are required.");
      return;
    }

    const cleanEditPath = editPath.trim()
      ? (editPath.trim().startsWith("/") ? editPath.trim() : `/${editPath.trim()}`)
      : "/";

    try {
      setEditSubmitting(true);
      setEditError("");
      await upstreamApisApi.update(
        activeOrg._id,
        activeProject._id,
        editingApi.integrationId,
        editingApi._id,
        {
          name: editName.trim(),
          baseUrl: editBaseUrl.trim(),
          path: cleanEditPath,
        }
      );
      await refreshApis();
      setEditingApi(null);
      setActionMessage("Upstream API updated successfully.");
    } catch (err) {
      setEditError(err.response?.data?.message || "Failed to update upstream API.");
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleToggleApiStatus = (api) => {
    const isActive = api.status !== "DISABLED";
    setMenuState(null);
    setConfirmState({
      isOpen: true,
      title: isActive ? "Disable Upstream API" : "Enable Upstream API",
      description: isActive
        ? `Are you sure you want to disable ${api.name}? Gateway traffic through this upstream API will be blocked.`
        : `Enable ${api.name} to resume gateway traffic routing.`,
      confirmText: isActive ? "Disable" : "Enable",
      action: async () => {
        try {
          setConfirmState((prev) => ({ ...prev, loading: true }));
          await upstreamApisApi.update(
            activeOrg._id,
            activeProject._id,
            api.integrationId,
            api._id,
            { status: isActive ? "DISABLED" : "ACTIVE" }
          );
          await refreshApis();
          setConfirmState((prev) => ({ ...prev, isOpen: false, loading: false }));
          setActionMessage(`Upstream API ${isActive ? "disabled" : "enabled"} successfully.`);
        } catch (err) {
          setConfirmState((prev) => ({ ...prev, loading: false }));
          setActionMessage(err.response?.data?.message || "Failed to update upstream API status.");
        }
      },
      loading: false,
    });
  };

  const handleDeleteApi = (api) => {
    setMenuState(null);
    setConfirmState({
      isOpen: true,
      title: "Delete Upstream API",
      description: `Are you sure you want to delete ${api.name}? This action cannot be undone.`,
      confirmText: "Delete",
      action: async () => {
        try {
          setConfirmState((prev) => ({ ...prev, loading: true }));
          await axiosInstance.delete(
            `/organizations/${activeOrg._id}/projects/${activeProject._id}/integrations/${api.integrationId}/upstream-apis/${api._id}`
          );
          await refreshApis();
          setConfirmState((prev) => ({ ...prev, isOpen: false, loading: false }));
          setActionMessage("Upstream API deleted successfully.");
        } catch (err) {
          setConfirmState((prev) => ({ ...prev, loading: false }));
          setActionMessage(err.response?.data?.message || "Failed to delete upstream API.");
        }
      },
      loading: false,
    });
  };

  const canManage = canManageUpstreamApis(activeOrg, activeProject);

  return (
    <div className="space-y-6">
      {/* ── HEADER ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Upstream APIs
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Manage your backend API destinations, proxy paths, and upstream authorization.
          </p>
        </div>

        {canManage && (
          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            <button
              onClick={handleOpenAddModal}
              className="bg-[#10b981] hover:bg-[#059669] text-[#052e16] font-semibold text-xs px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg shadow-emerald-950/40 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Upstream API</span>
            </button>
          </div>
        )}
      </div>

      {actionMessage && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl flex items-center justify-between">
          <span>{actionMessage}</span>
          <button
            onClick={() => setActionMessage("")}
            className="text-emerald-400 hover:text-emerald-200 ml-3 text-xs"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ── SEARCH BAR ──────────────────────────────────────────────────────── */}
      <div className="bg-[#0e131f] border border-white/10 rounded-xl p-3 shadow-md max-w-md">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search APIs by name, URL, or provider..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#070b12] border border-white/10 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 font-mono"
          />
        </div>
      </div>

      {/* ── APIS TABLE & MOBILE CARDS ───────────────────────────────────────── */}
      {allUpstreamApis.length === 0 ? (
        <div className="bg-[#0e131f] border border-white/10 rounded-xl p-12 text-center">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-4">
            <Server className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-white mb-1">No Upstream APIs Found</h3>
          <p className="text-xs text-gray-400 max-w-md mx-auto mb-6">
            Configure an upstream target API to route gateway requests, enforce rate limits, and inject credentials.
          </p>
          {canManage && (
            <button
              onClick={handleOpenAddModal}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#10b981] hover:bg-emerald-400 text-black font-semibold text-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Upstream API</span>
            </button>
          )}
        </div>
      ) : (
        <div className="bg-[#0e131f] border border-white/10 rounded-xl overflow-hidden shadow-sm">
          {/* Mobile Card List View (< 640px) */}
          <div className="sm:hidden divide-y divide-white/5">
            {allUpstreamApis.map((api) => {
              const isActive = api.status !== "DISABLED";
              return (
                <div key={api._id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-emerald-400 shrink-0">
                        <Server className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-semibold text-white text-xs truncate">{api.name}</h4>
                        <p className="text-[10px] text-gray-500 font-mono truncate">{api.integrationName}</p>
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
                      {isActive ? "ACTIVE" : "DISABLED"}
                    </span>
                  </div>

                  <div className="font-mono text-xs text-gray-300 break-all bg-[#090d16] p-2.5 rounded-lg border border-white/5">
                    <div className="text-gray-400 text-[11px] truncate">{api.baseUrl}</div>
                    <div className="text-emerald-400 text-[11px] mt-0.5 truncate">{api.path || "/"}</div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <button
                      onClick={() => handleOpenDocs(api)}
                      className="text-xs text-gray-400 hover:text-white font-medium inline-flex items-center gap-1"
                    >
                      <Code2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>API Docs</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleTestApi(api)}
                        className="px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 text-xs font-semibold inline-flex items-center gap-1"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>Test</span>
                      </button>

                      <button
                        onClick={(e) => handleToggleMenu(e, api)}
                        className="p-1.5 rounded-md hover:bg-white/10 text-gray-400 hover:text-white border border-white/10 transition-colors"
                        aria-label={`More actions for ${api.name}`}
                      >
                        <MoreVertical className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table View (>= 640px) */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[680px]">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.02] text-[11px] font-mono text-gray-400 uppercase tracking-wider">
                  <th className="px-4 py-3 font-medium">Name & Integration</th>
                  <th className="px-4 py-3 font-medium">Target Base URL & Path</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Last Called</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {allUpstreamApis.map((api) => {
                  const isActive = api.status !== "DISABLED";

                  return (
                    <tr key={api._id} className="hover:bg-white/[0.02] transition-colors">
                      {/* Name & Integration */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-emerald-400 shrink-0">
                            <Server className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-white text-xs truncate max-w-[180px]">{api.name}</div>
                            <div className="text-[11px] text-gray-500 font-mono truncate max-w-[180px]">
                              {api.integrationName}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Target Base URL & Path */}
                      <td className="px-4 py-3.5 font-mono text-xs">
                        <div className="text-gray-300 truncate max-w-[240px]" title={api.baseUrl}>
                          {api.baseUrl}
                        </div>
                        <div className="text-[11px] text-emerald-400 truncate max-w-[240px]" title={api.path || "/"}>
                          {api.path || "/"}
                        </div>
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
                          <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-emerald-400" : "bg-gray-400"}`} />
                          {isActive ? "ACTIVE" : "DISABLED"}
                        </span>
                      </td>

                      {/* Last Called */}
                      <td className="px-4 py-3.5 text-gray-400 font-mono text-[11px]">
                        {api.lastUsed
                          ? new Date(api.lastUsed).toLocaleTimeString()
                          : "Never"}
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
                          <div className="relative inline-block">
                            <button
                              onClick={(e) => handleToggleMenu(e, api)}
                              className="p-1.5 rounded-md hover:bg-white/10 text-gray-400 hover:text-white border border-white/5 transition-colors"
                              title="More actions"
                              aria-label={`More actions for ${api.name}`}
                            >
                              <MoreVertical className="w-3.5 h-3.5" />
                            </button>
                          </div>
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

      {/* ── FIXED THREE-DOT DROPDOWN MENU (escapes table overflow & clipping) ─ */}
      {menuState && (
        <div
          ref={menuRef}
          style={{
            position: "fixed",
            top: menuState.openUpwards ? undefined : `${menuState.rect.bottom + 4}px`,
            bottom: menuState.openUpwards ? `${window.innerHeight - menuState.rect.top + 4}px` : undefined,
            left: `${Math.max(12, Math.min(window.innerWidth - 180, menuState.rect.right - 168))}px`,
            width: "168px",
          }}
          className="bg-[#161b22] border border-white/10 rounded-xl shadow-2xl shadow-black/80 z-50 py-1.5 text-left animate-in fade-in zoom-in-95 duration-100"
        >
          <button
            onClick={() => handleViewDetails(menuState.api)}
            className="w-full px-3.5 py-2 text-xs text-gray-300 hover:bg-white/5 hover:text-white flex items-center gap-2 transition-colors"
          >
            <span>View Details</span>
          </button>
          <button
            onClick={() => handleOpenDocs(menuState.api)}
            className="w-full px-3.5 py-2 text-xs text-gray-300 hover:bg-white/5 hover:text-white flex items-center gap-2 transition-colors"
          >
            <span>API Docs</span>
          </button>
          {canManage && (
            <>
              <button
                onClick={() => handleOpenEdit(menuState.api)}
                className="w-full px-3.5 py-2 text-xs text-gray-300 hover:bg-white/5 hover:text-white flex items-center gap-2 transition-colors"
              >
                <span>Edit</span>
              </button>
              <button
                onClick={() => handleToggleApiStatus(menuState.api)}
                className="w-full px-3.5 py-2 text-xs text-gray-300 hover:bg-white/5 hover:text-white flex items-center gap-2 transition-colors"
              >
                <span>{menuState.api.status !== "DISABLED" ? "Disable" : "Enable"}</span>
              </button>
              <button
                onClick={() => handleDeleteApi(menuState.api)}
                className="w-full px-3.5 py-2 text-xs text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 flex items-center gap-2 transition-colors"
              >
                <span>Delete</span>
              </button>
            </>
          )}
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
            <div className="p-3 bg-red-950/60 border border-red-800/60 rounded-xl text-red-300 text-xs">
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
            <label className="label">API Name *</label>
            <input
              type="text"
              placeholder="e.g. Current Weather, Stripe Charges"
              value={apiName}
              onChange={(e) => setApiName(e.target.value)}
              className="input"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label">Base URL *</label>
              <input
                type="url"
                placeholder="https://api.example.com"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                className="input font-mono text-xs"
                required
              />
              <span className="text-[10px] text-gray-500 font-mono mt-1 block">Root host URL of the target</span>
            </div>
            <div>
              <label className="label">Upstream Path</label>
              <input
                type="text"
                placeholder="/v1/forecast"
                value={path}
                onChange={(e) => setPath(e.target.value)}
                className="input font-mono text-xs"
              />
              <span className="text-[10px] text-gray-500 font-mono mt-1 block">Endpoint path, defaults to /</span>
            </div>
          </div>

          <div>
            <label className="label">Authentication Type</label>
            <select
              value={authType}
              onChange={(e) => setAuthType(e.target.value)}
              className="input"
            >
              <option value="NONE">None (Public API)</option>
              <option value="API_KEY_HEADER">API Key Header</option>
              <option value="BEARER">Bearer Token</option>
            </select>
          </div>

          {authType !== "NONE" && (
            <>
              {authType === "API_KEY_HEADER" && (
                <div>
                  <label className="label">Authentication Key Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. x-api-key or Authorization"
                    value={authKeyName}
                    onChange={(e) => setAuthKeyName(e.target.value)}
                    className="input font-mono text-xs"
                    required
                  />
                </div>
              )}

              <div>
                <label className="label">Upstream Secret Token</label>
                <input
                  type="password"
                  placeholder="Secret credential for target server"
                  value={credential}
                  onChange={(e) => setCredential(e.target.value)}
                  className="input font-mono text-xs"
                />
              </div>
            </>
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

      {/* ── EDIT UPSTREAM API MODAL ─────────────────────────────────────────── */}
      <Modal
        isOpen={Boolean(editingApi)}
        onClose={() => setEditingApi(null)}
        title="Edit Upstream API"
      >
        <form onSubmit={handleUpdateApi} className="space-y-4">
          {editError && (
            <div className="p-3 bg-red-950/60 border border-red-800/60 rounded-xl text-red-300 text-xs">
              {editError}
            </div>
          )}

          <div>
            <label className="label">API Name *</label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="input"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label">Base URL *</label>
              <input
                type="url"
                value={editBaseUrl}
                onChange={(e) => setEditBaseUrl(e.target.value)}
                className="input font-mono text-xs"
                required
              />
            </div>
            <div>
              <label className="label">Upstream Path</label>
              <input
                type="text"
                value={editPath}
                onChange={(e) => setEditPath(e.target.value)}
                className="input font-mono text-xs"
                placeholder="/"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={() => setEditingApi(null)}
              className="btn-secondary text-xs"
              disabled={editSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary text-xs"
              disabled={editSubmitting}
            >
              {editSubmitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── DETAILS & API DOCS MODAL (Size xl, high readability) ───────────── */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title={detailsTab === "docs" ? "API Docs / Quickstart" : "Upstream API Details"}
        size="lg"
      >
        {detailsApi && (
          <div className="space-y-5">
            {/* Modal Sub-Tabs */}
            <div className="flex items-center gap-4 border-b border-white/10 pb-2">
              <button
                type="button"
                onClick={() => setDetailsTab("docs")}
                className={`text-xs font-semibold pb-1 relative transition-colors ${
                  detailsTab === "docs" ? "text-emerald-400" : "text-gray-400 hover:text-white"
                }`}
              >
                Documentation & Quickstart
                {detailsTab === "docs" && (
                  <span className="absolute bottom-[-9px] left-0 right-0 h-0.5 bg-emerald-500 rounded-full" />
                )}
              </button>
              <button
                type="button"
                onClick={() => setDetailsTab("details")}
                className={`text-xs font-semibold pb-1 relative transition-colors ${
                  detailsTab === "details" ? "text-emerald-400" : "text-gray-400 hover:text-white"
                }`}
              >
                Configuration Details
                {detailsTab === "details" && (
                  <span className="absolute bottom-[-9px] left-0 right-0 h-0.5 bg-emerald-500 rounded-full" />
                )}
              </button>
            </div>

            {detailsTab === "docs" ? (
              <UpstreamApiDocs
                api={detailsApi}
                organizationId={activeOrg?._id}
                projectId={activeProject?._id}
                copiedItem={copiedItem}
                copyError={copyError}
                onCopy={handleCopy}
              />
            ) : (
              <div className="space-y-4 text-xs font-mono">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-3 bg-[#0e131f] border border-white/10 rounded-xl">
                    <span className="text-[10px] text-gray-500 uppercase block mb-1">API Name</span>
                    <span className="text-white font-semibold text-xs font-sans">{detailsApi.name}</span>
                  </div>
                  <div className="p-3 bg-[#0e131f] border border-white/10 rounded-xl">
                    <span className="text-[10px] text-gray-500 uppercase block mb-1">Status</span>
                    <span className="text-emerald-400 font-semibold">{detailsApi.status || "ACTIVE"}</span>
                  </div>
                  <div className="p-3 bg-[#0e131f] border border-white/10 rounded-xl">
                    <span className="text-[10px] text-gray-500 uppercase block mb-1">Base URL</span>
                    <span className="text-gray-200 break-all">{detailsApi.baseUrl}</span>
                  </div>
                  <div className="p-3 bg-[#0e131f] border border-white/10 rounded-xl">
                    <span className="text-[10px] text-gray-500 uppercase block mb-1">Path</span>
                    <span className="text-gray-200">{detailsApi.path || "/"}</span>
                  </div>
                </div>

                <div className="p-3.5 bg-[#0e131f] border border-white/10 rounded-xl space-y-1.5 font-sans">
                  <span className="text-[10px] text-gray-500 uppercase font-mono block">Authentication</span>
                  <p className="text-xs text-gray-300">
                    Type: <span className="font-mono text-emerald-300">{detailsApi.authentication?.type || "NONE"}</span>
                  </p>
                  {detailsApi.authentication?.keyName && (
                    <p className="text-xs text-gray-300">
                      Key Name: <span className="font-mono text-emerald-300">{detailsApi.authentication.keyName}</span>
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
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
