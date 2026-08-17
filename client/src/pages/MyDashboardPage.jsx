/**
 * MyDashboardPage.jsx
 *
 * User's Personal Landing Dashboard (/dashboard).
 * Displays personal overview:
 * - User greeting & profile info
 * - Real organizations the user belongs to (with enter workspace buttons)
 * - Pending organization invitations sent to the user (with accept/reject actions)
 * - Quick personal actions
 */

import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useOrg } from "../context/OrgContext";
import invitationsApi from "../api/invitations";

import LoadingSpinner from "../components/LoadingSpinner";
import EmptyState from "../components/EmptyState";
import Badge from "../components/Badge";
import CreateOrgModal from "../components/CreateOrgModal";

import {
  LayoutDashboard,
  Building2,
  Mail,
  UserCheck,
  Plus,
  ArrowRight,
  Check,
  X,
  Settings
} from "lucide-react";

export default function MyDashboardPage() {
  const { user } = useAuth();
  const { organizations, switchOrg, fetchOrganizations } = useOrg();
  const navigate = useNavigate();

  const [myInvitations, setMyInvitations] = useState([]);
  const [loadingInvites, setLoadingInvites] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const loadPendingInvitations = async () => {
    try {
      setLoadingInvites(true);
      const response = await invitationsApi.getMyInvitations();
      setMyInvitations(response.data?.data || []);
    } catch (err) {
      console.error("Failed to load invitations", err);
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

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="card bg-gradient-to-r from-[#161b22] to-[#21262d] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[#1f6feb]/20 border border-[#58a6ff]/40 text-[#58a6ff] flex items-center justify-center text-lg font-bold font-mono shadow-sm">
            {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#f0f6fc] tracking-tight">
              Welcome, {user?.name} 👋
            </h1>
            <p className="text-xs text-[#8b949e] font-mono mt-0.5">{user?.email}</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Link to="/profile" className="btn-secondary text-xs">
            <UserCheck className="w-3.5 h-3.5 text-green-400" />
            My Profile
          </Link>
          <button onClick={() => setShowCreateModal(true)} className="btn-primary text-xs">
            <Plus className="w-3.5 h-3.5" />
            New Organization
          </button>
        </div>
      </div>

      {/* Grid: Organizations & Pending Invitations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Your Organizations (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#f0f6fc] uppercase tracking-wider flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#58a6ff]" />
              Your Organizations ({organizations.length})
            </h2>
            <button
              onClick={() => setShowCreateModal(true)}
              className="text-xs text-[#58a6ff] hover:underline font-medium flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Create
            </button>
          </div>

          {organizations.length === 0 ? (
            <EmptyState
              message="You are not a member of any organization yet."
              action={
                <button onClick={() => setShowCreateModal(true)} className="btn-primary text-xs">
                  <Plus className="w-4 h-4" /> Create Organization
                </button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {organizations.map((org) => (
                <div key={org._id} className="card hover:border-[#58a6ff]/50 transition-all flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between">
                      <h3 className="font-bold text-[#f0f6fc] text-sm">{org.name}</h3>
                      <Badge variant="success">Active</Badge>
                    </div>
                    <p className="font-mono text-[11px] text-[#8b949e] mt-1">slug: {org.slug}</p>
                    {org.description && (
                      <p className="text-xs text-[#8b949e] mt-2 line-clamp-2">{org.description}</p>
                    )}
                  </div>

                  <div className="pt-4 mt-4 border-t border-[#30363d] flex items-center justify-between">
                    <span className="text-[10px] text-[#8b949e] font-mono">
                      Created {new Date(org.createdAt).toLocaleDateString()}
                    </span>
                    <button
                      onClick={() => handleEnterOrg(org)}
                      className="text-xs text-[#58a6ff] hover:text-blue-400 font-semibold flex items-center gap-1"
                    >
                      Enter Workspace <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Pending Invitations & Quick Links */}
        <div className="space-y-6">
          {/* Pending Invitations */}
          <div className="card space-y-4">
            <h2 className="text-sm font-bold text-[#f0f6fc] uppercase tracking-wider flex items-center gap-2 border-b border-[#30363d] pb-3">
              <Mail className="w-4 h-4 text-yellow-400" />
              Pending Invites ({myInvitations.length})
            </h2>

            {loadingInvites ? (
              <LoadingSpinner message="Checking invites..." />
            ) : myInvitations.length === 0 ? (
              <p className="text-xs text-[#8b949e] italic text-center py-4">No pending invitations.</p>
            ) : (
              <div className="space-y-3">
                {myInvitations.map((inv) => (
                  <div key={inv._id} className="p-3 bg-[#0d1117] rounded-lg border border-[#30363d] space-y-2 text-xs">
                    <div>
                      <span className="font-bold text-[#f0f6fc] block">{inv.organizationId?.name}</span>
                      <span className="text-[11px] text-[#8b949e]">
                        Role: <Badge variant="info">{inv.role}</Badge>
                      </span>
                    </div>
                    <div className="flex items-center justify-end gap-2 pt-1 border-t border-[#30363d]/60">
                      <button
                        onClick={() => handleAcceptInvite(inv._id)}
                        className="btn-primary text-[11px] py-1 px-2.5"
                      >
                        <Check className="w-3 h-3" /> Accept
                      </button>
                      <button
                        onClick={() => handleRejectInvite(inv._id)}
                        className="btn-secondary text-[11px] py-1 px-2.5 text-red-400"
                      >
                        <X className="w-3 h-3" /> Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Links */}
          <div className="card space-y-3">
            <h2 className="text-xs font-bold text-[#8b949e] uppercase tracking-wider border-b border-[#30363d] pb-2">
              Personal Links
            </h2>
            <div className="space-y-1.5 text-xs">
              <Link
                to="/profile"
                className="flex items-center justify-between p-2.5 rounded-md bg-[#0d1117] hover:bg-[#21262d] text-[#c9d1d9] transition-colors"
              >
                <span>View Profile & Memberships</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#8b949e]" />
              </Link>
              <Link
                to="/settings/personal"
                className="flex items-center justify-between p-2.5 rounded-md bg-[#0d1117] hover:bg-[#21262d] text-[#c9d1d9] transition-colors"
              >
                <span>Personal Account Settings</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#8b949e]" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      <CreateOrgModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} />
    </div>
  );
}
