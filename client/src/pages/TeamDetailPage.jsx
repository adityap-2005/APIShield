/**
 * TeamDetailPage.jsx
 *
 * Detailed view of a single team.
 * Manages team membership, team roles (TEAM_ADMIN vs MEMBER), and adding org members to the team.
 * Uses ConfirmModal for destructive & permission changing actions.
 */

import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useOrg } from "../context/OrgContext";
import teamsApi from "../api/teams";
import membersApi from "../api/members";

import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";
import EmptyState from "../components/EmptyState";
import Badge, { getRoleVariant } from "../components/Badge";
import Modal from "../components/Modal";
import ConfirmModal from "../components/ConfirmModal";

import { Users, ArrowLeft, UserPlus, Trash2, LogOut, Blocks, KeyRound } from "lucide-react";

export default function TeamDetailPage() {
  const { teamId, organizationId } = useParams();
  const { activeOrg } = useOrg();
  const navigate = useNavigate();

  const targetOrgId = organizationId || activeOrg?._id;

  const [team, setTeam] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [orgMembers, setOrgMembers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Add Member Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedMembershipId, setSelectedMembershipId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState("");

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

  const loadTeamData = async () => {
    if (!targetOrgId || !teamId) return;
    try {
      setLoading(true);
      setError("");

      const [teamRes, membersRes, orgMembersRes] = await Promise.all([
        teamsApi.getById(targetOrgId, teamId),
        teamsApi.getMembers(targetOrgId, teamId),
        membersApi.getAll(targetOrgId).catch(() => ({ data: { data: [] } })),
      ]);

      setTeam(teamRes.data?.data);
      setTeamMembers(membersRes.data?.data || []);
      setOrgMembers(orgMembersRes.data?.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load team details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeamData();
  }, [targetOrgId, teamId]);

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!selectedMembershipId) {
      setModalError("Please select a member to add.");
      return;
    }

    try {
      setSubmitting(true);
      setModalError("");
      await teamsApi.addMember(targetOrgId, teamId, selectedMembershipId);
      setShowAddModal(false);
      setSelectedMembershipId("");
      loadTeamData();
    } catch (err) {
      setModalError(err.response?.data?.message || "Failed to add member to team.");
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
      title: "Change Team Role?",
      description: `You are changing the team role for ${name}:\n\n${currentRole} → ${newRole}\n\nThis will modify permissions for this member inside team "${team?.name}".`,
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
      title: "Remove Team Member?",
      description: `Are you sure you want to remove ${name} from team "${team?.name}"?\nThis member will lose access to team resources and API keys.`,
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
      title: "Leave Team?",
      description: `Are you sure you want to leave team "${team?.name}"?`,
      confirmText: "Leave Team",
      variant: "danger",
      loading: false,
    });
  };

  const handleConfirmAction = async () => {
    const { actionType, membershipId, newRole } = confirmState;
    try {
      setConfirmState((prev) => ({ ...prev, loading: true }));
      if (actionType === "role") {
        await teamsApi.updateMemberRole(targetOrgId, teamId, membershipId, newRole);
      } else if (actionType === "remove") {
        await teamsApi.removeMember(targetOrgId, teamId, membershipId);
      } else if (actionType === "leave") {
        await teamsApi.leave(targetOrgId, teamId);
        navigate(targetOrgId ? `/org/${targetOrgId}/teams` : "/teams");
        return;
      }
      setConfirmState({ isOpen: false, actionType: null, membershipId: null, targetName: "", newRole: "", title: "", description: "", confirmText: "", variant: "danger", loading: false });
      loadTeamData();
    } catch (err) {
      alert(err.response?.data?.message || "Action failed.");
      setConfirmState((prev) => ({ ...prev, loading: false }));
    }
  };

  const availableOrgMembers = orgMembers.filter(
    (orgM) => !teamMembers.some((tm) => tm.user?.id === orgM.user?._id)
  );

  if (loading) {
    return <LoadingSpinner message="Loading team details..." />;
  }

  if (error || !team) {
    return (
      <div className="space-y-4">
        <Link to={targetOrgId ? `/org/${targetOrgId}/teams` : "/teams"} className="text-xs text-blue-400 hover:underline flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Teams
        </Link>
        <ErrorMessage message={error || "Team not found."} onRetry={loadTeamData} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb Back link */}
      <Link to={targetOrgId ? `/org/${targetOrgId}/teams` : "/teams"} className="text-xs text-gray-500 hover:text-white flex items-center gap-1 transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Teams
      </Link>

      {/* Team Details Banner */}
      <div className="card bg-[#161b22] border border-white/10 space-y-3 rounded-xl shadow-xl shadow-blue-950/10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-400" />
              {team.name}
            </h1>
            <p className="font-mono text-xs text-gray-500 mt-1">slug: {team.slug}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              to={`/org/${targetOrgId}/integrations?teamId=${teamId}`}
              className="btn-secondary text-xs"
            >
              <Blocks className="w-3.5 h-3.5 text-blue-400" />
              Integrations
            </Link>
            <Link
              to={`/org/${targetOrgId}/api-keys?teamId=${teamId}`}
              className="btn-secondary text-xs"
            >
              <KeyRound className="w-3.5 h-3.5 text-blue-400" />
              API Keys
            </Link>
            <button onClick={() => setShowAddModal(true)} className="btn-primary text-xs">
              <UserPlus className="w-3.5 h-3.5" />
              Add Member
            </button>
            <button onClick={openLeaveConfirm} className="btn-secondary text-xs text-red-400 border-red-800/60 hover:bg-red-950/40">
              <LogOut className="w-3.5 h-3.5" />
              Leave
            </button>
          </div>
        </div>

        {team.description && (
          <p className="text-xs text-gray-400 border-t border-white/5 pt-3">
            {team.description}
          </p>
        )}
      </div>

      {/* Team Members List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-mono font-semibold text-gray-400 uppercase tracking-wider">
            Team Members ({teamMembers.length})
          </h2>
        </div>

        {teamMembers.length === 0 ? (
          <EmptyState
            message="No members added to this team yet."
            action={
              <button onClick={() => setShowAddModal(true)} className="btn-primary text-xs">
                <UserPlus className="w-3.5 h-3.5" /> Add First Member
              </button>
            }
          />
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Team Role</th>
                  <th>Org Role</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {teamMembers.map((member) => (
                  <tr key={member.teamMembershipId}>
                    <td>
                      <div className="font-semibold text-white">{member.user?.name}</div>
                      <div className="text-xs text-gray-400 font-mono">{member.user?.email}</div>
                    </td>
                    <td>
                      <Badge variant={getRoleVariant(member.teamRole)}>
                        {member.teamRole}
                      </Badge>
                    </td>
                    <td>
                      <Badge variant={getRoleVariant(member.organizationRole)}>
                        {member.organizationRole}
                      </Badge>
                    </td>
                    <td>
                      <Badge variant="success">{member.status}</Badge>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        {/* Change Team Role dropdown with ConfirmModal */}
                        <select
                          className="input py-1 px-2 text-[11px] w-32"
                          value={member.teamRole}
                          onChange={(e) =>
                            openRoleConfirm(
                              member.teamMembershipId,
                              member.user?.name,
                              member.teamRole,
                              e.target.value
                            )
                          }
                        >
                          <option value="MEMBER">MEMBER</option>
                          <option value="TEAM_ADMIN">TEAM_ADMIN</option>
                        </select>

                        <button
                          onClick={() => openRemoveConfirm(member.teamMembershipId, member.user?.name)}
                          className="p-1.5 text-gray-500 hover:text-red-400 rounded transition-colors"
                          title="Remove from Team"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Add Member to Team */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add Member to Team">
        <form onSubmit={handleAddMember} className="space-y-4">
          {modalError && (
            <div className="p-3 bg-red-950/60 border border-red-800/60 rounded-md text-red-300 text-xs">
              {modalError}
            </div>
          )}

          <div>
            <label className="label">Select Workspace Member *</label>
            {availableOrgMembers.length === 0 ? (
              <p className="text-xs text-gray-500 italic py-2">
                All workspace members are already in this team.
              </p>
            ) : (
              <select
                className="input"
                value={selectedMembershipId}
                onChange={(e) => setSelectedMembershipId(e.target.value)}
                disabled={submitting}
                required
              >
                <option value="">-- Choose Member --</option>
                {availableOrgMembers.map((m) => (
                  <option key={m.membershipId} value={m.membershipId}>
                    {m.user?.name} ({m.user?.email}) - {m.role}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
            <button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary text-xs" disabled={submitting}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary text-xs"
              disabled={submitting || availableOrgMembers.length === 0}
            >
              {submitting ? "Adding..." : "Add to Team"}
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
