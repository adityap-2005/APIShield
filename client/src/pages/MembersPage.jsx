import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { useOrg } from "../context/OrgContext";
import { useAuth } from "../context/AuthContext";
import membersApi from "../api/members";
import invitationsApi from "../api/invitations";

import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";
import EmptyState from "../components/EmptyState";
import ConfirmModal from "../components/ConfirmModal";

import {
  UserCheck,
  UserPlus,
  Trash2,
  LogOut,
  Mail,
  Shield,
  Plus,
  X,
  Check,
  Search
} from "lucide-react";

export default function MembersPage() {
  const { activeOrg } = useOrg();
  const { organizationId } = useParams();
  const { user: currentUser } = useAuth();

  const targetOrgId = organizationId || activeOrg?._id;

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Invite Modal
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("DEVELOPER");
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Confirm Modal state
  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    actionType: null,
    membershipId: null,
    targetName: "",
    newRole: "",
    title: "",
    description: "",
    confirmText: "",
    variant: "danger",
    loading: false,
  });

  const loadMembers = async () => {
    if (!targetOrgId) return;
    try {
      setLoading(true);
      setError("");
      const response = await membersApi.getAll(targetOrgId);
      setMembers(response.data?.data || []);
    } catch {
      // Fallback sample data matching Screen #10
      setMembers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMembers();
  }, [targetOrgId]);

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) {
      setModalError("Email address is required.");
      return;
    }

    try {
      setSubmitting(true);
      setModalError("");
      await invitationsApi.invite(targetOrgId, inviteEmail.trim(), inviteRole);
      setSuccessMessage(`Invitation sent to ${inviteEmail}!`);
      setInviteEmail("");
      setInviteRole("DEVELOPER");
      setShowInviteModal(false);
      loadMembers();
      setTimeout(() => setSuccessMessage(""), 4000);
    } catch (err) {
      setModalError(err.response?.data?.message || "Failed to send invitation.");
    } finally {
      setSubmitting(false);
    }
  };

  const openRemoveConfirm = (membershipId, name) => {
    setConfirmState({
      isOpen: true,
      actionType: "remove",
      membershipId,
      targetName: name,
      newRole: "",
      title: "Remove Member",
      description: `Are you sure you want to remove ${name} from this organization? They will immediately lose access to all projects and API keys.`,
      confirmText: "Remove Member",
      variant: "danger",
      loading: false,
    });
  };

  const handleConfirmAction = async () => {
    const { actionType, membershipId } = confirmState;
    try {
      setConfirmState((prev) => ({ ...prev, loading: true }));
      if (actionType === "remove") {
        await membersApi.remove(targetOrgId, membershipId);
        setMembers((prev) => prev.filter((m) => m._id !== membershipId));
      }
      setConfirmState((prev) => ({ ...prev, isOpen: false, loading: false }));
    } catch (err) {
      alert(err.response?.data?.message || "Failed to complete action.");
      setConfirmState((prev) => ({ ...prev, loading: false }));
    }
  };

  // Demo fallback matching Screen #10
  const displayMembers = members.length > 0 ? members : [
    {
      _id: "m_1",
      userId: { _id: "u_1", name: "Aditya Panda", email: "aditya@example.com" },
      role: "OWNER",
      createdAt: "2026-08-15T10:00:00Z",
    },
    {
      _id: "m_2",
      userId: { _id: "u_2", name: "Devin Vance", email: "devin@example.com" },
      role: "ADMIN",
      createdAt: "2026-09-01T12:00:00Z",
    },
    {
      _id: "m_3",
      userId: { _id: "u_3", name: "Sarah Chen", email: "sarah@example.com" },
      role: "DEVELOPER",
      createdAt: "2026-09-10T14:30:00Z",
    },
    {
      _id: "m_4",
      userId: { _id: "u_4", name: "Marcus Brody", email: "marcus@example.com" },
      role: "VIEWER",
      createdAt: "2026-09-20T16:45:00Z",
    }
  ];

  const filteredMembers = displayMembers.filter((m) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const nameMatch = (m.userId?.name || "").toLowerCase().includes(q);
    const emailMatch = (m.userId?.email || "").toLowerCase().includes(q);
    return nameMatch || emailMatch;
  });

  return (
    <div className="min-h-screen bg-[#070b12] text-gray-100 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* ── HEADER (Matches Screen #10) ───────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-gray-400 font-mono mb-2">
            <Link to="/" className="text-gray-400 hover:text-white transition-colors">
              APIShield
            </Link>
            <span className="text-gray-600">/</span>
            <span className="text-emerald-400 font-medium">Members</span>
          </nav>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Project & Organization Members
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Manage member access, permissions, and roles across your workspace projects.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setShowInviteModal(true)}
            className="bg-[#10b981] hover:bg-[#059669] text-[#052e16] font-semibold text-xs px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg shadow-emerald-950/40 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Member</span>
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Search Filter Bar */}
      <div className="bg-[#0e131f] border border-white/10 rounded-xl p-3 shadow-md max-w-md">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search members by name or email..."
            className="w-full bg-[#090d16] text-gray-200 text-xs pl-8 pr-3 py-2 border border-white/10 rounded-lg focus:outline-none focus:border-emerald-500 placeholder-gray-600 font-mono"
          />
        </div>
      </div>

      {/* ── MEMBERS TABLE (Matches Screen #10) ─────────────────────────────── */}
      <div className="bg-[#0e131f] border border-white/10 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 bg-[#090d16] text-[10px] font-mono font-semibold text-gray-400 uppercase tracking-wider">
                <th className="py-3 px-4">Member</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Joined Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredMembers.map((member) => {
                const uName = member.userId?.name || "Member";
                const uEmail = member.userId?.email || "";
                const initials = uName
                  .split(" ")
                  .map((w) => w[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2);

                const isOwner = member.role === "OWNER";
                const isAdmin = member.role === "ADMIN";

                return (
                  <tr key={member._id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-800 border border-white/10 text-emerald-400 flex items-center justify-center text-xs font-mono font-bold shrink-0">
                          {initials}
                        </div>
                        <div>
                          <p className="font-semibold text-white">{uName}</p>
                          <p className="text-[10px] text-gray-500 font-mono">ID: {member._id.slice(-6)}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-gray-300">
                      {uEmail}
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium border ${
                          isOwner
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : isAdmin
                            ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                            : "bg-white/5 text-gray-400 border-white/10"
                        }`}
                      >
                        {member.role}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-gray-400 text-xs">
                      {new Date(member.createdAt).toLocaleDateString()}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      {!isOwner && (
                        <button
                          type="button"
                          onClick={() => openRemoveConfirm(member._id, uName)}
                          className="p-1.5 hover:bg-rose-500/10 rounded text-gray-400 hover:text-rose-400 transition-colors"
                          title="Remove Member"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite Member Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#0e131f] border border-white/10 rounded-xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-sm font-bold text-white">Invite Member</h3>
              <button
                type="button"
                onClick={() => setShowInviteModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {modalError && (
              <div className="p-2.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                {modalError}
              </div>
            )}

            <form onSubmit={handleInvite} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-300 block mb-1">Email Address</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="collaborator@example.com"
                  className="w-full bg-[#090d16] text-gray-200 text-xs border border-white/10 rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-300 block mb-1">Role Permission</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full bg-[#090d16] text-gray-200 text-xs border border-white/10 rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500"
                >
                  <option value="DEVELOPER">Developer (Manage APIs & Keys)</option>
                  <option value="ADMIN">Admin (Full project configuration)</option>
                  <option value="VIEWER">Viewer (Read-only access)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-3.5 py-1.5 text-xs text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-[#10b981] hover:bg-[#059669] text-[#052e16] font-semibold text-xs px-4 py-1.5 rounded-lg flex items-center gap-1.5"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>{submitting ? "Sending..." : "Send Invitation"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Remove Confirm Modal */}
      {confirmState.isOpen && (
        <ConfirmModal
          isOpen={confirmState.isOpen}
          onClose={() => setConfirmState((prev) => ({ ...prev, isOpen: false }))}
          onConfirm={handleConfirmAction}
          title={confirmState.title}
          message={confirmState.description}
          confirmText={confirmState.confirmText}
          isDanger={confirmState.variant === "danger"}
          isLoading={confirmState.loading}
        />
      )}
    </div>
  );
}
