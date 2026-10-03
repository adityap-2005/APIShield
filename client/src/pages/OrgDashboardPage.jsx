import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { useOrg } from "../context/OrgContext";
import { useAuth } from "../context/AuthContext";
import projectsApi from "../api/projects";
import integrationsApi from "../api/integrations";
import apiKeysApi from "../api/apiKeys";
import auditLogsApi from "../api/auditLogs";
import analyticsApi from "../api/analytics";
import upstreamApisApi from "../api/upstreamApis";

import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";
import EmptyState from "../components/EmptyState";

import {
  KeyRound,
  Activity,
  ArrowRight,
  Blocks,
  Layers,
  TrendingUp,
  Play,
  BarChart3,
} from "lucide-react";

export default function OrgDashboardPage() {
  const { organizationId } = useParams();
  const { activeOrg, organizations, activeProject } = useOrg();
  const { user } = useAuth();

  const targetOrgId = organizationId || activeOrg?._id;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(activeProject?._id || "");
  const [integrations, setIntegrations] = useState([]);
  const [apiKeys, setApiKeys] = useState([]);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [recentLogs, setRecentLogs] = useState([]);
  const [upstreamApis, setUpstreamApis] = useState([]);

  const loadDashboardData = async () => {
    if (!targetOrgId) return;
    try {
      setLoading(true);
      setError("");

      const [projectsRes, logsRes] = await Promise.all([
        projectsApi.getAll(targetOrgId).catch(() => ({ data: { data: [] } })),
        auditLogsApi.getAll(targetOrgId, 1, 6).catch(() => ({ data: { data: { logs: [] } } })),
      ]);

      const projectList = projectsRes.data?.data || [];
      setProjects(projectList);
      setRecentLogs(logsRes.data?.data?.logs || []);

      const initialProjectId = selectedProjectId || projectList[0]?._id || "";
      setSelectedProjectId(initialProjectId);

      if (initialProjectId) {
        const [integrationsRes, keysRes, upstreamApisRes] = await Promise.all([
          integrationsApi.getAll(targetOrgId, initialProjectId).catch(() => ({ data: { data: [] } })),
          apiKeysApi.getAll(targetOrgId, initialProjectId).catch(() => ({ data: { data: [] } })),
          upstreamApisApi.getAll(targetOrgId, initialProjectId).catch(() => ({ data: { data: [] } })),
        ]);
        setIntegrations(integrationsRes.data?.data || []);
        setApiKeys(keysRes.data?.data || []);
        setUpstreamApis(upstreamApisRes.data?.data || []);
      }

      try {
        const analyticsRes = await analyticsApi.getAnalytics(targetOrgId);
        setAnalyticsData(analyticsRes.data?.data || null);
      } catch {
        setAnalyticsData(null);
      }
    } catch {
      setError("Failed to load workspace overview.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [targetOrgId]);

  if (!targetOrgId) {
    return <EmptyState message="No organization selected." />;
  }

  if (loading) {
    return <LoadingSpinner message="Loading workspace overview..." />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={loadDashboardData} />;
  }

  const activeKeysCount = apiKeys.filter((k) => k.status === "ACTIVE").length;
  const overview = analyticsData?.overview;
  const totalRequestsFormatted = overview?.totalRequests
    ? overview.totalRequests.toLocaleString()
    : "0";
  const integrationsCount = integrations.length;
  const userName = user?.name?.split(" ")[0] || "there";;

  // Clean fallback recent activities matching screenshot #1
  const displayActivities = recentLogs.map((log) => ({
    id: log._id,
    title: log.action || "Activity",
    time: new Date(log.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    desc: log.metadata?.keyName || log.target || "",
    type: log.action?.includes("key") ? "key" : "gateway",
  }));

  return (
    <div className="min-h-screen bg-[#070b12] text-gray-100 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* ── WELCOME BANNER (Matches Screen #1) ──────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>Welcome back, {userName}</span>
            <span className="text-xl">👋</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Here's what is happening with your projects, integrations and gateway traffic today.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <Link
            to={`/org/${targetOrgId}/upstream-apis/test`}
            className="bg-[#10b981] hover:bg-[#059669] text-[#052e16] font-semibold text-xs px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg shadow-emerald-950/40 transition-all"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Launch Gateway Test</span>
          </Link>
        </div>
      </div>

      {/* ── TOP 4 METRIC KPI CARDS (Matches Screen #1) ─────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Requests */}
        <div className="bg-[#0e131f] border border-white/10 rounded-xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-gray-400 uppercase tracking-wider">
              TOTAL REQUESTS
            </span>
            {overview?.totalRequests ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                <TrendingUp className="w-3 h-3" />
                <span>+12.5%</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-mono text-gray-400 bg-white/5 px-2 py-0.5 rounded-full border border-white/10">
                <span>No data</span>
              </span>
            )}
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-white tracking-tight">
              {totalRequestsFormatted}
            </span>
          </div>
          <p className="text-[11px] text-gray-500 mt-1 font-mono">Last 24 hours</p>
        </div>

        {/* Metric 2: Active API Keys */}
        <div className="bg-[#0e131f] border border-white/10 rounded-xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-gray-400 uppercase tracking-wider">
              ACTIVE API KEYS
            </span>
            {activeKeysCount > 0 ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>Active</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-mono text-gray-400 bg-white/5 px-2 py-0.5 rounded-full border border-white/10">
                <span>No keys yet</span>
              </span>
            )}
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-white tracking-tight">
              {activeKeysCount}
            </span>
          </div>
          <p className="text-[11px] text-gray-500 mt-1 font-mono">Across all environments</p>
        </div>

        {/* Metric 3: Integrations */}
        <div className="bg-[#0e131f] border border-white/10 rounded-xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-gray-400 uppercase tracking-wider">
              INTEGRATIONS
            </span>
            {integrationsCount > 0 ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-mono text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
                <Blocks className="w-3 h-3" />
                <span>Ready</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-mono text-gray-400 bg-white/5 px-2 py-0.5 rounded-full border border-white/10">
                <span>None yet</span>
              </span>
            )}
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-white tracking-tight">
              {integrationsCount}
            </span>
          </div>
          <p className="text-[11px] text-gray-500 mt-1 font-mono">Configured providers</p>
        </div>

        {/* Metric 4: Error Rate */}
        <div className="bg-[#0e131f] border border-white/10 rounded-xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-gray-400 uppercase tracking-wider">
              ERROR RATE
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-mono text-gray-400 bg-white/5 px-2 py-0.5 rounded-full border border-white/10">
              <span>No data</span>
            </span>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-gray-500 tracking-tight">
              —
            </span>
          </div>
          <p className="text-[11px] text-gray-500 mt-1 font-mono">
            {overview ? "Avg latency: —" : "No traffic recorded yet"}
          </p>
        </div>
      </div>

      {/* ── MAIN CONTENT TWO-COLUMN GRID (Matches Screen #1) ────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2/3 width): Recent Activity */}
        <div className="lg:col-span-2 bg-[#0e131f] border border-white/10 rounded-xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight">Recent Activity</h2>
              <p className="text-[11px] text-gray-400">Gateway traffic and security audit stream</p>
            </div>
            <Link
              to={`/org/${targetOrgId}/audit-logs`}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1"
            >
              <span>View Audit Logs</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {displayActivities.length === 0 ? (
              <EmptyState message="No activity yet. Actions will appear here as your team uses the gateway." />
            ) : (
              displayActivities.map((act) => (
                <div
                  key={act.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-[#090d16] border border-white/5 hover:border-white/10 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                      {act.type === "key" ? (
                        <KeyRound className="w-4 h-4" />
                      ) : act.type === "env" ? (
                        <Layers className="w-4 h-4" />
                      ) : (
                        <Activity className="w-4 h-4" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-white truncate">{act.title}</p>
                      <p className="text-[11px] text-gray-400 font-mono truncate">{act.desc}</p>
                    </div>
                  </div>
                  <span className="text-[11px] text-gray-500 font-mono shrink-0 ml-3">
                    {act.time}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column (1/3 width): Quick Actions */}
        <div className="bg-[#0e131f] border border-white/10 rounded-xl p-5 shadow-xl space-y-4">
          <div className="border-b border-white/10 pb-3">
            <h2 className="text-sm font-bold text-white tracking-tight">Quick Actions</h2>
            <p className="text-[11px] text-gray-400">Common gateway operations</p>
          </div>

          <div className="space-y-2.5">
            <Link
              to={`/org/${targetOrgId}/api-keys`}
              className="flex items-center justify-between p-3 rounded-lg bg-[#090d16] hover:bg-white/5 border border-white/5 hover:border-white/15 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-105 transition-transform">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-white group-hover:text-emerald-400 transition-colors">
                    Create Access Key
                  </p>
                  <p className="text-[10px] text-gray-500">Generate client token</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors" />
            </Link>

            <Link
              to={`/org/${targetOrgId}/integrations`}
              className="flex items-center justify-between p-3 rounded-lg bg-[#090d16] hover:bg-white/5 border border-white/5 hover:border-white/15 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 group-hover:scale-105 transition-transform">
                  <Blocks className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-white group-hover:text-emerald-400 transition-colors">
                    Add Integration
                  </p>
                  <p className="text-[10px] text-gray-500">Connect upstream provider</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors" />
            </Link>

            <Link
              to={`/org/${targetOrgId}/upstream-apis/test`}
              className="flex items-center justify-between p-3 rounded-lg bg-[#090d16] hover:bg-white/5 border border-white/5 hover:border-white/15 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
                  <Play className="w-4 h-4 fill-current" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-white group-hover:text-emerald-400 transition-colors">
                    Test in Gateway
                  </p>
                  <p className="text-[10px] text-gray-500">Simulate API request</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors" />
            </Link>

            <Link
              to={`/org/${targetOrgId}/analytics`}
              className="flex items-center justify-between p-3 rounded-lg bg-[#090d16] hover:bg-white/5 border border-white/5 hover:border-white/15 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-white group-hover:text-emerald-400 transition-colors">
                    View Analytics
                  </p>
                  <p className="text-[10px] text-gray-500">Traffic & latency breakdown</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
