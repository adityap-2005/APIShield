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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-[#161b22] border border-[#30363d] rounded-xl p-6">
        <div>
          <h1 className="text-xl font-bold text-[#f0f6fc] flex items-center gap-2">
            Welcome back, {user?.name} 👋
          </h1>
          <p className="text-xs text-[#8b949e] mt-1">
            Current Organization: <span className="font-semibold text-[#58a6ff]">{activeOrg.name}</span>
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
        <div className="card flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-[#8b949e] uppercase tracking-wider">Total Teams</p>
            <p className="text-2xl font-bold text-[#f0f6fc] mt-1">{teamCount}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-950/60 border border-blue-800/80 flex items-center justify-center text-blue-400">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="card flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-[#8b949e] uppercase tracking-wider">Org Members</p>
            <p className="text-2xl font-bold text-[#f0f6fc] mt-1">{memberCount}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-purple-950/60 border border-purple-800/80 flex items-center justify-center text-purple-400">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="card flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-[#8b949e] uppercase tracking-wider">Total API Requests</p>
            <p className="text-2xl font-bold text-[#f0f6fc] mt-1">
              {analyticsOverview ? analyticsOverview.totalRequests.toLocaleString() : "N/A"}
            </p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-green-950/60 border border-green-800/80 flex items-center justify-center text-green-400">
            <Activity className="w-5 h-5" />
          </div>
        </div>

        <div className="card flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-[#8b949e] uppercase tracking-wider">Avg Latency</p>
            <p className="text-2xl font-bold text-[#f0f6fc] mt-1">
              {analyticsOverview ? `${analyticsOverview.averageResponseTime} ms` : "N/A"}
            </p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-yellow-950/60 border border-yellow-800/80 flex items-center justify-center text-yellow-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card space-y-4">
          <div className="flex items-center justify-between border-b border-[#30363d] pb-3">
            <h2 className="text-xs font-bold text-[#f0f6fc] uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#58a6ff]" />
              Recent Organization Activity
            </h2>
            <Link to={`/org/${activeOrg._id}/audit-logs`} className="text-xs text-[#58a6ff] hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {recentLogs.length === 0 ? (
            <EmptyState message="No recent activity logged." />
          ) : (
            <div className="divide-y divide-[#30363d]/60">
              {recentLogs.map((log) => (
                <div key={log._id} className="py-3 flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <Badge variant="info">{log.action}</Badge>
                      <span className="font-medium text-[#c9d1d9]">by {log.actor?.name || "System"}</span>
                    </div>
                    <p className="text-[#8b949e] font-mono text-[11px]">
                      Entity: {log.entity?.type} ({log.entity?.name || log.entity?.id})
                    </p>
                  </div>
                  <span className="text-[11px] text-[#8b949e] font-mono">
                    {new Date(log.createdAt).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card space-y-4">
          <h2 className="text-xs font-bold text-[#8b949e] uppercase tracking-wider border-b border-[#30363d] pb-3">
            Quick Navigation
          </h2>
          <div className="space-y-2 text-xs">
            <Link
              to={`/org/${activeOrg._id}/api-keys`}
              className="flex items-center justify-between p-3 rounded-md bg-[#0d1117] border border-[#30363d] hover:bg-[#21262d] transition-colors font-medium text-[#c9d1d9]"
            >
              <div className="flex items-center gap-2.5">
                <KeyRound className="w-4 h-4 text-[#58a6ff]" />
                <span>API Keys & Credentials</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-[#8b949e]" />
            </Link>

            <Link
              to={`/org/${activeOrg._id}/teams`}
              className="flex items-center justify-between p-3 rounded-md bg-[#0d1117] border border-[#30363d] hover:bg-[#21262d] transition-colors font-medium text-[#c9d1d9]"
            >
              <div className="flex items-center gap-2.5">
                <Users className="w-4 h-4 text-purple-400" />
                <span>Teams & Roles</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-[#8b949e]" />
            </Link>

            <Link
              to={`/org/${activeOrg._id}/members`}
              className="flex items-center justify-between p-3 rounded-md bg-[#0d1117] border border-[#30363d] hover:bg-[#21262d] transition-colors font-medium text-[#c9d1d9]"
            >
              <div className="flex items-center gap-2.5">
                <UserCheck className="w-4 h-4 text-green-400" />
                <span>Organization Members</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-[#8b949e]" />
            </Link>

            <Link
              to={`/org/${activeOrg._id}/analytics`}
              className="flex items-center justify-between p-3 rounded-md bg-[#0d1117] border border-[#30363d] hover:bg-[#21262d] transition-colors font-medium text-[#c9d1d9]"
            >
              <div className="flex items-center gap-2.5">
                <Activity className="w-4 h-4 text-yellow-400" />
                <span>Traffic & Analytics</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-[#8b949e]" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
