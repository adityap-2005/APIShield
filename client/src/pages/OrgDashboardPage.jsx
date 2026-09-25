/**
 * OrgDashboardPage.jsx
 *
 * Developer Overview Dashboard (/org/:organizationId).
 *
 * Sections:
 * - Organization & Team context
 * - Active environments indicators
 * - Overview metrics (Teams, Active Environments, Access Keys, Gateway Traffic)
 * - Recent Gateway Activity (top endpoints, latency from real backend analytics)
 * - Recent Security Activity (audit logs: key rotation, creation, member actions)
 * - Quick Actions (Create Access Key, Add Integration, View Usage)
 */

import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { useOrg } from "../context/OrgContext";
import teamsApi from "../api/teams";
import membersApi from "../api/members";
import integrationsApi from "../api/integrations";
import apiKeysApi from "../api/apiKeys";
import auditLogsApi from "../api/auditLogs";
import analyticsApi from "../api/analytics";

import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";
import EmptyState from "../components/EmptyState";
import Badge from "../components/Badge";

import {
  Building2,
  Users,
  UserCheck,
  KeyRound,
  Activity,
  ArrowRight,
  FileText,
  ShieldCheck,
  Plus,
  Blocks,
  Globe,
  Layers,
  Clock,
  CheckCircle2,
  Zap
} from "lucide-react";

