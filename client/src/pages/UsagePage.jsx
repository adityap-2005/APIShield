/**
 * UsagePage.jsx
 *
 * Page displaying real API usage overview metrics and top endpoint stats.
 * Uses real backend data from analyticsApi.getAnalytics(activeOrg._id).
 */

import { useState, useEffect } from "react";
import { useOrg } from "../context/OrgContext";
import analyticsApi from "../api/analytics";

import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";
import EmptyState from "../components/EmptyState";
import Badge from "../components/Badge";

import { Activity, CheckCircle2, AlertTriangle, Clock, Layers } from "lucide-react";

export default function UsagePage() {
  const { activeOrg } = useOrg();

  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadUsageData = async () => {
    if (!activeOrg) return;
    try {
      setLoading(true);
      setError("");
      const response = await analyticsApi.getAnalytics(activeOrg._id);
      setAnalytics(response.data?.data);
    } catch (err) {
      if (err.response?.status === 403) {
        setError("API Usage statistics require OWNER or ADMIN role in this organization.");
      } else {
        setError(err.response?.data?.message || "Failed to load usage data.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsageData();
  }, [activeOrg]);

  if (!activeOrg) {
    return <EmptyState message="No active organization selected." />;
  }

  if (loading) {
    return <LoadingSpinner message="Fetching API usage statistics..." />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={loadUsageData} />;
  }

  const overview = analytics?.overview;
  const topEndpoints = analytics?.topEndpoints || [];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Activity className="w-5 h-5 text-yellow-400" />
            API Usage
          </h1>
          <p className="page-description">Traffic metrics and endpoint performance overview</p>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Total Requests</p>
            <p className="text-2xl font-bold text-gray-100 mt-1">
              {overview?.totalRequests ? overview.totalRequests.toLocaleString() : 0}
            </p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-900/30 border border-blue-800 flex items-center justify-center text-blue-400">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="card flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Successful (2xx)</p>
            <p className="text-2xl font-bold text-green-400 mt-1">
              {overview?.successfulRequests ? overview.successfulRequests.toLocaleString() : 0}
            </p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-green-900/30 border border-green-800 flex items-center justify-center text-green-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="card flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Failed (Non-2xx)</p>
            <p className="text-2xl font-bold text-red-400 mt-1">
              {overview?.failedRequests ? overview.failedRequests.toLocaleString() : 0}
            </p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-red-900/30 border border-red-800 flex items-center justify-center text-red-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="card flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Avg Latency</p>
            <p className="text-2xl font-bold text-gray-100 mt-1">
              {overview?.averageResponseTime || 0} ms
            </p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-yellow-900/30 border border-yellow-800 flex items-center justify-center text-yellow-400">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Top Endpoints Table */}
      <div className="space-y-4 pt-4">
        <h2 className="text-sm font-semibold text-gray-200 uppercase tracking-wider">
          Top Endpoints Requested
        </h2>

        {topEndpoints.length === 0 ? (
          <EmptyState message="No API usage data available." />
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>HTTP Method</th>
                  <th>Endpoint Path</th>
                  <th>Request Count</th>
                </tr>
              </thead>
              <tbody>
                {topEndpoints.map((item, idx) => (
                  <tr key={idx}>
                    <td>
                      <Badge variant={item.method === "GET" ? "info" : item.method === "POST" ? "success" : "warning"}>
                        {item.method}
                      </Badge>
                    </td>
                    <td className="font-mono text-xs text-gray-200">{item.endpoint}</td>
                    <td className="font-mono text-xs text-brand-400 font-bold">{item.requests.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
