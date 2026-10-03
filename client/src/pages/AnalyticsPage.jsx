/**
 * AnalyticsPage.jsx
 *
 * Real-time Gateway Analytics, Throughput, and Error breakdown.
 * Uses real backend data only.
 */

import { useState, useEffect, useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { useOrg } from "../context/OrgContext";
import analyticsApi from "../api/analytics";

import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";

import {
  BarChart3,
  TrendingUp,
  Clock,
  KeyRound,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  Activity,
  Layers,
  Server
} from "lucide-react";

export default function AnalyticsPage() {
  const { activeOrg } = useOrg();
  const params = useParams();
  const orgId = params.organizationId || activeOrg?._id;

  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadAnalytics = async () => {
    if (!orgId) return;
    try {
      setLoading(true);
      setError("");
      const response = await analyticsApi.getAnalytics(orgId);
      setAnalytics(response.data?.data || null);
    } catch (err) {
      if (err.response?.status === 403) {
        setError("API Analytics requires OWNER or ADMIN role in this organization.");
      } else {
        setAnalytics(null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, [orgId]);

  if (loading) {
    return <LoadingSpinner message="Loading analytics dashboard..." />;
  }

  const {
    overview,
    requestsOverTime = [],
    requestsByStatusCode = [],
    requestsByMethod = [],
  } = analytics || {};

  const totalRequests = overview?.totalRequests || 0;
  const successfulRequests = overview?.successfulRequests || 0;
  const failedRequests = overview?.failedRequests || 0;
  const avgLatency = overview?.averageResponseTime ? `${overview.averageResponseTime} ms` : "0 ms";

  const successRate = totalRequests > 0
    ? ((successfulRequests / totalRequests) * 100).toFixed(2) + "%"
    : "100%";
  const errorRate = totalRequests > 0
    ? ((failedRequests / totalRequests) * 100).toFixed(2) + "%"
    : "0.00%";

  // Real chart calculation
  const maxReqOverTime = Math.max(...requestsOverTime.map((d) => d.requests || 0), 1);

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
            <span className="text-gray-300">Analytics</span>
          </nav>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Analytics
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Real-time gateway metrics, throughput, latency, and error breakdown.
          </p>
        </div>
      </div>

      {error && <ErrorMessage message={error} onRetry={loadAnalytics} />}

      {/* ── TOP 4 KPI CARDS ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#0e131f] border border-white/10 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-gray-400 uppercase tracking-wider">
              TOTAL REQUESTS
            </span>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white mt-2">
            {totalRequests.toLocaleString()}
          </div>
          <div className="text-[11px] text-gray-500 font-mono mt-1">Total recorded volume</div>
        </div>

        <div className="bg-[#0e131f] border border-white/10 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-gray-400 uppercase tracking-wider">
              SUCCESS RATE
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400 mt-2">
            {successRate}
          </div>
          <div className="text-[11px] text-gray-500 font-mono mt-1">
            {successfulRequests.toLocaleString()} successful (2xx)
          </div>
        </div>

        <div className="bg-[#0e131f] border border-white/10 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-gray-400 uppercase tracking-wider">
              AVG LATENCY
            </span>
            <Clock className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white mt-2">
            {avgLatency}
          </div>
          <div className="text-[11px] text-gray-500 font-mono mt-1">Gateway to upstream</div>
        </div>

        <div className="bg-[#0e131f] border border-white/10 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-gray-400 uppercase tracking-wider">
              ERROR RATE
            </span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-rose-400 mt-2">
            {errorRate}
          </div>
          <div className="text-[11px] text-gray-500 font-mono mt-1">
            {failedRequests.toLocaleString()} failed (4xx/5xx)
          </div>
        </div>
      </div>

      {/* ── THROUGHPUT CHART & STATUS CODE BREAKDOWN ────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Real Requests Over Time */}
        <div className="lg:col-span-2 bg-[#0e131f] border border-white/10 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight">Throughput History</h2>
              <p className="text-[11px] text-gray-400 font-mono">Requests over recorded timeline</p>
            </div>
          </div>

          {requestsOverTime.length === 0 ? (
            <div className="h-44 flex flex-col items-center justify-center text-center text-xs text-gray-500 font-mono">
              <BarChart3 className="w-8 h-8 text-gray-600 mb-2" />
              <span>No request activity recorded yet</span>
              <span className="text-[10px] text-gray-600 mt-0.5">
                Timeline throughput will appear as gateway traffic is received
              </span>
            </div>
          ) : (
            <div className="h-44 flex items-end gap-2 pt-4">
              {requestsOverTime.map((d, idx) => {
                const heightPercent = Math.max(Math.round((d.requests / maxReqOverTime) * 100), 10);
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 group relative">
                    <div className="w-full bg-white/5 rounded-t overflow-hidden flex items-end h-32">
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className="w-full bg-emerald-500 group-hover:bg-emerald-400 transition-all rounded-t"
                      />
                    </div>
                    <span className="text-[9px] font-mono text-gray-400 truncate max-w-full">
                      {d.date?.slice(5) || d.date}
                    </span>

                    {/* Tooltip */}
                    <div className="absolute -top-7 px-2 py-1 bg-[#161b22] border border-white/10 rounded text-[10px] font-mono text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 shadow-lg">
                      {d.requests} requests on {d.date}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right 1 Col: Status Codes & Methods */}
        <div className="space-y-4">
          {/* Status Codes */}
          <div className="bg-[#0e131f] border border-white/10 rounded-xl p-5 shadow-sm space-y-3">
            <h2 className="text-xs font-mono font-semibold text-gray-400 uppercase tracking-wider">
              Status Codes Breakdown
            </h2>

            {requestsByStatusCode.length === 0 ? (
              <p className="text-xs text-gray-500 italic py-4 text-center font-mono">
                No status code data available
              </p>
            ) : (
              <div className="space-y-2">
                {requestsByStatusCode.map((sc, i) => {
                  const code = sc.statusCode || sc._id;
                  const isSuccess = code >= 200 && code < 300;
                  return (
                    <div key={i} className="flex items-center justify-between text-xs font-mono">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            isSuccess ? "bg-emerald-400" : "bg-rose-400"
                          }`}
                        />
                        <span className="text-white font-bold">{code}</span>
                      </div>
                      <span className="text-gray-300">{sc.requests?.toLocaleString() || 0} reqs</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Methods */}
          <div className="bg-[#0e131f] border border-white/10 rounded-xl p-5 shadow-sm space-y-3">
            <h2 className="text-xs font-mono font-semibold text-gray-400 uppercase tracking-wider">
              HTTP Methods
            </h2>

            {requestsByMethod.length === 0 ? (
              <p className="text-xs text-gray-500 italic py-2 text-center font-mono">
                No method data available
              </p>
            ) : (
              <div className="space-y-2">
                {requestsByMethod.map((m, i) => (
                  <div key={i} className="flex items-center justify-between text-xs font-mono">
                    <span className="px-2 py-0.5 rounded bg-white/5 text-gray-300 border border-white/10 font-bold">
                      {m.method}
                    </span>
                    <span className="text-gray-300">{m.requests?.toLocaleString() || 0} reqs</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
