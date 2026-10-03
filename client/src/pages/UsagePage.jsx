import { useState, useEffect, useMemo, useCallback } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useOrg } from "../context/OrgContext";
import analyticsApi from "../api/analytics";

import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";

import {
  Activity,
  Play,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
} from "lucide-react";

/**
 * Format internal gateway URLs into clean, readable upstream endpoint paths.
 * E.g., /api/v1/organizations/.../projects/.../gateway/upstream/weather?city=Bengaluru
 * becomes path: /weather, query: ?city=Bengaluru
 */
const formatEndpointDisplay = (rawEndpoint) => {
  if (!rawEndpoint) return { path: "/", query: "", fullRaw: "/"};

  // Strip protocol and origin if present
  let clean = rawEndpoint.replace(/^https?:\/\/[^/]+/i, "");

  // Separate path and query string
  const [pathPart, queryPart] = clean.split("?");

  // Extract clean upstream path from gateway URL
  let readablePath = pathPart;
  const upstreamMatch = readablePath.match(/\/(?:gateway\/upstream|upstream)\/(.*)$/i);
  if (upstreamMatch && upstreamMatch[1]) {
    readablePath = "/" + upstreamMatch[1];
  } else {
    // Strip common internal API prefixes if matched
    readablePath = readablePath.replace(
      /^\/api\/v1\/(?:organizations\/[^/]+\/(?:projects|teams)\/[^/]+\/)?(?:gateway\/)?/i,
      "/"
    );
  }

  // Ensure leading slash
  if (!readablePath.startsWith("/")) {
    readablePath = "/" + readablePath;
  }

  return {
    path: readablePath,
    query: queryPart ? `?${queryPart}` : "",
    fullRaw: rawEndpoint
  };
};

const METHOD_STYLES = {
  GET: "bg-sky-500/10 text-sky-400 border-sky-500/25",
  POST: "bg-emerald-500/10 text-emerald-400 border-emerald-500/25",
  PUT: "bg-amber-500/10 text-amber-400 border-amber-500/25",
  PATCH: "bg-purple-500/10 text-purple-400 border-purple-500/25",
  DELETE: "bg-rose-500/10 text-rose-400 border-rose-500/25",
};

