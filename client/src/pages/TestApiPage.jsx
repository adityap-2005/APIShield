import { useState, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { useOrg } from "../context/OrgContext";
import apiKeysApi from "../api/apiKeys";
import gatewayApi from "../api/gateway";
import {
  Send,
  Trash2,
  Plus,
  Copy,
  Check,
  ChevronDown,
  Server,
  KeyRound,
  Clock,
  HardDrive,
  Terminal,
} from "lucide-react";

export default function TestApiPage() {
  const {
    activeOrg,
    activeProject,
    activeIntegration,
    upstreamApis,
    activeUpstreamApi,
    switchUpstreamApi,
  } = useOrg();

  const params = useParams();
  const orgId = params.organizationId || activeOrg?._id;

  // Request Builder State
  const [method, setMethod] = useState("GET");
  const [endpointPath, setEndpointPath] = useState(
    activeUpstreamApi?.path
      ? `/gateway/upstream${activeUpstreamApi.path.startsWith("/") ? activeUpstreamApi.path : `/${activeUpstreamApi.path}`}`
      : ""
  );
  const [activeTab, setActiveTab] = useState("query"); // "query" | "body" | "headers"

  // Query Parameters - start clean without hardcoded sample data
  const [queryParams, setQueryParams] = useState([]);

  // Headers - start clean without fake headers
  const [requestHeaders, setRequestHeaders] = useState([]);

  // Request Body - start clean
  const [requestBody, setRequestBody] = useState("");

  // API Key context switcher
  const [availableKeys, setAvailableKeys] = useState([]);
  const [selectedKeyId, setSelectedKeyId] = useState("");
  const [customApiKey, setCustomApiKey] = useState("");

  // Response Panel State - starts as null (clear empty state before first request)
  const [responseTab, setResponseTab] = useState("response"); // "response" | "headers" | "curl"
  const [loading, setLoading] = useState(false);
  const [responseResult, setResponseResult] = useState(null);

  const [copiedResponse, setCopiedResponse] = useState(false);
  const [copiedCurl, setCopiedCurl] = useState(false);
  const [apiDropdownOpen, setApiDropdownOpen] = useState(false);
  const [keyDropdownOpen, setKeyDropdownOpen] = useState(false);

  // Sync endpointPath when activeUpstreamApi changes
  useEffect(() => {
    if (activeUpstreamApi?.path) {
      const cleanPath = activeUpstreamApi.path.startsWith("/")
        ? activeUpstreamApi.path
        : `/${activeUpstreamApi.path}`;
      setEndpointPath(`/gateway/upstream${cleanPath}`);
    } else if (activeUpstreamApi?.name) {
      const slug = activeUpstreamApi.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      setEndpointPath(`/gateway/upstream/${slug}`);
    }
  }, [activeUpstreamApi]);

  // Load project API keys for key switcher
  useEffect(() => {
    if (!orgId || !activeProject?._id) return;
    let isMounted = true;

    async function loadKeys() {
      try {
        const res = await apiKeysApi.getAll(orgId, activeProject._id);
        if (isMounted) {
          const keys = res.data?.data || [];
          setAvailableKeys(keys);
          if (keys.length > 0 && !selectedKeyId) {
            setSelectedKeyId(keys[0]._id);
          }
        }
      } catch {
        // Safe fallback when keys are restricted
      }
    }

    loadKeys();

    return () => {
      isMounted = false;
    };
  }, [orgId, activeProject?._id]);

  // Manage Query Params
  const addQueryParam = () => {
    setQueryParams((prev) => [
      ...prev,
      { id: Date.now().toString(), key: "", value: "" },
    ]);
  };

  const updateQueryParam = (id, field, val) => {
    setQueryParams((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: val } : item))
    );
  };

  const removeQueryParam = (id) => {
    setQueryParams((prev) => prev.filter((item) => item.id !== id));
  };

  // Manage Headers
  const addHeader = () => {
    setRequestHeaders((prev) => [
      ...prev,
      { id: Date.now().toString(), key: "", value: "" },
    ]);
  };

  const updateHeader = (id, field, val) => {
    setRequestHeaders((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: val } : item))
    );
  };

  const removeHeader = (id) => {
    setRequestHeaders((prev) => prev.filter((item) => item.id !== id));
  };

  // Selected API Key label & effective key
  const selectedKey = availableKeys.find((k) => k._id === selectedKeyId);
  const effectiveApiKey =
    customApiKey.trim() ||
    (selectedKey ? `key_${selectedKey.publicKeyId || selectedKey._id.slice(-8)}` : "");

  // Generated cURL Command
  const generatedCurl = useMemo(() => {
    const validParams = queryParams.filter((p) => p.key.trim());
    let queryString = "";
    if (validParams.length > 0) {
      const search = new URLSearchParams();
      validParams.forEach((p) => search.append(p.key.trim(), p.value.trim()));
      queryString = `?${search.toString()}`;
    }

    const host = typeof window !== "undefined" ? window.location.origin : "https://gateway.apishield.io";
    const cleanPath = endpointPath.startsWith("/") ? endpointPath : `/${endpointPath}`;
    let cmd = `curl -X ${method} "${host}${cleanPath}${queryString}" \\\n`;
    cmd += `  -H "x-api-key: ${effectiveApiKey || "YOUR_APISHIELD_API_KEY"}" \\\n`;

    requestHeaders
      .filter((h) => h.key.trim())
      .forEach((h) => {
        cmd += `  -H "${h.key.trim()}: ${h.value.trim()}" \\\n`;
      });

    if (["POST", "PUT", "PATCH"].includes(method) && requestBody.trim()) {
      cmd += `  -H "Content-Type: application/json" \\\n`;
      cmd += `  -d '${requestBody.replace(/\n/g, "")}'`;
    } else {
      cmd = cmd.slice(0, -3); // trim trailing slash and newline
    }

    return cmd;
  }, [method, endpointPath, queryParams, requestHeaders, requestBody, effectiveApiKey]);

  // Execute Gateway Request
  const handleSendRequest = async () => {
    setLoading(true);
    const startTime = performance.now();

    const paramObj = {};
    queryParams
      .filter((p) => p.key.trim())
      .forEach((p) => {
        paramObj[p.key.trim()] = p.value.trim();
      });

    const headerObj = {};
    requestHeaders
      .filter((h) => h.key.trim())
      .forEach((h) => {
        headerObj[h.key.trim()] = h.value.trim();
      });

    let parsedBody;
    if (["POST", "PUT", "PATCH"].includes(method) && requestBody.trim()) {
      try {
        parsedBody = JSON.parse(requestBody);
      } catch {
        parsedBody = requestBody;
      }
    }

    // Require target configuration
    if (!orgId || !activeProject?._id || !activeUpstreamApi?._id) {
      setLoading(false);
      setResponseResult({
        status: 400,
        statusText: "Bad Request",
        latency: 0,
        size: "0.2 KB",
        data: {
          error: "Missing Configuration",
          message: "Please select an Organization, Project, and Upstream API to route your test request.",
        },
        headers: {
          "content-type": "application/json; charset=utf-8",
        },
      });
      return;
    }

    const keyToUse = customApiKey.trim() || effectiveApiKey;

    try {
      const res = await gatewayApi.call(
        orgId,
        activeProject._id,
        activeUpstreamApi._id,
        keyToUse,
        {
          method,
          queryParams: paramObj,
          body: parsedBody,
          headers: headerObj,
        }
      );
      const duration = Math.round(performance.now() - startTime);
      const sizeBytes = new Blob([JSON.stringify(res.data)]).size;

      setResponseResult({
        status: res.status,
        statusText: res.statusText || "OK",
        latency: duration,
        size: `${(sizeBytes / 1024).toFixed(1)} KB`,
        data: res.data,
        headers: res.headers || {},
      });
    } catch (err) {
      const duration = Math.round(performance.now() - startTime);
      const errPayload = err.response?.data || {
        error: "Gateway Request Failed",
        message: err.message || "Failed to reach target upstream API through gateway.",
      };
      const sizeBytes = new Blob([JSON.stringify(errPayload)]).size;

      setResponseResult({
        status: err.response?.status || 502,
        statusText: err.response?.statusText || "Gateway Error",
        latency: duration,
        size: `${(sizeBytes / 1024).toFixed(1)} KB`,
        data: errPayload,
        headers: err.response?.headers || { "content-type": "application/json" },
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text, type) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    if (type === "response") {
      setCopiedResponse(true);
      setTimeout(() => setCopiedResponse(false), 2000);
    } else {
      setCopiedCurl(true);
      setTimeout(() => setCopiedCurl(false), 2000);
    }
  };

  // Syntax highlighting for formatted JSON
  const renderJsonWithLineNumbers = (obj) => {
    let jsonString = "";
    try {
      jsonString = typeof obj === "string" ? obj : JSON.stringify(obj, null, 2);
    } catch {
      jsonString = String(obj);
    }
    const lines = jsonString.split("\n");

    return (
      <div className="flex font-mono text-xs leading-relaxed overflow-x-auto">
        {/* Line Numbers */}
        <div className="select-none pr-3 sm:pr-4 text-right text-gray-600 border-r border-white/10 shrink-0 space-y-0.5 font-mono text-[11px]">
          {lines.map((_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>

        {/* Formatted Code */}
        <div className="pl-3 sm:pl-4 space-y-0.5 text-gray-200 whitespace-pre font-mono text-xs overflow-x-auto">
          {lines.map((line, i) => {
            const formattedLine = line.replace(
              /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g,
              (match) => {
                let cls = "text-sky-400";
                if (/^"/.test(match)) {
                  if (/:$/.test(match)) {
                    cls = "text-[#60a5fa]";
                  } else {
                    cls = "text-[#34d399]";
                  }
                } else if (/true|false/.test(match)) {
                  cls = "text-[#c084fc]";
                } else if (/null/.test(match)) {
                  cls = "text-gray-500";
                } else {
                  cls = "text-[#fbbf24]";
                }
                return `<span class="${cls}">${match}</span>`;
              }
            );

            return (
              <div
                key={i}
                dangerouslySetInnerHTML={{ __html: formattedLine }}
              />
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* ── BREADCRUMBS & HIERARCHY BAR ────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-gray-400 font-mono">
          <Link to="/" className="text-gray-400 hover:text-white transition-colors">
            APIShield
          </Link>
          <span className="text-gray-600">/</span>
          <span className="text-gray-400 truncate max-w-[120px]">
            {activeProject?.name || "Project"}
          </span>
          <span className="text-gray-600">/</span>
          <span className="text-gray-400 truncate max-w-[140px]">
            {activeIntegration?.name || "Integration"}
          </span>
          <span className="text-gray-600">/</span>
          <span className="text-emerald-400 font-medium">Test API</span>
        </nav>
      </div>

      {/* ── PAGE TITLE & UPSTREAM SELECTOR ─────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Test API
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Send requests to your upstream API through APIShield Gateway.
          </p>
        </div>

        {/* Upstream API Switcher Pill */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {upstreamApis?.length > 1 && (
            <div className="relative">
              <button
                onClick={() => setApiDropdownOpen(!apiDropdownOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/10 bg-[#0e131f] text-xs font-medium text-white hover:border-white/20 transition-all shadow-sm"
                aria-label="Select upstream API"
              >
                <Server className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="truncate max-w-[130px]">
                  {activeUpstreamApi?.name || "Select API"}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
              </button>

              {apiDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-[#131826] border border-white/10 rounded-xl shadow-2xl py-1.5 z-40">
                  <div className="px-3 py-1.5 text-[10px] font-mono font-semibold text-gray-500 uppercase tracking-wider border-b border-white/5">
                    Upstream APIs
                  </div>
                  {upstreamApis.map((api) => {
                    const isSelected = activeUpstreamApi?._id === api._id;
                    return (
                      <button
                        key={api._id}
                        onClick={() => {
                          switchUpstreamApi(api);
                          setApiDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-white/5 transition-colors ${
                          isSelected ? "text-emerald-400 font-semibold bg-emerald-950/20" : "text-gray-300"
                        }`}
                      >
                        <span className="truncate">{api.name}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── TWO-COLUMN CONSOLE GRID ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* ── LEFT COLUMN: REQUEST BUILDER ─────────────────────────────────── */}
        <div className="bg-[#0e131f] border border-white/10 rounded-xl p-4 sm:p-5 shadow-2xl space-y-5">
          {/* Method and Path Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <div className="relative shrink-0">
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="w-full sm:w-auto appearance-none bg-[#090d16] text-white font-mono font-semibold text-xs border border-white/10 rounded-lg px-3 py-2.5 pr-8 hover:border-white/20 focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="PATCH">PATCH</option>
                <option value="DELETE">DELETE</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            <div className="flex-1 relative min-w-0">
              <input
                type="text"
                value={endpointPath}
                onChange={(e) => setEndpointPath(e.target.value)}
                className="w-full bg-[#090d16] text-gray-200 font-mono text-xs border border-white/10 rounded-lg px-3.5 py-2.5 focus:outline-none focus:border-emerald-500 placeholder-gray-600 transition-colors"
                placeholder="/gateway/upstream/endpoint"
              />
            </div>
          </div>

          {/* Request Sub-Tabs */}
          <div className="border-b border-white/10 flex items-center gap-4 sm:gap-6 overflow-x-auto whitespace-nowrap">
            <button
              onClick={() => setActiveTab("query")}
              className={`pb-2.5 text-xs font-medium transition-colors relative shrink-0 ${
                activeTab === "query"
                  ? "text-emerald-400 font-semibold"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              Query Parameters {queryParams.length > 0 && `(${queryParams.length})`}
              {activeTab === "query" && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500 rounded-full" />
              )}
            </button>

            <button
              onClick={() => setActiveTab("body")}
              className={`pb-2.5 text-xs font-medium transition-colors relative shrink-0 ${
                activeTab === "body"
                  ? "text-emerald-400 font-semibold"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              Request Body {requestBody.trim() ? "•" : ""}
              {activeTab === "body" && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500 rounded-full" />
              )}
            </button>

            <button
              onClick={() => setActiveTab("headers")}
              className={`pb-2.5 text-xs font-medium transition-colors relative shrink-0 ${
                activeTab === "headers"
                  ? "text-emerald-400 font-semibold"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              Headers {requestHeaders.length > 0 && `(${requestHeaders.length})`}
              {activeTab === "headers" && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500 rounded-full" />
              )}
            </button>
          </div>

          {/* TAB 1: Query Parameters */}
          {activeTab === "query" && (
            <div className="space-y-3">
              {queryParams.length === 0 ? (
                <div className="py-6 px-4 text-center border border-dashed border-white/10 rounded-lg text-gray-500 text-xs">
                  <p>No query parameters configured.</p>
                  <button
                    type="button"
                    onClick={addQueryParam}
                    className="mt-2 text-emerald-400 hover:text-emerald-300 font-medium inline-flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add first parameter</span>
                  </button>
                </div>
              ) : (
                <>
                  {queryParams.map((param) => (
                    <div key={param.id} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={param.key}
                        onChange={(e) => updateQueryParam(param.id, "key", e.target.value)}
                        placeholder="Key"
                        className="flex-1 min-w-0 bg-[#090d16] text-gray-200 font-mono text-xs border border-white/10 rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500 placeholder-gray-600 transition-colors"
                      />
                      <input
                        type="text"
                        value={param.value}
                        onChange={(e) => updateQueryParam(param.id, "value", e.target.value)}
                        placeholder="Value"
                        className="flex-1 min-w-0 bg-[#090d16] text-gray-200 font-mono text-xs border border-white/10 rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500 placeholder-gray-600 transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => removeQueryParam(param.id)}
                        className="p-2 text-rose-400/80 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors shrink-0"
                        title="Remove Parameter"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={addQueryParam}
                    className="w-full py-2 border border-dashed border-white/15 hover:border-emerald-500/40 rounded-lg text-xs font-medium text-gray-400 hover:text-emerald-400 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Parameter</span>
                  </button>
                </>
              )}
            </div>
          )}

          {/* TAB 2: Request Body */}
          {activeTab === "body" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] text-gray-400 font-mono">
                <span>JSON Payload (Content-Type: application/json)</span>
                {requestBody.trim() && (
                  <button
                    type="button"
                    onClick={() => {
                      try {
                        setRequestBody(JSON.stringify(JSON.parse(requestBody), null, 2));
                      } catch {
                        // ignore parse error
                      }
                    }}
                    className="hover:text-emerald-400 transition-colors"
                  >
                    Format JSON
                  </button>
                )}
              </div>
              <textarea
                rows={6}
                value={requestBody}
                onChange={(e) => setRequestBody(e.target.value)}
                placeholder={'{\n  "key": "value"\n}'}
                className="w-full bg-[#090d16] text-gray-200 font-mono text-xs border border-white/10 rounded-lg p-3 focus:outline-none focus:border-emerald-500 transition-colors leading-relaxed"
              />
            </div>
          )}

          {/* TAB 3: Headers */}
          {activeTab === "headers" && (
            <div className="space-y-3">
              {requestHeaders.length === 0 ? (
                <div className="py-6 px-4 text-center border border-dashed border-white/10 rounded-lg text-gray-500 text-xs">
                  <p>No custom request headers configured.</p>
                  <button
                    type="button"
                    onClick={addHeader}
                    className="mt-2 text-emerald-400 hover:text-emerald-300 font-medium inline-flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add first header</span>
                  </button>
                </div>
              ) : (
                <>
                  {requestHeaders.map((header) => (
                    <div key={header.id} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={header.key}
                        onChange={(e) => updateHeader(header.id, "key", e.target.value)}
                        placeholder="Header Name"
                        className="flex-1 min-w-0 bg-[#090d16] text-gray-200 font-mono text-xs border border-white/10 rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500 placeholder-gray-600 transition-colors"
                      />
                      <input
                        type="text"
                        value={header.value}
                        onChange={(e) => updateHeader(header.id, "value", e.target.value)}
                        placeholder="Value"
                        className="flex-1 min-w-0 bg-[#090d16] text-gray-200 font-mono text-xs border border-white/10 rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500 placeholder-gray-600 transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => removeHeader(header.id)}
                        className="p-2 text-rose-400/80 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors shrink-0"
                        title="Remove Header"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={addHeader}
                    className="w-full py-2 border border-dashed border-white/15 hover:border-emerald-500/40 rounded-lg text-xs font-medium text-gray-400 hover:text-emerald-400 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Header</span>
                  </button>
                </>
              )}
            </div>
          )}

          {/* Context-Aware API Key Switcher Section */}
          <div className="pt-3 border-t border-white/10 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-gray-300 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
                Gateway Authorization (x-api-key)
              </span>
              <span className="text-[10px] text-gray-500 font-mono">
                {availableKeys.length} available
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setKeyDropdownOpen(!keyDropdownOpen)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-[#090d16] border border-white/10 text-xs font-mono text-gray-300 hover:border-white/20 transition-colors text-left"
                >
                  <span className="truncate">
                    {selectedKey
                      ? `${selectedKey.name} (•••${selectedKey.publicKeyId?.slice(-4) || "key"})`
                      : availableKeys.length > 0
                      ? "Select Project Key"
                      : "No Project Keys"}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-gray-500 shrink-0 ml-1" />
                </button>

                {keyDropdownOpen && (
                  <div className="absolute left-0 mt-1 w-full bg-[#131826] border border-white/10 rounded-xl shadow-2xl py-1 z-30 max-h-48 overflow-y-auto">
                    <div className="px-3 py-1.5 text-[10px] font-mono text-gray-400 uppercase tracking-wider border-b border-white/5">
                      Project Keys (Masked)
                    </div>
                    {availableKeys.length === 0 ? (
                      <div className="px-3 py-2 text-xs text-gray-500 italic">
                        No keys in this project
                      </div>
                    ) : (
                      availableKeys.map((k) => (
                        <button
                          key={k._id}
                          type="button"
                          onClick={() => {
                            setSelectedKeyId(k._id);
                            setKeyDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 text-xs font-mono flex items-center justify-between hover:bg-white/5 ${
                            selectedKeyId === k._id ? "text-emerald-400 bg-emerald-950/20" : "text-gray-300"
                          }`}
                        >
                          <span className="truncate">{k.name}</span>
                          <span className="text-[10px] text-gray-500 ml-2">
                            •••{k.publicKeyId?.slice(-4) || "key"}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              <input
                type="password"
                value={customApiKey}
                onChange={(e) => setCustomApiKey(e.target.value)}
                placeholder="Or paste custom x-api-key"
                className="w-full bg-[#090d16] text-gray-200 font-mono text-xs border border-white/10 rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500 placeholder-gray-600 transition-colors"
              />
            </div>
            <p className="text-[10px] text-gray-500 leading-tight">
              Showing keys available to current authorized context. Secrets are never exposed in plaintext.
            </p>
          </div>

          {/* Action Button: Emerald Send Request */}
          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={handleSendRequest}
              disabled={loading}
              className="w-full sm:w-auto bg-[#10b981] hover:bg-[#059669] text-[#052e16] font-semibold text-xs px-5 py-2.5 rounded-lg flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 hover:shadow-emerald-950/60 transition-all disabled:opacity-60 cursor-pointer"
            >
              {loading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-[#052e16] border-t-transparent rounded-full animate-spin" />
                  <span>Sending Request...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5 fill-current" />
                  <span>Send Request</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* ── RIGHT COLUMN: RESPONSE PANEL ─────────────────────────────────── */}
        <div className="bg-[#0e131f] border border-white/10 rounded-xl p-4 sm:p-5 shadow-2xl flex flex-col min-h-[460px]">
          {/* Top Bar with Tabs and Status */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/10 pb-3 mb-4 gap-3">
            <div className="flex items-center gap-4 sm:gap-5">
              <button
                type="button"
                onClick={() => setResponseTab("response")}
                className={`text-xs font-medium transition-colors ${
                  responseTab === "response"
                    ? "text-emerald-400 font-semibold"
                    : "text-gray-400 hover:text-gray-200"
                }`}
              >
                Response
              </button>

              <button
                type="button"
                onClick={() => setResponseTab("headers")}
                className={`text-xs font-medium transition-colors ${
                  responseTab === "headers"
                    ? "text-emerald-400 font-semibold"
                    : "text-gray-400 hover:text-gray-200"
                }`}
              >
                Headers
              </button>

              <button
                type="button"
                onClick={() => setResponseTab("curl")}
                className={`text-xs font-medium transition-colors ${
                  responseTab === "curl"
                    ? "text-emerald-400 font-semibold"
                    : "text-gray-400 hover:text-gray-200"
                }`}
              >
                cURL
              </button>
            </div>

            {/* Status & Latency Badges - Only rendered when response is received */}
            {responseResult && (
              <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium border ${
                    responseResult.status >= 200 && responseResult.status < 300
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/25"
                      : responseResult.status >= 300 && responseResult.status < 400
                      ? "bg-amber-500/10 text-amber-400 border-amber-500/25"
                      : "bg-rose-500/10 text-rose-400 border-rose-500/25"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      responseResult.status >= 200 && responseResult.status < 300
                        ? "bg-emerald-400"
                        : responseResult.status >= 300 && responseResult.status < 400
                        ? "bg-amber-400"
                        : "bg-rose-400"
                    }`}
                  />
                  <span>
                    {responseResult.status} {responseResult.statusText}
                  </span>
                </span>

                <span className="text-[11px] font-mono text-gray-400 inline-flex items-center gap-1">
                  <Clock className="w-3 h-3 text-gray-500" />
                  {responseResult.latency}ms
                </span>
                <span className="text-[11px] font-mono text-gray-400 inline-flex items-center gap-1">
                  <HardDrive className="w-3 h-3 text-gray-500" />
                  {responseResult.size}
                </span>
              </div>
            )}
          </div>

          {/* Panel Content Area */}
          <div className="flex-1 flex flex-col relative">
            {loading && (
              <div className="absolute inset-0 bg-[#0e131f]/95 backdrop-blur-xs flex flex-col items-center justify-center gap-3 z-20 rounded-lg">
                <span className="w-7 h-7 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs font-mono text-gray-300">
                  Routing request through APIShield Gateway...
                </span>
              </div>
            )}

            {/* Tab: Response */}
            {responseTab === "response" && (
              <div className="relative flex-1 bg-[#080c14] border border-white/5 rounded-lg p-4 overflow-auto max-h-[500px]">
                {responseResult ? (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        copyToClipboard(
                          JSON.stringify(responseResult.data, null, 2),
                          "response"
                        )
                      }
                      className="absolute top-3 right-3 p-1.5 rounded-md bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                      title="Copy Response JSON"
                    >
                      {copiedResponse ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                    {renderJsonWithLineNumbers(responseResult.data)}
                  </>
                ) : (
                  /* Clean Empty State before first request */
                  <div className="flex flex-col items-center justify-center h-full text-center py-20 px-4 text-gray-500">
                    <div className="w-12 h-12 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-center mb-3 text-gray-400">
                      <Terminal className="w-5 h-5 text-emerald-400/80" />
                    </div>
                    <h3 className="text-sm font-semibold text-gray-200">No Request Executed</h3>
                    <p className="text-xs text-gray-400 max-w-sm mt-1 leading-relaxed">
                      Configure your endpoint and parameters, then click{" "}
                      <span className="text-emerald-400 font-medium">Send Request</span> to test live upstream responses.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Tab: Response Headers */}
            {responseTab === "headers" && (
              <div className="flex-1 bg-[#080c14] border border-white/5 rounded-lg p-4 overflow-auto max-h-[500px]">
                {responseResult && Object.keys(responseResult.headers || {}).length > 0 ? (
                  <table className="w-full text-left text-xs font-mono">
                    <thead>
                      <tr className="border-b border-white/10 text-[10px] text-gray-500 uppercase">
                        <th className="pb-2">Header</th>
                        <th className="pb-2">Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-gray-300">
                      {Object.entries(responseResult.headers).map(([key, val]) => (
                        <tr key={key} className="hover:bg-white/5">
                          <td className="py-2 text-sky-400 pr-4">{key}</td>
                          <td className="py-2 text-emerald-300 break-all">{String(val)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center py-20 text-gray-500 text-xs">
                    <p>{responseResult ? "No response headers received." : "Send a request to inspect response headers."}</p>
                  </div>
                )}
              </div>
            )}

            {/* Tab: Generated cURL */}
            {responseTab === "curl" && (
              <div className="relative flex-1 bg-[#080c14] border border-white/5 rounded-lg p-4 font-mono text-xs overflow-auto max-h-[500px]">
                <button
                  type="button"
                  onClick={() => copyToClipboard(generatedCurl, "curl")}
                  className="absolute top-3 right-3 p-1.5 rounded-md bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                  title="Copy cURL Command"
                >
                  {copiedCurl ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
                <pre className="text-gray-300 whitespace-pre-wrap leading-relaxed font-mono">
                  {generatedCurl}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
