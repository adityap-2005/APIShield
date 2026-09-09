/**
 * MembersPage.jsx
 *
 * Organization members management page.
 * Allows viewing members, changing roles (with ConfirmModal confirmation), removing members, inviting new members, and leaving org.
 */

import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useOrg } from "../context/OrgContext";
import { useAuth } from "../context/AuthContext";
import membersApi from "../api/members";
import invitationsApi from "../api/invitations";

import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";
import EmptyState from "../components/EmptyState";
import Badge, { getRoleVariant } from "../components/Badge";
import Modal from "../components/Modal";
import ConfirmModal from "../components/ConfirmModal";

import { UserCheck, UserPlus, Trash2, LogOut } from "lucide-react";

export default function MembersPage() {
  const { activeOrg } = useOrg();
  const { organizationId } = useParams();
  const { user: currentUser } = useAuth();

  const targetOrgId = organizationId || activeOrg?._id;

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
    actionType: null, // "remove" | "role" | "leave"
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
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load members.");
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
      setTimeout(() => setSuccessMessage(""), 4000);
    } catch (err) {
      setModalError(err.response?.data?.message || "Failed to send invitation.");
    } finally {
      setSubmitting(false);
    }
  };

  const openRoleConfirm = (membershipId, name, currentRole, newRole) => {
    if (currentRole === newRole) return;
    setConfirmState({
      isOpen: true,
      actionType: "role",
      membershipId,
      targetName: name,
      newRole,
      title: "Change Member Role?",
      description: `You are about to change the organization role for member:\n\n${name}\n\n${currentRole} → ${newRole}\n\nThis will modify permissions for this member across the entire organization.`,
      confirmText: "Confirm Change",
      variant: "warning",
      loading: false,
    });
  };

  const openRemoveConfirm = (membershipId, name) => {
    setConfirmState({
      isOpen: true,
      actionType: "remove",
      membershipId,
      targetName: name,
      newRole: "",
      title: "Remove Member?",
      description: `Are you sure you want to remove ${name} from this organization?\nThis member will lose access to all organization resources, teams, and API keys.`,
      confirmText: "Remove Member",
      variant: "danger",
      loading: false,
    });
  };

  const openLeaveConfirm = () => {
    setConfirmState({
      isOpen: true,
      actionType: "leave",
      membershipId: null,
      targetName: "",
      newRole: "",
      title: "Leave Organization?",
      description: `Are you sure you want to leave this organization?\nYou will lose access to all its teams and resources.`,
      confirmText: "Leave Organization",
      variant: "danger",
      loading: false,
    });
  };

  const handleConfirmAction = async () => {
    const { actionType, membershipId, newRole } = confirmState;
    try {
      setConfirmState((prev) => ({ ...prev, loading: true }));
      if (actionType === "role") {
        await membersApi.updateRole(targetOrgId, membershipId, newRole);
      } else if (actionType === "remove") {
        await membersApi.remove(targetOrgId, membershipId);
      } else if (actionType === "leave") {
        await membersApi.leave(targetOrgId);
        window.location.href = "/dashboard";
        return;
      }
      setConfirmState({ isOpen: false, actionType: null, membershipId: null, targetName: "", newRole: "", title: "", description: "", confirmText: "", variant: "danger", loading: false });
      loadMembers();
    } catch (err) {
      alert(err.response?.data?.message || "Action failed.");
      setConfirmState((prev) => ({ ...prev, loading: false }));
    }
  };

  if (!targetOrgId) {
    return <EmptyState message="No active organization selected." />;
  }

  if (loading) {
    return <LoadingSpinner message="Loading organization members..." />;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-green-400" />
            Members & Roles
          </h1>
          <p className="page-description">Manage workspace members and role-based access control</p>
        </div>

        <div className="flex gap-2">
          <button onClick={openLeaveConfirm} className="btn-secondary text-xs text-red-400 border-red-800/60 hover:bg-red-950/40">
            <LogOut className="w-3.5 h-3.5" />
            Leave Workspace
          </button>
          <button onClick={() => setShowInviteModal(true)} className="btn-primary text-xs">
            <UserPlus className="w-3.5 h-3.5" />
            Invite Member
          </button>
        </div>
      </div>

      {successMessage && (
        <div className="p-3 bg-green-950/60 border border-green-800/60 rounded-lg text-green-300 text-xs font-medium">
          {successMessage}
        </div>
      )}

      {error && <ErrorMessage message={error} onRetry={loadMembers} />}

      {/* Members Table */}
      {!error && (
        members.length === 0 ? (
          <EmptyState message="No active members found." />
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Joined Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {members.map((member) => {
                  const isSelf = member.user?._id === currentUser?._id;
                  return (
                    <tr key={member.membershipId}>
                      <td>
                        <div className="font-semibold text-white flex items-center gap-2">
                          {member.user?.name}
                          {isSelf && (
                            <span className="text-[10px] bg-blue-950/60 text-blue-300 border border-blue-800/40 px-1.5 py-0.2 rounded font-mono">
                              You
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-400 font-mono">{member.user?.email}</div>
                      </td>
                      <td>
                        <Badge variant={getRoleVariant(member.role)}>{member.role}</Badge>
                      </td>
                      <td>
                        <Badge variant="success">{member.status}</Badge>
                      </td>
                      <td className="text-xs text-gray-400 font-mono">
                        {member.joinedAt ? new Date(member.joinedAt).toLocaleDateString() : "N/A"}
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          {/* Role Change Select with ConfirmModal */}
                          {!isSelf && member.role !== "OWNER" && (
                            <select
                              className="input py-1 px-2 text-[11px] w-32"
                              value={member.role}
                              onChange={(e) =>
                                openRoleConfirm(
                                  member.membershipId,
                                  member.user?.name,
                                  member.role,
                                  e.target.value
                                )
                              }
                            >
                              <option value="DEVELOPER">DEVELOPER</option>
                              <option value="ADMIN">ADMIN</option>
                            </select>
                          )}

                          {!isSelf && member.role !== "OWNER" && (
                            <button
                              onClick={() => openRemoveConfirm(member.membershipId, member.user?.name)}
                              className="p-1.5 text-gray-500 hover:text-red-400 rounded transition-colors"
                              title="Remove Member"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* Modal: Invite Member */}
      <Modal isOpen={showInviteModal} onClose={() => setShowInviteModal(false)} title="Invite Member to Workspace">
        <form onSubmit={handleInvite} className="space-y-4">
          {modalError && (
            <div className="p-3 bg-red-950/60 border border-red-800/60 rounded-md text-red-300 text-xs">
              {modalError}
            </div>
          )}

          <div>
            <label className="label">Member Email *</label>
            <input
              type="email"
              className="input"
              placeholder="colleague@company.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              disabled={submitting}
              required
            />
          </div>

          <div>
            <label className="label">Assigned Role *</label>
            <select
              className="input"
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
              disabled={submitting}
            >
              <option value="DEVELOPER">DEVELOPER (Default permissions)</option>
              <option value="ADMIN">ADMIN (Can manage team & members)</option>
            </select>
            <span className="text-[10px] text-gray-500 font-mono mt-1 block">
              Note: OWNER role cannot be assigned via invitation.
            </span>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
            <button type="button" onClick={() => setShowInviteModal(false)} className="btn-secondary text-xs" disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn-primary text-xs" disabled={submitting}>
              {submitting ? "Sending..." : "Send Invitation"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmState.isOpen}
        onClose={() => setConfirmState((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={handleConfirmAction}
        title={confirmState.title}
        description={confirmState.description}
        confirmText={confirmState.confirmText}
        variant={confirmState.variant}
        loading={confirmState.loading}
      />
    </div>
  );
}
