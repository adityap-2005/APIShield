/**
 * AnalyticsPage.jsx
 *
 * Full analytics dashboard using exact fields returned by backend GET /organizations/:orgId/analytics:
 * - overview (totalRequests, successfulRequests, failedRequests, averageResponseTime)
 * - requestsOverTime
 * - requestsByApiKey
 * - requestsByTeam
 * - requestsByMethod
 * - requestsByEnvironment
 * - requestsByStatusCode
 * - topEndpoints
 */

import { useState, useEffect } from "react";
import { useOrg } from "../context/OrgContext";
import analyticsApi from "../api/analytics";

import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";
import EmptyState from "../components/EmptyState";
import Badge from "../components/Badge";

import { BarChart3, TrendingUp, Key, Users, Globe, Code, FileText, Activity } from "lucide-react";

export default function AnalyticsPage() {
  const { activeOrg } = useOrg();

  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadAnalytics = async () => {
    if (!activeOrg) return;
    try {
      setLoading(true);
      setError("");
      const response = await analyticsApi.getAnalytics(activeOrg._id);
      setAnalytics(response.data?.data);
    } catch (err) {
      if (err.response?.status === 403) {
        setError("Analytics access requires OWNER or ADMIN role in this organization.");
      } else {
        setError(err.response?.data?.message || "Failed to load analytics.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, [activeOrg]);

  if (!activeOrg) {
    return <EmptyState message="No active organization selected." />;
  }

  if (loading) {
    return <LoadingSpinner message="Loading analytics dashboard..." />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={loadAnalytics} />;
  }

  const {
    overview,
    requestsOverTime = [],
    requestsByApiKey = [],
    requestsByTeam = [],
    requestsByMethod = [],
    requestsByEnvironment = [],
    requestsByStatusCode = [],
    topEndpoints = []
  } = analytics || {};

  const totalReqs = overview?.totalRequests || 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-400" />
            Analytics Dashboard
          </h1>
          <p className="page-description">Deep dive into API requests, status codes, environments, and usage breakdown</p>
        </div>
      </div>

      {totalReqs === 0 ? (
        <EmptyState
          message="No gateway traffic yet. Requests routed through APIShield will appear here."
        />
      ) : (
        <>
          {/* 1. Overview Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card bg-[#161b22] border-white/10">
              <p className="text-[10px] font-mono font-semibold text-gray-500 uppercase tracking-wider">Total Requests</p>
              <p className="text-2xl font-bold font-mono text-white mt-1">{totalReqs.toLocaleString()}</p>
            </div>
            <div className="card bg-[#161b22] border-white/10">
              <p className="text-[10px] font-mono font-semibold text-gray-500 uppercase tracking-wider">Successful Requests</p>
              <p className="text-2xl font-bold font-mono text-green-400 mt-1">{(overview?.successfulRequests || 0).toLocaleString()}</p>
            </div>
            <div className="card bg-[#161b22] border-white/10">
              <p className="text-[10px] font-mono font-semibold text-gray-500 uppercase tracking-wider">Failed Requests</p>
              <p className="text-2xl font-bold font-mono text-red-400 mt-1">{(overview?.failedRequests || 0).toLocaleString()}</p>
            </div>
            <div className="card bg-[#161b22] border-white/10">
              <p className="text-[10px] font-mono font-semibold text-gray-500 uppercase tracking-wider">Avg Latency</p>
              <p className="text-2xl font-bold font-mono text-yellow-400 mt-1">{overview?.averageResponseTime || 0} ms</p>
            </div>
          </div>

          {/* 2. Requests Over Time */}
          <div className="card bg-[#161b22] border border-white/10 space-y-4">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2 border-b border-white/5 pb-3">
              <TrendingUp className="w-4 h-4 text-blue-400" />
              Requests Over Time
            </h2>
            {requestsOverTime.length === 0 ? (
              <p className="text-xs text-gray-500 py-4 italic">No timeline data available.</p>
            ) : (
              <div className="space-y-2.5">
                {requestsOverTime.map((item) => {
                  const pct = totalReqs > 0 ? Math.round((item.requests / totalReqs) * 100) : 0;
                  return (
                    <div key={item.date} className="space-y-1">
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-gray-300">{item.date}</span>
                        <span className="text-blue-300">{item.requests} requests ({pct}%)</span>
                      </div>
                      <div className="w-full bg-[#1c2128] rounded-full h-2 overflow-hidden border border-white/5">
                        <div className="bg-[#2f81f7] h-full rounded-full transition-all" style={{ width: `${Math.max(pct, 2)}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Grid: By API Key & By Team */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 3. Requests by API Key */}
            <div className="card bg-[#161b22] border border-white/10 space-y-4">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2 border-b border-white/5 pb-3">
                <Key className="w-4 h-4 text-blue-400" />
                Requests by API Key
              </h2>
              {requestsByApiKey.length === 0 ? (
                <p className="text-xs text-gray-500 py-4 italic">No API Key request data available.</p>
              ) : (
                <div className="divide-y divide-white/5">
                  {requestsByApiKey.map((item, idx) => (
                    <div key={item.apiKeyId || idx} className="py-2.5 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-semibold text-white">{item.name || "Access Key"}</div>
                      </div>
                      <div className="font-mono text-blue-300 font-bold">{item.requests} reqs</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 4. Requests by Team */}
            <div className="card bg-[#161b22] border border-white/10 space-y-4">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2 border-b border-white/5 pb-3">
                <Users className="w-4 h-4 text-blue-400" />
                Requests by Team
              </h2>
              {requestsByTeam.length === 0 ? (
                <p className="text-xs text-gray-500 py-4 italic">No Team request data available.</p>
              ) : (
                <div className="divide-y divide-white/5">
                  {requestsByTeam.map((item, idx) => (
                    <div key={item.teamId || idx} className="py-2.5 flex items-center justify-between text-xs">
                      <span className="font-semibold text-white">{item.name}</span>
                      <span className="font-mono text-blue-300 font-bold">{item.requests} reqs</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Grid: Method, Environment, Status Code */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 5. Requests by HTTP Method */}
            <div className="card bg-[#161b22] border border-white/10 space-y-4">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2 border-b border-white/5 pb-3">
                <Code className="w-4 h-4 text-green-400" />
                By HTTP Method
              </h2>
              {requestsByMethod.length === 0 ? (
                <p className="text-xs text-gray-500 py-2 italic">No method data.</p>
              ) : (
                <div className="space-y-2">
                  {requestsByMethod.map((item) => (
                    <div key={item.method} className="flex items-center justify-between text-xs">
                      <Badge variant="info">{item.method}</Badge>
                      <span className="font-mono text-gray-300 font-semibold">{item.requests} reqs</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 6. Requests by Environment */}
            <div className="card bg-[#161b22] border border-white/10 space-y-4">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2 border-b border-white/5 pb-3">
                <Globe className="w-4 h-4 text-yellow-400" />
                By Environment
              </h2>
              {requestsByEnvironment.length === 0 ? (
                <p className="text-xs text-gray-500 py-2 italic">No environment data.</p>
              ) : (
                <div className="space-y-2">
                  {requestsByEnvironment.map((item, idx) => (
                    <div key={item.name || item.environmentId || idx} className="flex items-center justify-between text-xs">
                      <Badge variant="purple">{item.name || "Environment"}</Badge>
                      <span className="font-mono text-gray-300 font-semibold">{item.requests} reqs</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 7. Status Codes */}
            <div className="card bg-[#161b22] border border-white/10 space-y-4">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2 border-b border-white/5 pb-3">
                <FileText className="w-4 h-4 text-red-400" />
                By Status Code
              </h2>
              {requestsByStatusCode.length === 0 ? (
                <p className="text-xs text-gray-500 py-2 italic">No status code data.</p>
              ) : (
                <div className="space-y-2">
                  {requestsByStatusCode.map((item) => (
                    <div key={item.statusCode} className="flex items-center justify-between text-xs">
                      <Badge variant={item.statusCode >= 200 && item.statusCode < 300 ? "success" : "danger"}>
                        {item.statusCode}
                      </Badge>
                      <span className="font-mono text-gray-300 font-semibold">{item.requests} reqs</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 8. Top Endpoints */}
          <div className="card bg-[#161b22] border border-white/10 space-y-4">
            <h2 className="text-xs font-mono font-semibold text-gray-400 uppercase tracking-wider border-b border-white/5 pb-3">
              Top Requested Endpoints
            </h2>
            {topEndpoints.length === 0 ? (
              <EmptyState message="No endpoint analytics recorded." />
            ) : (
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Method</th>
                      <th>Endpoint Path</th>
                      <th>Total Requests</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topEndpoints.map((ep, idx) => (
                      <tr key={idx}>
                        <td>
                          <Badge variant={ep.method === "GET" ? "info" : "success"}>{ep.method}</Badge>
                        </td>
                        <td className="font-mono text-xs text-gray-200">{ep.endpoint}</td>
                        <td className="font-mono text-xs text-blue-300 font-bold">{ep.requests}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
