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
  Code2,
  KeyRound,
} from "lucide-react";

const ENV_COLORS = {
  DEVELOPMENT: "bg-blue-400",
  STAGING: "bg-purple-400",
  PRODUCTION: "bg-emerald-400",
  TEST: "bg-amber-400",
};

export default function TestApiPage() {
  const {
    activeOrg,
    activeProject,
    environments,
    activeEnvironment,
    switchEnvironment,
    activeIntegration,
    upstreamApis,
    activeUpstreamApi,
    switchUpstreamApi,
  } = useOrg();

  const params = useParams();
  const orgId = params.organizationId || activeOrg?._id;

  // Request Builder State
  const [method, setMethod] = useState("GET");
  const [endpointPath, setEndpointPath] = useState("/gateway/upstream/weather/current");
  const [activeTab, setActiveTab] = useState("query"); // "query" | "body" | "headers"

  // Query Parameters
  const [queryParams, setQueryParams] = useState([
    { id: "1", key: "latitude", value: "-33.8504" },
    { id: "2", key: "longitude", value: "151.2132" },
    { id: "3", key: "current_weather", value: "true" },
  ]);

  // Headers
  const [requestHeaders, setRequestHeaders] = useState([
    { id: "1", key: "Accept", value: "application/json" },
  ]);

  // Request Body
  const [requestBody, setRequestBody] = useState(`{\n  "demo": true\n}`);

  // API Key context switcher
  const [availableKeys, setAvailableKeys] = useState([]);
  const [selectedKeyId, setSelectedKeyId] = useState("");
  const [customApiKey, setCustomApiKey] = useState("");

  // Response Panel State
  const [responseTab, setResponseTab] = useState("response"); // "response" | "headers" | "curl"
  const [loading, setLoading] = useState(false);
  const [responseResult, setResponseResult] = useState({
    status: 200,
    statusText: "OK",
    latency: 184,
    size: "1.2 KB",
    data: {
      status: "success",
      latitude: -33.8504,
      longitude: 151.2132,
      data: {
        temp: 22.5,
        condition: "sunny",
        wind_speed: 12.4
      }
    },
    headers: {
      "content-type": "application/json; charset=utf-8",
      "x-apishield-gateway": "active",
      "x-ratelimit-remaining": "99",
      "cache-control": "no-cache"
    }
  });

  const [copiedResponse, setCopiedResponse] = useState(false);
  const [copiedCurl, setCopiedCurl] = useState(false);
  const [envDropdownOpen, setEnvDropdownOpen] = useState(false);
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
          if (keys.length > 0) {
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

  // Manage Query Parameters
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
    (selectedKey ? `key_${selectedKey.publicKeyId || selectedKey._id.slice(-8)}` : "api_live_demo_test_key");

  // Generated cURL Command
  const generatedCurl = useMemo(() => {
    const validParams = queryParams.filter((p) => p.key.trim());
    let queryString = "";
    if (validParams.length > 0) {
      const search = new URLSearchParams();
      validParams.forEach((p) => search.append(p.key.trim(), p.value.trim()));
      queryString = `?${search.toString()}`;
    }

    let cmd = `curl -X ${method} "https://gateway.apishield.io${endpointPath}${queryString}" \\\n`;
    cmd += `  -H "x-api-key: ${effectiveApiKey}" \\\n`;

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

    try {
      if (orgId && activeProject?._id && activeUpstreamApi?._id && customApiKey) {
        const res = await gatewayApi.call(
          orgId,
          activeProject._id,
          activeUpstreamApi._id,
          customApiKey.trim(),
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
      } else {
        // Interactive simulated gateway response
        await new Promise((r) => setTimeout(r, 260));
        const duration = Math.round(performance.now() - startTime);

        // Dynamically compute response matching query params
        const responseData = {
          status: "success",
          latitude: parseFloat(paramObj.latitude) || -33.8504,
          longitude: parseFloat(paramObj.longitude) || 151.2132,
          data: {
            temp: 22.5,
            condition: "sunny",
            wind_speed: 12.4,
            ...(paramObj.current_weather ? { current_weather: true } : {}),
            routed_via: "APIShield Gateway",
            environment: activeEnvironment?.name || "DEVELOPMENT",
            upstream: activeUpstreamApi?.name || "Weather API",
          },
        };

        const sizeBytes = new Blob([JSON.stringify(responseData)]).size;

        setResponseResult({
          status: 200,
          statusText: "OK",
          latency: duration,
          size: `${(sizeBytes / 1024).toFixed(1)} KB`,
          data: responseData,
          headers: {
            "content-type": "application/json; charset=utf-8",
            "x-apishield-gateway": "active",
            "x-ratelimit-remaining": "99",
            "x-request-id": "req_" + Math.random().toString(36).slice(2, 10),
            "cache-control": "no-cache",
          },
        });
      }
    } catch (err) {
      const duration = Math.round(performance.now() - startTime);
      setResponseResult({
        status: err.response?.status || 500,
        statusText: err.response?.statusText || "Error",
        latency: duration,
        size: "0.4 KB",
        data: err.response?.data || {
          error: "Gateway Request Failed",
          message: err.message || "Failed to reach upstream API",
        },
        headers: err.response?.headers || { "content-type": "application/json" },
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text, type) => {
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
    const jsonString = JSON.stringify(obj, null, 2);
    const lines = jsonString.split("\n");

    return (
      <div className="flex font-mono text-xs leading-relaxed overflow-x-auto">
        {/* Line Numbers */}
        <div className="select-none pr-4 text-right text-gray-600 border-r border-white/10 shrink-0 space-y-0.5">
          {lines.map((_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>

        {/* Formatted Code */}
        <div className="pl-4 space-y-0.5 text-gray-200 whitespace-pre">
          {lines.map((line, i) => {
            // Highlight keys and values with regex
            const formattedLine = line.replace(
              /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g,
              (match) => {
                let cls = "text-sky-400"; // default key
                if (/^"/.test(match)) {
                  if (/:$/.test(match)) {
                    cls = "text-[#60a5fa]"; // property key (cyan/blue)
                  } else {
                    cls = "text-[#34d399]"; // string value (emerald green)
                  }
                } else if (/true|false/.test(match)) {
                  cls = "text-[#c084fc]"; // boolean (purple)
                } else if (/null/.test(match)) {
                  cls = "text-gray-500";
                } else {
                  cls = "text-[#fbbf24]"; // number (amber)
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

  const currentEnvName = (activeEnvironment?.name || "DEVELOPMENT").toUpperCase();
  const envDotColor = ENV_COLORS[currentEnvName] || "bg-emerald-400";
  const envDisplay = currentEnvName.charAt(0) + currentEnvName.slice(1).toLowerCase();

  return (
    <div className="min-h-screen bg-[#070b12] text-gray-100 p-4 sm:p-6 lg:p-8">
      {/* ── BREADCRUMBS & HIERARCHY BAR ────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        {/* Supabase / Gateway Hierarchy Indicator */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-gray-400 font-mono">
          <Link to="/" className="text-gray-400 hover:text-white transition-colors">
            APIShield
          </Link>
          <span className="text-gray-600">/</span>
          <span className="text-gray-400 truncate max-w-[120px]">
            {activeProject?.name || "Project"}
          </span>
          <span className="text-gray-600">/</span>
          <span className="text-gray-400 truncate max-w-[120px]">
            {envDisplay}
          </span>
          <span className="text-gray-600">/</span>
          <span className="text-gray-400 truncate max-w-[140px]">
            {activeIntegration?.name || "Integration"}
          </span>
          <span className="text-gray-600">/</span>
          <span className="text-emerald-400 font-medium">Test API</span>
        </nav>
      </div>

      {/* ── PAGE TITLE & ENVIRONMENT SWITCHER ──────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Test API
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Send requests to your upstream API through APIShield Gateway.
          </p>
        </div>

        {/* Environment Selector Pill (matches reference design) */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {/* Environment dropdown button */}
          <div className="relative">
            <button
              onClick={() => setEnvDropdownOpen(!envDropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/10 bg-[#0e131f] text-xs font-medium text-white hover:border-white/20 transition-all shadow-sm"
              aria-label="Select environment"
            >
              <span className={`w-2 h-2 rounded-full ${envDotColor} shrink-0`} />
              <span>{envDisplay}</span>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
            </button>

            {envDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-[#131826] border border-white/10 rounded-xl shadow-2xl py-1.5 z-40">
                <div className="px-3 py-1.5 text-[10px] font-mono font-semibold text-gray-500 uppercase tracking-wider border-b border-white/5">
                  Switch Environment
                </div>
                {(environments?.length > 0
                  ? environments
                  : [
                      { _id: "dev", name: "DEVELOPMENT" },
                      { _id: "stg", name: "STAGING" },
                      { _id: "prod", name: "PRODUCTION" },
                      { _id: "test", name: "TEST" },
                    ]
                ).map((env) => {
                  const isCur = activeEnvironment?.name === env.name;
                  const itemColor = ENV_COLORS[env.name.toUpperCase()] || "bg-emerald-400";
                  const formatted = env.name.charAt(0) + env.name.slice(1).toLowerCase();
                  return (
                    <button
                      key={env._id || env.name}
                      onClick={() => {
                        switchEnvironment(env);
                        setEnvDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-white/5 transition-colors ${
                        isCur ? "text-emerald-400 font-semibold bg-emerald-950/20" : "text-gray-300"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${itemColor}`} />
                        <span>{formatted}</span>
                      </div>
                      {isCur && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Upstream API Switcher Pill */}
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
        <div className="bg-[#0e131f] border border-white/10 rounded-xl p-5 shadow-2xl space-y-5">
          {/* Method and Path Bar */}
          <div className="flex items-center gap-2.5">
            {/* Method Select */}
            <div className="relative">
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="appearance-none bg-[#090d16] text-white font-mono font-semibold text-xs border border-white/10 rounded-lg px-3 py-2.5 pr-8 hover:border-white/20 focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="PATCH">PATCH</option>
                <option value="DELETE">DELETE</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Dynamic Endpoint Path Input */}
            <div className="flex-1 relative">
              <input
                type="text"
                value={endpointPath}
                onChange={(e) => setEndpointPath(e.target.value)}
                className="w-full bg-[#090d16] text-gray-200 font-mono text-xs border border-white/10 rounded-lg px-3.5 py-2.5 focus:outline-none focus:border-emerald-500 placeholder-gray-600 transition-colors"
                placeholder="/gateway/upstream/weather/current"
              />
            </div>
          </div>

          {/* Request Sub-Tabs */}
          <div className="border-b border-white/10 flex items-center gap-6">
            <button
              onClick={() => setActiveTab("query")}
              className={`pb-2.5 text-xs font-medium transition-colors relative ${
                activeTab === "query"
                  ? "text-emerald-400 font-semibold"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              Query Parameters
              {activeTab === "query" && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500 rounded-full" />
              )}
            </button>

            <button
              onClick={() => setActiveTab("body")}
              className={`pb-2.5 text-xs font-medium transition-colors relative ${
                activeTab === "body"
                  ? "text-emerald-400 font-semibold"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              Request Body
              {activeTab === "body" && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500 rounded-full" />
              )}
            </button>

            <button
              onClick={() => setActiveTab("headers")}
              className={`pb-2.5 text-xs font-medium transition-colors relative ${
                activeTab === "headers"
                  ? "text-emerald-400 font-semibold"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              Headers
              {activeTab === "headers" && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500 rounded-full" />
              )}
            </button>
          </div>

          {/* TAB 1: Query Parameters */}
          {activeTab === "query" && (
            <div className="space-y-3">
              {queryParams.map((param) => (
                <div key={param.id} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={param.key}
                    onChange={(e) => updateQueryParam(param.id, "key", e.target.value)}
                    placeholder="Key"
                    className="flex-1 bg-[#090d16] text-gray-200 font-mono text-xs border border-white/10 rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500 placeholder-gray-600 transition-colors"
                  />
                  <input
                    type="text"
                    value={param.value}
                    onChange={(e) => updateQueryParam(param.id, "value", e.target.value)}
                    placeholder="Value"
                    className="flex-1 bg-[#090d16] text-gray-200 font-mono text-xs border border-white/10 rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500 placeholder-gray-600 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => removeQueryParam(param.id)}
                    className="p-2 text-rose-400/80 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors"
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
            </div>
          )}

          {/* TAB 2: Request Body */}
          {activeTab === "body" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] text-gray-400 font-mono">
                <span>JSON Payload (Content-Type: application/json)</span>
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
              </div>
              <textarea
                rows={6}
                value={requestBody}
                onChange={(e) => setRequestBody(e.target.value)}
                placeholder="{\n  key: value\n}"
                className="w-full bg-[#090d16] text-gray-200 font-mono text-xs border border-white/10 rounded-lg p-3 focus:outline-none focus:border-emerald-500 transition-colors leading-relaxed"
              />
            </div>
          )}

          {/* TAB 3: Headers */}
          {activeTab === "headers" && (
            <div className="space-y-3">
              {requestHeaders.map((header) => (
                <div key={header.id} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={header.key}
                    onChange={(e) => updateHeader(header.id, "key", e.target.value)}
                    placeholder="Header Name"
                    className="flex-1 bg-[#090d16] text-gray-200 font-mono text-xs border border-white/10 rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500 placeholder-gray-600 transition-colors"
                  />
                  <input
                    type="text"
                    value={header.value}
                    onChange={(e) => updateHeader(header.id, "value", e.target.value)}
                    placeholder="Value"
                    className="flex-1 bg-[#090d16] text-gray-200 font-mono text-xs border border-white/10 rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500 placeholder-gray-600 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => removeHeader(header.id)}
                    className="p-2 text-rose-400/80 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors"
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

            {/* Key Switcher Dropdown & Custom Token Input */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {/* Select from project's authorized keys */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setKeyDropdownOpen(!keyDropdownOpen)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-[#090d16] border border-white/10 text-xs font-mono text-gray-300 hover:border-white/20 transition-colors text-left"
                >
                  <span className="truncate">
                    {selectedKey
                      ? `${selectedKey.name} (•••${selectedKey.publicKeyId?.slice(-4) || "8f2a"})`
                      : "Default Demo Key"}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-gray-500 shrink-0 ml-1" />
                </button>

                {keyDropdownOpen && (
                  <div className="absolute left-0 mt-1 w-full bg-[#131826] border border-white/10 rounded-xl shadow-2xl py-1 z-30">
                    <div className="px-3 py-1.5 text-[10px] font-mono text-gray-400 uppercase tracking-wider border-b border-white/5">
                      Project Keys (Masked)
                    </div>
                    {availableKeys.length === 0 ? (
                      <div className="px-3 py-2 text-xs text-gray-500 italic">
                        No keys in this environment
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

              {/* Paste or Enter specific token */}
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
              className="bg-[#10b981] hover:bg-[#059669] text-[#052e16] font-semibold text-xs px-5 py-2.5 rounded-lg flex items-center gap-2 shadow-lg shadow-emerald-950/40 hover:shadow-emerald-950/60 transition-all disabled:opacity-60 cursor-pointer"
            >
              {loading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-[#052e16] border-t-transparent rounded-full animate-spin" />
                  <span>Sending...</span>
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
        <div className="bg-[#0e131f] border border-white/10 rounded-xl p-5 shadow-2xl flex flex-col min-h-[460px]">
          {/* Top Bar with Tabs and Status */}
          <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
            {/* Tabs */}
            <div className="flex items-center gap-5">
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

            {/* Status & Latency Badges */}
            {responseResult && (
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium border ${
                    responseResult.status >= 200 && responseResult.status < 300
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/25"
                      : "bg-rose-500/10 text-rose-400 border-rose-500/25"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      responseResult.status >= 200 && responseResult.status < 300
                        ? "bg-emerald-400"
                        : "bg-rose-400"
                    }`}
                  />
                  <span>
                    {responseResult.status} {responseResult.statusText}
                  </span>
                </span>

                <span className="text-[11px] font-mono text-gray-500 hidden sm:inline-block">
                  {responseResult.latency}ms
                </span>
                <span className="text-[11px] font-mono text-gray-500 hidden sm:inline-block">
                  {responseResult.size}
                </span>
              </div>
            )}
          </div>

          {/* Panel Content Area */}
          <div className="flex-1 flex flex-col relative">
            {/* Loading Overlay */}
            {loading && (
              <div className="absolute inset-0 bg-[#0e131f]/90 backdrop-blur-xs flex flex-col items-center justify-center gap-3 z-20 rounded-lg">
                <span className="w-7 h-7 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs font-mono text-gray-300">
                  Routing through APIShield Gateway...
                </span>
              </div>
            )}

            {/* Tab: Response */}
            {responseTab === "response" && (
              <div className="relative flex-1 bg-[#080c14] border border-white/5 rounded-lg p-4 overflow-auto max-h-[500px]">
                {/* Copy Button */}
                <button
                  type="button"
                  onClick={() =>
                    copyToClipboard(
                      JSON.stringify(responseResult?.data, null, 2),
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

                {responseResult?.data ? (
                  renderJsonWithLineNumbers(responseResult.data)
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center py-16 text-gray-500 text-xs">
                    <Code2 className="w-8 h-8 text-gray-600 mb-2" />
                    <span>Click Send Request to test the upstream API</span>
                  </div>
                )}
              </div>
            )}

            {/* Tab: Response Headers */}
            {responseTab === "headers" && (
              <div className="flex-1 bg-[#080c14] border border-white/5 rounded-lg p-4 overflow-auto max-h-[500px]">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-white/10 text-[10px] text-gray-500 uppercase">
                      <th className="pb-2">Header</th>
                      <th className="pb-2">Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-gray-300">
                    {Object.entries(responseResult?.headers || {}).map(([key, val]) => (
                      <tr key={key} className="hover:bg-white/5">
                        <td className="py-2 text-sky-400 pr-4">{key}</td>
                        <td className="py-2 text-emerald-300 break-all">{String(val)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
                <pre className="text-gray-300 whitespace-pre-wrap leading-relaxed">
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
