/**
 * MyDashboardPage.jsx
 *
 * User's Personal Landing Dashboard (/dashboard).
 * Structure:
 * - Welcome Banner: User greeting & workspace overview
 * - Quick KPI Overview: Organizations, Projects, Pending Invitations, Account Status
 * - Your Organizations: Name, Plan, Created date, Role, Enter Workspace action
 * - Pending Invitations: Personal invitations with Accept/Reject actions
 */

import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useOrg } from "../context/OrgContext";
import invitationsApi from "../api/invitations";

import LoadingSpinner from "../components/LoadingSpinner";
import CreateOrgModal from "../components/CreateOrgModal";

import {
  Boxes,
  FolderKanban,
  Mail,
  UserCheck,
  Plus,
  ArrowRight,
  Check,
  X,
  ShieldCheck,
  ExternalLink,
  Layers,
  KeyRound
} from "lucide-react";

export default function MyDashboardPage() {
  const { user } = useAuth();
  const { organizations, projects, switchOrg, fetchOrganizations } = useOrg();
  const navigate = useNavigate();

  const [myInvitations, setMyInvitations] = useState([]);
  const [loadingInvites, setLoadingInvites] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const loadPendingInvitations = async () => {
    try {
      setLoadingInvites(true);
      const response = await invitationsApi.getMyInvitations();
      setMyInvitations(response.data?.data || []);
    } catch {
      setMyInvitations([]);
    } finally {
      setLoadingInvites(false);
    }
  };

  useEffect(() => {
    loadPendingInvitations();
  }, []);

  const handleEnterOrg = (org) => {
    switchOrg(org);
    navigate(`/org/${org._id}`);
  };

  const handleAcceptInvite = async (invitationId) => {
    try {
      await invitationsApi.accept(invitationId);
      loadPendingInvitations();
      fetchOrganizations();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to accept invitation.");
    }
  };

  const handleRejectInvite = async (invitationId) => {
    try {
      await invitationsApi.reject(invitationId);
      loadPendingInvitations();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to reject invitation.");
    }
  };

  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : "U";

  return (
    <div className="space-y-6">
      {/* ── WELCOME BANNER ─────────────────────────────────────────────────── */}
      <div className="bg-[#0e131f] border border-white/10 rounded-xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center text-lg font-bold font-mono shrink-0">
            {userInitial}
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              Welcome back, {user?.name || "Developer"} 👋
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Your APIShield personal workspace and organization credentials.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/settings/personal"
            className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-white font-medium text-xs transition-colors"
          >
            Account Settings
          </Link>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#10b981] hover:bg-emerald-400 text-black font-semibold text-xs transition-colors shadow-sm shadow-emerald-500/20"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Organization</span>
          </button>
        </div>
      </div>

      {/* ── QUICK STATS OVERVIEW ───────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-[#0e131f] border border-white/10 rounded-xl p-4">
          <div className="flex items-center justify-between text-gray-400 mb-1">
            <span className="text-[11px] font-mono uppercase tracking-wider">Organizations</span>
            <Boxes className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white tracking-tight">
            {organizations.length}
          </div>
          <div className="text-[10px] text-gray-500 font-mono mt-1">Active workspaces</div>
        </div>

        <div className="bg-[#0e131f] border border-white/10 rounded-xl p-4">
          <div className="flex items-center justify-between text-gray-400 mb-1">
            <span className="text-[11px] font-mono uppercase tracking-wider">Active Projects</span>
            <FolderKanban className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white tracking-tight">
            {projects.length}
          </div>
          <div className="text-[10px] text-gray-500 font-mono mt-1">Configured projects</div>
        </div>

        <div className="bg-[#0e131f] border border-white/10 rounded-xl p-4">
          <div className="flex items-center justify-between text-gray-400 mb-1">
            <span className="text-[11px] font-mono uppercase tracking-wider">Pending Invites</span>
            <Mail className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white tracking-tight">
            {myInvitations.length}
          </div>
          <div className="text-[10px] text-gray-500 font-mono mt-1">Workspace invitations</div>
        </div>

        <div className="bg-[#0e131f] border border-white/10 rounded-xl p-4">
          <div className="flex items-center justify-between text-gray-400 mb-1">
            <span className="text-[11px] font-mono uppercase tracking-wider">Identity Status</span>
            <ShieldCheck className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-sm font-bold font-mono text-emerald-400 mt-1">
            Verified
          </div>
          <div className="text-[10px] text-gray-500 font-mono mt-1 truncate">{user?.email}</div>
        </div>
      </div>

      {/* ── MAIN CONTENT GRID ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Your Organizations */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-mono font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
              <Boxes className="w-4 h-4 text-emerald-400" />
              Your Organizations ({organizations.length})
            </h2>
            <button
              onClick={() => setShowCreateModal(true)}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> New Organization
            </button>
          </div>

          {organizations.length === 0 ? (
            <div className="bg-[#0e131f] border border-white/10 rounded-xl p-8 text-center">
              <Boxes className="w-8 h-8 text-gray-500 mx-auto mb-3" />
              <p className="text-xs text-gray-400 mb-4">You are not a member of any organization yet.</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="btn-primary text-xs"
              >
                <Plus className="w-3.5 h-3.5" /> Create Organization
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {organizations.map((org) => {
                const isOwner = org.role === "OWNER" || !org.role;
                return (
                  <div
                    key={org._id}
                    className="bg-[#0e131f] border border-white/10 hover:border-emerald-500/40 rounded-xl p-4 transition-all flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold font-mono shrink-0">
                            {org.name ? org.name.charAt(0).toUpperCase() : "O"}
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-bold text-white text-xs truncate group-hover:text-emerald-400 transition-colors">
                              {org.name}
                            </h3>
                            <span className="text-[10px] text-gray-500 font-mono">
                              Role: {org.role || "Owner"}
                            </span>
                          </div>
                        </div>

                        <span className="bg-white/10 border border-white/5 text-gray-300 font-mono text-[9px] px-1.5 py-0.2 rounded font-semibold uppercase leading-tight">
                          FREE
                        </span>
                      </div>

                      {org.description && (
                        <p className="text-xs text-gray-400 mt-2 line-clamp-2 leading-relaxed">
                          {org.description}
                        </p>
                      )}
                    </div>

                    <div className="pt-3 mt-4 border-t border-white/5 flex items-center justify-between">
                      <span className="text-[10px] text-gray-500 font-mono">
                        {org.createdAt ? new Date(org.createdAt).toLocaleDateString() : "Active"}
                      </span>
                      <button
                        onClick={() => handleEnterOrg(org)}
                        className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 transition-colors"
                      >
                        Enter Workspace <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right 1 Col: Pending Invitations & Quick Links */}
        <div className="space-y-4">
          {/* Pending Invitations Box */}
          <div className="bg-[#0e131f] border border-white/10 rounded-xl p-4 space-y-3">
            <h2 className="text-xs font-mono font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2 border-b border-white/5 pb-2">
              <Mail className="w-4 h-4 text-amber-400" />
              Pending Invitations ({myInvitations.length})
            </h2>

            {loadingInvites ? (
              <LoadingSpinner message="Checking invites..." />
            ) : myInvitations.length === 0 ? (
              <p className="text-xs text-gray-500 italic text-center py-4">
                No pending invitations.
              </p>
            ) : (
              <div className="space-y-2.5">
                {myInvitations.map((inv) => (
                  <div
                    key={inv._id}
                    className="p-3 bg-[#070b12] rounded-lg border border-white/5 space-y-2 text-xs"
                  >
                    <div>
                      <span className="font-bold text-white block">
                        {inv.organizationId?.name || "Workspace Invitation"}
                      </span>
                      <span className="text-[10px] text-gray-400 font-mono mt-0.5 inline-block">
                        Invited Role: {inv.role}
                      </span>
                    </div>
                    <div className="flex items-center justify-end gap-2 pt-1 border-t border-white/5">
                      <button
                        onClick={() => handleAcceptInvite(inv._id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#10b981] hover:bg-emerald-400 text-black font-semibold text-[11px] transition-colors"
                      >
                        <Check className="w-3 h-3" /> Accept
                      </button>
                      <button
                        onClick={() => handleRejectInvite(inv._id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-white/10 hover:bg-white/5 text-gray-400 hover:text-white text-[11px] transition-colors"
                      >
                        <X className="w-3 h-3" /> Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Shortcuts */}
          <div className="bg-[#0e131f] border border-white/10 rounded-xl p-4 space-y-2">
            <h2 className="text-xs font-mono font-semibold text-gray-400 uppercase tracking-wider border-b border-white/5 pb-2">
              Personal Shortcuts
            </h2>
            <div className="space-y-1.5 text-xs">
              <Link
                to="/profile"
                className="flex items-center justify-between p-2 rounded-lg bg-[#070b12] border border-white/5 hover:border-white/10 text-gray-300 hover:text-white transition-colors"
              >
                <span>View Profile & Identifiers</span>
                <ArrowRight className="w-3.5 h-3.5 text-gray-500" />
              </Link>
              <Link
                to="/settings/personal"
                className="flex items-center justify-between p-2 rounded-lg bg-[#070b12] border border-white/5 hover:border-white/10 text-gray-300 hover:text-white transition-colors"
              >
                <span>Account & Security Settings</span>
                <ArrowRight className="w-3.5 h-3.5 text-gray-500" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      <CreateOrgModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} />
    </div>
  );
}
