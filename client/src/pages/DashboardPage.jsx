import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useOrg } from "../context/OrgContext";
import { useAuth } from "../context/AuthContext";
import teamsApi from "../api/teams";
import membersApi from "../api/members";
import auditLogsApi from "../api/auditLogs";
import analyticsApi from "../api/analytics";

import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";
import EmptyState from "../components/EmptyState";
import Badge from "../components/Badge";

import {
  Users,
  UserCheck,
  KeyRound,
  Activity,
  ArrowRight,
  FileText,
  ShieldCheck,
  Plus
} from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuth();
  const { activeOrg } = useOrg();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [teamCount, setTeamCount] = useState(0);
  const [memberCount, setMemberCount] = useState(0);
  const [analyticsOverview, setAnalyticsOverview] = useState(null);
  const [recentLogs, setRecentLogs] = useState([]);

  const loadDashboardData = async () => {
    if (!activeOrg) return;
    try {
      setLoading(true);
      setError("");

      const [teamsRes, membersRes, logsRes] = await Promise.all([
        teamsApi.getAll(activeOrg._id).catch(() => ({ data: { data: [] } })),
        membersApi.getAll(activeOrg._id).catch(() => ({ data: { data: [] } })),
        auditLogsApi.getAll(activeOrg._id, 1, 5).catch(() => ({ data: { data: { logs: [] } } })),
      ]);

      setTeamCount(teamsRes.data?.data?.length || 0);
      setMemberCount(membersRes.data?.data?.length || 0);
      setRecentLogs(logsRes.data?.data?.logs || []);

      try {
        const analyticsRes = await analyticsApi.getAnalytics(activeOrg._id);
        setAnalyticsOverview(analyticsRes.data?.data?.overview || null);
      } catch (err) {
        // Analytics requires OWNER or ADMIN role; graceful fallback for DEVELOPER role
        setAnalyticsOverview(null);
      }

    } catch (err) {
      setError("Failed to load dashboard statistics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [activeOrg]);

  if (!activeOrg) {
    return <EmptyState message="No active organization selected." />;
  }

  if (loading) {
    return <LoadingSpinner message="Loading dashboard statistics..." />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={loadDashboardData} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-[#161b22] border border-white/10 rounded-xl p-6 shadow-xl shadow-blue-950/10">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            Welcome back, {user?.name}
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Current Workspace: <span className="font-semibold text-blue-300 font-mono">{activeOrg.name}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <Link to={`/org/${activeOrg._id}/api-keys`} className="btn-primary text-xs">
            <KeyRound className="w-3.5 h-3.5" />
            Manage API Keys
          </Link>
          <Link to={`/org/${activeOrg._id}/teams`} className="btn-secondary text-xs">
            <Plus className="w-3.5 h-3.5" />
            New Team
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card bg-[#161b22] border-white/10 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-mono font-semibold text-gray-500 uppercase tracking-wider">Total Teams</p>
            <p className="text-2xl font-bold font-mono text-white mt-1">{teamCount}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-950/60 border border-blue-800/60 flex items-center justify-center text-blue-400">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="card bg-[#161b22] border-white/10 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-mono font-semibold text-gray-500 uppercase tracking-wider">Workspace Members</p>
            <p className="text-2xl font-bold font-mono text-white mt-1">{memberCount}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-950/60 border border-blue-800/60 flex items-center justify-center text-blue-400">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="card bg-[#161b22] border-white/10 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-mono font-semibold text-gray-500 uppercase tracking-wider">Total API Requests</p>
            <p className="text-2xl font-bold font-mono text-white mt-1">
              {analyticsOverview ? analyticsOverview.totalRequests.toLocaleString() : "N/A"}
            </p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-green-950/60 border border-green-800/60 flex items-center justify-center text-green-400">
            <Activity className="w-5 h-5" />
          </div>
        </div>

        <div className="card bg-[#161b22] border-white/10 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-mono font-semibold text-gray-500 uppercase tracking-wider">Avg Latency</p>
            <p className="text-2xl font-bold font-mono text-white mt-1">
              {analyticsOverview ? `${analyticsOverview.averageResponseTime} ms` : "N/A"}
            </p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-yellow-950/60 border border-yellow-800/60 flex items-center justify-center text-yellow-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card bg-[#161b22] border border-white/10 space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <h2 className="text-xs font-mono font-semibold text-white uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-400" />
              Recent Workspace Activity
            </h2>
            <Link to={`/org/${activeOrg._id}/audit-logs`} className="text-xs text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {recentLogs.length === 0 ? (
            <EmptyState message="No recent activity logged." />
          ) : (
            <div className="divide-y divide-white/5">
              {recentLogs.map((log) => (
                <div key={log._id} className="py-3 flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <Badge variant="info">{log.action}</Badge>
                      <span className="font-medium text-gray-300">by {log.actor?.name || "System"}</span>
                    </div>
                    <p className="text-gray-500 font-mono text-[11px]">
                      Entity: {log.entity?.type} ({log.entity?.name || log.entity?.id})
                    </p>
                  </div>
                  <span className="text-[11px] text-gray-500 font-mono">
                    {new Date(log.createdAt).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card bg-[#161b22] border border-white/10 space-y-4">
          <h2 className="text-xs font-mono font-semibold text-gray-400 uppercase tracking-wider border-b border-white/5 pb-3">
            Workspace Navigation
          </h2>
          <div className="space-y-2 text-xs">
            <Link
              to={`/org/${activeOrg._id}/api-keys`}
              className="flex items-center justify-between p-3 rounded-lg bg-[#1c2128] border border-white/5 hover:border-white/10 hover:bg-white/5 transition-colors font-medium text-gray-300 hover:text-white"
            >
              <div className="flex items-center gap-2.5">
                <KeyRound className="w-4 h-4 text-blue-400" />
                <span>API Keys & Credentials</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-gray-500" />
            </Link>

            <Link
              to={`/org/${activeOrg._id}/teams`}
              className="flex items-center justify-between p-3 rounded-lg bg-[#1c2128] border border-white/5 hover:border-white/10 hover:bg-white/5 transition-colors font-medium text-gray-300 hover:text-white"
            >
              <div className="flex items-center gap-2.5">
                <Users className="w-4 h-4 text-blue-400" />
                <span>Teams & Roles</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-gray-500" />
            </Link>

            <Link
              to={`/org/${activeOrg._id}/members`}
              className="flex items-center justify-between p-3 rounded-lg bg-[#1c2128] border border-white/5 hover:border-white/10 hover:bg-white/5 transition-colors font-medium text-gray-300 hover:text-white"
            >
              <div className="flex items-center gap-2.5">
                <UserCheck className="w-4 h-4 text-green-400" />
                <span>Workspace Members</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-gray-500" />
            </Link>

            <Link
              to={`/org/${activeOrg._id}/analytics`}
              className="flex items-center justify-between p-3 rounded-lg bg-[#1c2128] border border-white/5 hover:border-white/10 hover:bg-white/5 transition-colors font-medium text-gray-300 hover:text-white"
            >
              <div className="flex items-center gap-2.5">
                <Activity className="w-4 h-4 text-yellow-400" />
                <span>Traffic & Analytics</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-gray-500" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