export default function OrgDashboardPage() {
  const { organizationId } = useParams();
  const { activeOrg, organizations } = useOrg();

  const targetOrgId = organizationId || activeOrg?._id;
  const currentOrg = organizations.find((o) => o._id === targetOrgId) || activeOrg;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [teams, setTeams] = useState([]);
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [memberCount, setMemberCount] = useState(0);
  const [integrations, setIntegrations] = useState([]);
  const [apiKeys, setApiKeys] = useState([]);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [recentLogs, setRecentLogs] = useState([]);

  const loadDashboardData = async () => {
    if (!targetOrgId) return;
    try {
      setLoading(true);
      setError("");

      const [teamsRes, membersRes, logsRes] = await Promise.all([
        teamsApi.getAll(targetOrgId).catch(() => ({ data: { data: [] } })),
        membersApi.getAll(targetOrgId).catch(() => ({ data: { data: [] } })),
        auditLogsApi.getAll(targetOrgId, 1, 6).catch(() => ({ data: { data: { logs: [] } } })),
      ]);

      const teamList = teamsRes.data?.data || [];
      setTeams(teamList);
      setMemberCount(membersRes.data?.data?.length || 0);
      setRecentLogs(logsRes.data?.data?.logs || []);

      const initialTeamId = teamList[0]?._id || "";
      setSelectedTeamId(initialTeamId);

      if (initialTeamId) {
        const [integrationsRes, keysRes] = await Promise.all([
          integrationsApi.getAll(targetOrgId, initialTeamId).catch(() => ({ data: { data: [] } })),
          apiKeysApi.getAll(targetOrgId, initialTeamId).catch(() => ({ data: { data: [] } })),
        ]);
        setIntegrations(integrationsRes.data?.data || []);
        setApiKeys(keysRes.data?.data || []);
      }

      try {
        const analyticsRes = await analyticsApi.getAnalytics(targetOrgId);
        setAnalyticsData(analyticsRes.data?.data || null);
      } catch (err) {
        setAnalyticsData(null);
      }
    } catch (err) {
      setError("Failed to load workspace overview.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [targetOrgId]);

  // Load team-specific integrations and keys when user switches team in context
  const handleTeamChange = async (teamId) => {
    setSelectedTeamId(teamId);
    if (!teamId) return;
    try {
      const [integrationsRes, keysRes] = await Promise.all([
        integrationsApi.getAll(targetOrgId, teamId).catch(() => ({ data: { data: [] } })),
        apiKeysApi.getAll(targetOrgId, teamId).catch(() => ({ data: { data: [] } })),
      ]);
      setIntegrations(integrationsRes.data?.data || []);
      setApiKeys(keysRes.data?.data || []);
    } catch (err) {
      console.error("Failed to load team data:", err);
    }
  };

  if (!targetOrgId) {
    return <EmptyState message="No organization selected." />;
  }

  if (loading) {
    return <LoadingSpinner message="Loading workspace overview..." />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={loadDashboardData} />;
  }

  // Active environments under current team
  const environmentNames = new Set();
  integrations.forEach((item) => {
    (item.environments || []).forEach((env) => {
      if (env.status === "ACTIVE") environmentNames.add(env.name);
    });
  });

  const activeEnvs = Array.from(environmentNames);
  const activeKeysCount = apiKeys.filter((k) => k.status === "ACTIVE").length;
  const overview = analyticsData?.overview;
  const topEndpoints = analyticsData?.topEndpoints || [];

  return (
    <div className="space-y-6">
      {/* Workspace Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 card bg-[#161b22] border border-white/10 p-6 rounded-xl shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-400" />
            <h1 className="text-xl font-bold text-white tracking-tight">{currentOrg?.name}</h1>
          </div>
          <p className="text-xs text-gray-500 font-mono mt-1">slug: {currentOrg?.slug}</p>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            to={`/org/${targetOrgId}/api-keys?teamId=${selectedTeamId}&action=create`}
            className="btn-primary text-xs flex items-center gap-1.5"
          >
            <KeyRound className="w-3.5 h-3.5" />
            Create Access Key
          </Link>
          <Link
            to={`/org/${targetOrgId}/integrations?teamId=${selectedTeamId}&action=create`}
            className="btn-secondary text-xs flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Integration
          </Link>
          <Link
            to={`/org/${targetOrgId}/usage`}
            className="btn-secondary text-xs flex items-center gap-1.5"
          >
            <Activity className="w-3.5 h-3.5" />
            View Usage
          </Link>
        </div>
      </div>

      {/* Team Context & Active Environments Bar */}
      {teams.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#161b22] border border-white/10 p-4 rounded-xl">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono font-semibold text-gray-400 uppercase tracking-wider">
              Working Team:
            </span>
            <select
              className="input max-w-xs text-xs py-1"
              value={selectedTeamId}
              onChange={(e) => handleTeamChange(e.target.value)}
            >
              {teams.map((team) => (
                <option key={team._id} value={team._id}>
                  {team.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono text-gray-500">Active Environments:</span>
            {activeEnvs.length === 0 ? (
              <span className="text-[11px] font-mono text-gray-500">None configured</span>
            ) : (
              activeEnvs.map((envName) => (
                <span
                  key={envName}
                  className="px-2 py-0.5 rounded text-[11px] font-mono bg-blue-950/60 border border-blue-800/40 text-blue-300"
                >
                  {envName}
                </span>
              ))
            )}
          </div>
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card bg-[#161b22] border-white/10 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-mono font-semibold text-gray-500 uppercase tracking-wider">
              Active Integrations
            </p>
            <p className="text-2xl font-bold font-mono text-white mt-1">{integrations.length}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-950/60 border border-blue-800/60 flex items-center justify-center text-blue-400">
            <Blocks className="w-5 h-5" />
          </div>
        </div>

        <div className="card bg-[#161b22] border-white/10 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-mono font-semibold text-gray-500 uppercase tracking-wider">
              Active Access Keys
            </p>
            <p className="text-2xl font-bold font-mono text-green-400 mt-1">{activeKeysCount}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-green-950/60 border border-green-800/60 flex items-center justify-center text-green-400">
            <KeyRound className="w-5 h-5" />
          </div>
        </div>

        <div className="card bg-[#161b22] border-white/10 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-mono font-semibold text-gray-500 uppercase tracking-wider">
              Total Gateway Traffic
            </p>
            <p className="text-2xl font-bold font-mono text-white mt-1">
              {overview?.totalRequests ? overview.totalRequests.toLocaleString() : 0}
            </p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-950/60 border border-blue-800/60 flex items-center justify-center text-blue-400">
            <Activity className="w-5 h-5" />
          </div>
        </div>

        <div className="card bg-[#161b22] border-white/10 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-mono font-semibold text-gray-500 uppercase tracking-wider">
              Avg Latency
            </p>
            <p className="text-2xl font-bold font-mono text-yellow-400 mt-1">
              {overview?.averageResponseTime || 0} ms
            </p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-yellow-950/60 border border-yellow-800/60 flex items-center justify-center text-yellow-400">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Grid: Gateway Activity & Security Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Recent Gateway Activity */}
        <div className="card bg-[#161b22] border border-white/10 space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <h2 className="text-xs font-mono font-semibold text-white uppercase tracking-wider flex items-center gap-2">
              <Zap className="w-4 h-4 text-blue-400" />
              Recent Gateway Activity
            </h2>
            <Link
              to={`/org/${targetOrgId}/usage`}
              className="text-xs text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
            >
              View usage <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {topEndpoints.length === 0 ? (
            <p className="text-xs text-gray-500 py-6 italic text-center font-mono">
              No gateway traffic recorded yet. Requests made through the APIShield Gateway will appear here.
            </p>
          ) : (
            <div className="divide-y divide-white/5">
              {topEndpoints.slice(0, 5).map((endpoint, idx) => (
                <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 truncate max-w-sm">
                    <Badge variant={endpoint.method === "GET" ? "info" : "success"}>
                      {endpoint.method}
                    </Badge>
                    <code className="text-blue-300 font-mono text-[11px] truncate">
                      {endpoint.path}
                    </code>
                  </div>
                  <span className="font-mono text-gray-400 text-xs shrink-0">
                    {endpoint.count} {endpoint.count === 1 ? "call" : "calls"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 2. Recent Security Activity (Audit Logs) */}
        <div className="card bg-[#161b22] border border-white/10 space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <h2 className="text-xs font-mono font-semibold text-white uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-400" />
              Recent Security Activity
            </h2>
            <Link
              to={`/org/${targetOrgId}/audit-logs`}
              className="text-xs text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
            >
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {recentLogs.length === 0 ? (
            <p className="text-xs text-gray-500 py-6 italic text-center font-mono">
              No recent security activity logged.
            </p>
          ) : (
            <div className="divide-y divide-white/5">
              {recentLogs.map((log) => (
                <div key={log._id} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <Badge variant="info">{log.action}</Badge>
                      <span className="font-medium text-gray-300">{log.actor?.name || "System"}</span>
                    </div>
                    <p className="text-gray-500 font-mono text-[11px]">
                      {log.entity?.type}: {log.entity?.name || log.entity?.id}
                    </p>
                  </div>
                  <span className="text-[11px] text-gray-500 font-mono whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