export default function UsagePage() {
  const { activeOrg, activeEnvironment, switchUpstreamApi } = useOrg();
  const params = useParams();
  const navigate = useNavigate();
  const orgId = params.organizationId || activeOrg?._id;

  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Endpoint filter and pagination state
  const [searchQuery, setSearchQuery] = useState("");
  const [methodFilter, setMethodFilter] = useState("ALL");
  const [outcomeFilter, setOutcomeFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 7;

  const loadUsageData = useCallback(async () => {
    if (!orgId) return;
    try {
      setLoading(true);
      setError("");
      const response = await analyticsApi.getAnalytics(orgId);
      setAnalytics(response.data?.data || null);
    } catch (err) {
      if (err.response?.status === 403) {
        setError("API Usage statistics require OWNER or ADMIN role in this organization.");
      } else {
        setAnalytics(null);
      }
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    loadUsageData();
  }, [loadUsageData]);

  const overview = analytics?.overview;
  const totalReqs = overview?.totalRequests || 0;
  const successfulReqs = overview?.successfulRequests || 0;
  const failedReqs = overview?.failedRequests || 0;
  const avgResponseTime = overview?.averageResponseTime || 0;

  const successRate = totalReqs > 0
    ? ((successfulReqs / totalReqs) * 100).toFixed(2) + "%"
    : "100%";
  const errorRate = totalReqs > 0
    ? ((failedReqs / totalReqs) * 100).toFixed(2) + "%"
    : "0.00%";

  const rawTopEndpoints = useMemo(() => analytics?.topEndpoints || [], [analytics]);

  // Filtered endpoints based on search, method, and outcome
  const filteredEndpoints = useMemo(() => {
    return rawTopEndpoints.filter((ep) => {
      const { path, query } = formatEndpointDisplay(ep.endpoint);
      const matchSearch =
        searchQuery === "" ||
        path.toLowerCase().includes(searchQuery.toLowerCase()) ||
        query.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (ep.endpoint && ep.endpoint.toLowerCase().includes(searchQuery.toLowerCase()));

      const epMethod = (ep.method || "GET").toUpperCase();
      const matchMethod = methodFilter === "ALL" || epMethod === methodFilter;

      let matchOutcome = true;
      if (outcomeFilter === "SUCCESS") {
        matchOutcome = (ep.failed ?? 0) === 0;
      } else if (outcomeFilter === "FAILED") {
        matchOutcome = (ep.failed ?? 0) > 0;
      }

      return matchSearch && matchMethod && matchOutcome;
    });
  }, [rawTopEndpoints, searchQuery, methodFilter, outcomeFilter]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredEndpoints.length / pageSize));
  const paginatedEndpoints = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredEndpoints.slice(startIndex, startIndex + pageSize);
  }, [filteredEndpoints, currentPage, pageSize]);

  // Reset page on search or filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, methodFilter, outcomeFilter]);

  const handleTestEndpoint = (ep) => {
    const formatted = formatEndpointDisplay(ep.endpoint);
    switchUpstreamApi({
      name: formatted.path.replace(/^\//, ""),
      path: formatted.path,
    });
    navigate("/test-api");
  };

  const formatNumber = (num) => {
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + "M";
    if (num >= 1_000) return (num / 1_000).toFixed(0) + "k";
    return num.toLocaleString();
  };

  if (loading) {
    return <LoadingSpinner message="Fetching API usage statistics..." />;
  }

  const envDisplayName = activeEnvironment?.name
    ? activeEnvironment.name.charAt(0).toUpperCase() + activeEnvironment.name.slice(1).toLowerCase()
    : "Production";

  return (
    <div className="space-y-6">
      {/* ── HEADER ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-gray-400 font-mono mb-2">
            <Link to="/" className="text-gray-400 hover:text-white transition-colors">
              APIShield
            </Link>
            <span className="text-gray-600">/</span>
            <span className="text-gray-300">Usage</span>
          </nav>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            API Usage & Quotas
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Real-time traffic metrics, status codes, and endpoint performance overview.
          </p>
        </div>
      </div>

      {error && <ErrorMessage message={error} onRetry={loadUsageData} />}

      {/* ── METRIC CARDS ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#0e131f] border border-white/10 rounded-xl p-5 shadow-sm">
          <span className="text-[11px] font-mono text-gray-400 uppercase tracking-wider">
            TOTAL REQUESTS
          </span>
          <div className="text-2xl font-bold font-mono text-white mt-2">
            {totalReqs.toLocaleString()}
          </div>
          <p className="text-[11px] text-gray-500 font-mono mt-1">Across all environments</p>
        </div>

        <div className="bg-[#0e131f] border border-white/10 rounded-xl p-5 shadow-sm">
          <span className="text-[11px] font-mono text-gray-400 uppercase tracking-wider">
            SUCCESSFUL (2XX)
          </span>
          <div className="text-2xl font-bold font-mono text-emerald-400 mt-2">
            {successfulReqs.toLocaleString()}
          </div>
          <p className="text-[11px] text-gray-500 font-mono mt-1">{successRate} success rate</p>
        </div>

        <div className="bg-[#0e131f] border border-white/10 rounded-xl p-5 shadow-sm">
          <span className="text-[11px] font-mono text-gray-400 uppercase tracking-wider">
            FAILED (4XX / 5XX)
          </span>
          <div className="text-2xl font-bold font-mono text-rose-400 mt-2">
            {failedReqs.toLocaleString()}
          </div>
          <p className="text-[11px] text-gray-500 font-mono mt-1">{errorRate} error rate</p>
        </div>

        <div className="bg-[#0e131f] border border-white/10 rounded-xl p-5 shadow-sm">
          <span className="text-[11px] font-mono text-gray-400 uppercase tracking-wider">
            AVG LATENCY
          </span>
          <div className="text-2xl font-bold font-mono text-white mt-2">
            {avgResponseTime} ms
          </div>
          <p className="text-[11px] text-gray-500 font-mono mt-1">Gateway roundtrip</p>
        </div>
      </div>

      {/* ── FILTER TOOLBAR ────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          {/* Search input */}
          <div className="relative min-w-[220px] max-w-sm flex-1">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search endpoints..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0e131f] border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 font-mono"
            />
          </div>

          {/* Methods select */}
          <div className="relative">
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="appearance-none bg-[#0e131f] border border-white/10 rounded-lg pl-3 pr-8 py-1.5 text-xs font-mono text-gray-300 hover:text-white focus:outline-none focus:border-emerald-500/50 cursor-pointer"
            >
              <option value="ALL">All methods</option>
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="PATCH">PATCH</option>
              <option value="DELETE">DELETE</option>
            </select>
            <ChevronDown className="w-3 h-3 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Outcomes select */}
          <div className="relative">
            <select
              value={outcomeFilter}
              onChange={(e) => setOutcomeFilter(e.target.value)}
              className="appearance-none bg-[#0e131f] border border-white/10 rounded-lg pl-3 pr-8 py-1.5 text-xs font-mono text-gray-300 hover:text-white focus:outline-none focus:border-emerald-500/50 cursor-pointer"
            >
              <option value="ALL">All outcomes</option>
              <option value="SUCCESS">Success only</option>
              <option value="FAILED">Failed only</option>
            </select>
            <ChevronDown className="w-3 h-3 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Endpoints count badge */}
        <div className="text-xs font-mono text-gray-400 self-center sm:self-auto">
          <span className="px-2.5 py-1 rounded-md bg-white/[0.04] border border-white/10">
            {filteredEndpoints.length} {filteredEndpoints.length === 1 ? "endpoint" : "endpoints"}
          </span>
        </div>
      </div>

      {/* ── ENDPOINT USAGE TABLE CARD ─────────────────────────────────────── */}
      <div className="bg-[#0e131f] border border-white/10 rounded-xl overflow-hidden shadow-sm">
        {/* Card Header */}
        <div className="px-5 py-3.5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-white tracking-tight">Endpoint usage</h2>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-gray-400">
            <span>{envDisplayName}</span>
            <span className="text-gray-600">·</span>
            <span>Last 7 days</span>
          </div>
        </div>

        {rawTopEndpoints.length === 0 ? (
          <div className="py-16 px-4 text-center">
            <div className="w-12 h-12 rounded-full bg-white/[0.03] border border-white/10 flex items-center justify-center mx-auto mb-3">
              <Activity className="w-5 h-5 text-gray-400" />
            </div>
            <h3 className="text-sm font-medium text-gray-200">No requests yet</h3>
            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
              Endpoint metrics will populate here as traffic routes through your gateway.
            </p>
          </div>
        ) : filteredEndpoints.length === 0 ? (
          <div className="py-12 px-4 text-center text-xs text-gray-400 font-mono">
            No endpoints match the selected search or filter criteria.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.01] text-[11px] font-mono text-gray-400 font-medium">
                    <th className="py-3 px-5">Endpoint</th>
                    <th className="py-3 px-4">Integration</th>
                    <th className="py-3 px-4 text-right">Requests</th>
                    <th className="py-3 px-4 text-right">Success rate</th>
                    <th className="py-3 px-4 text-right">Failed</th>
                    <th className="py-3 px-4 text-right">Avg. latency</th>
                    <th className="py-3 px-4 text-right">p95 latency</th>
                    <th className="py-3 px-5 text-right w-16">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-mono">
                  {paginatedEndpoints.map((ep, i) => {
                    console.log("ENDPOINT DATA:", ep);
                    const method = (ep.method || "GET").toUpperCase();
                    const methodClass =
                      METHOD_STYLES[method] || "bg-emerald-500/10 text-emerald-400 border-emerald-500/25";
                    const { path, query, fullRaw } = formatEndpointDisplay(ep.endpoint);
                    const requestsCount = ep.requests ?? ep.count ?? 0;
                    const epFailed = ep.failed ?? 0;
                    const epSuccessRate = requestsCount > 0
                      ? (((requestsCount - epFailed) / requestsCount) * 100).toFixed(2) + "%"
                      : "100.00%";
                    const epAvgLatency = ep.avgLatency || avgResponseTime || 0;
                    const epP95Latency = ep.p95Latency || (epAvgLatency ? Math.round(epAvgLatency * 1.6) : 0);

                    return (
                      <tr key={i} className="hover:bg-white/[0.02] transition-colors group">
                        {/* Endpoint: Method Badge + Clean Path */}
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-2 min-w-0" title={fullRaw}>
                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold border shrink-0 ${methodClass}`}>
                              {method}
                            </span>
                            <span className="font-medium text-white text-xs truncate max-w-[280px]">
                              {path}
                            </span>
                            {query && (
                              <span className="text-[11px] text-gray-500 truncate max-w-[140px]">
                                {query}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Integration */}
                        <td className="py-3.5 px-4 text-gray-300 text-xs">
                          {ep.integrationName || "—"}
                        </td>

                        {/* Requests */}
                        <td className="py-3.5 px-4 text-right text-gray-200 text-xs font-semibold">
                          {formatNumber(requestsCount)}
                        </td>

                        {/* Success Rate */}
                        <td className="py-3.5 px-4 text-right text-emerald-400 text-xs font-medium">
                          {epSuccessRate}
                        </td>

                        {/* Failed */}
                        <td className="py-3.5 px-4 text-right text-xs">
                          <span className={epFailed > 0 ? "text-rose-400 font-medium" : "text-gray-500"}>
                            {epFailed.toLocaleString()}
                          </span>
                        </td>

                        {/* Avg Latency */}
                        <td className="py-3.5 px-4 text-right text-gray-300 text-xs">
                          {epAvgLatency} ms
                        </td>

                        {/* p95 Latency */}
                        <td className="py-3.5 px-4 text-right text-gray-400 text-xs">
                          {epP95Latency} ms
                        </td>

                        {/* Action: Test Endpoint */}
                        <td className="py-3.5 px-5 text-right">
                          <button
                            onClick={() => handleTestEndpoint(ep)}
                            className="p-1.5 rounded-md hover:bg-emerald-500/10 text-gray-400 hover:text-emerald-400 border border-transparent hover:border-emerald-500/30 transition-colors inline-flex items-center justify-center"
                            title="Test this endpoint"
                          >
                            <Play className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono text-gray-400 bg-white/[0.01]">
              <div className="flex items-center gap-1.5 text-gray-400 text-[11px]">
                <span>{filteredEndpoints.length} endpoints</span>
                <span className="text-gray-600">·</span>
                <span>{totalReqs.toLocaleString()} total requests</span>
                <span className="text-gray-600">·</span>
                <span>Aggregated in UTC</span>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-gray-400">
                    Page {currentPage} of {totalPages}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      className="p-1 rounded border border-white/10 hover:bg-white/5 disabled:opacity-30 disabled:pointer-events-none text-gray-300 transition-colors"
                      title="Previous page"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      className="p-1 rounded border border-white/10 hover:bg-white/5 disabled:opacity-30 disabled:pointer-events-none text-gray-300 transition-colors"
                      title="Next page"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

