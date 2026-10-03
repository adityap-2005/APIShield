import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useOrg } from "../context/OrgContext";
import projectsApi from "../api/projects";
import membersApi from "../api/members";

import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";
import Modal from "../components/Modal";
import ConfirmModal from "../components/ConfirmModal";

import {
  FolderKanban,
  UserPlus,
  Trash2,
  Blocks,
  KeyRound,
  Play,
} from "lucide-react";

export default function ProjectDetailPage() {
  const { projectId, organizationId } = useParams();
  const { activeOrg, switchProject } = useOrg();
  const navigate = useNavigate();

  const targetOrgId = organizationId || activeOrg?._id;

  const [project, setProject] = useState(null);
  const [projectMembers, setProjectMembers] = useState([]);
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

  const loadProjectData = async () => {
    if (!targetOrgId || !projectId) return;
    try {
      setLoading(true);
      setError("");

      const [projectRes, membersRes, orgMembersRes] = await Promise.all([
        projectsApi.getById(targetOrgId, projectId),
        projectsApi.getMembers(targetOrgId, projectId),
        membersApi.getAll(targetOrgId).catch(() => ({ data: { data: [] } })),
      ]);

      const pData = projectRes.data?.data;
      setProject(pData);
      if (pData) switchProject(pData);
      setProjectMembers(membersRes.data?.data || []);
      setOrgMembers(orgMembersRes.data?.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load project details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjectData();
  }, [targetOrgId, projectId]);

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!selectedMembershipId) {
      setModalError("Please select a member to add.");
      return;
    }

    try {
      setSubmitting(true);
      setModalError("");
      await projectsApi.addMember(targetOrgId, projectId, selectedMembershipId);
      setShowAddModal(false);
      setSelectedMembershipId("");
      loadProjectData();
    } catch (err) {
      setModalError(err.response?.data?.message || "Failed to add member to project.");
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
      title: "Remove Project Member",
      description: `Are you sure you want to remove ${name} from this project?`,
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
        await projectsApi.removeMember(targetOrgId, projectId, membershipId);
        setProjectMembers((prev) => prev.filter((m) => m._id !== membershipId));
      }
      setConfirmState((prev) => ({ ...prev, isOpen: false, loading: false }));
    } catch (err) {
      alert(err.response?.data?.message || "Failed to remove member.");
      setConfirmState((prev) => ({ ...prev, loading: false }));
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading project overview..." />;
  }

  if (error || !project) {
    return (
      <ErrorMessage
        message={error || "Project not found."}
        onRetry={loadProjectData}
      />
    );
  }

  // Members not yet added to this project
  const availableOrgMembers = orgMembers.filter((om) => {
    return !projectMembers.some((pm) => {
      const pmUserId = pm.organizationMembershipId?.userId?._id || pm.organizationMembershipId?.userId;
      const omUserId = om.userId?._id || om.userId;
      return pmUserId === omUserId;
    });
  });

  return (
    <div className="min-h-screen bg-[#070b12] text-gray-100 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* ── HEADER & BREADCRUMBS ──────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-gray-400 font-mono mb-2">
            <Link to="/" className="text-gray-400 hover:text-white transition-colors">
              APIShield
            </Link>
            <span className="text-gray-600">/</span>
            <Link to={`/org/${targetOrgId}/projects`} className="text-gray-400 hover:text-white transition-colors">
              Projects
            </Link>
            <span className="text-gray-600">/</span>
            <span className="text-emerald-400 font-medium">{project.name}</span>
          </nav>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <FolderKanban className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                {project.name}
              </h1>
              <p className="text-xs text-gray-400 mt-0.5">
                {project.description || "Project Workspace Overview"}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Launch Actions */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
          <Link
            to={`/org/${targetOrgId}/upstream-apis/test`}
            className="bg-[#10b981] hover:bg-[#059669] text-[#052e16] font-semibold text-xs px-4 py-2 rounded-lg flex items-center gap-1.5 shadow-lg shadow-emerald-950/40 transition-all"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Test API</span>
          </Link>
          <Link
            to={`/org/${targetOrgId}/integrations?projectId=${project._id}`}
            className="bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-medium px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <Blocks className="w-3.5 h-3.5 text-emerald-400" />
            <span>Integrations</span>
          </Link>
          <Link
            to={`/org/${targetOrgId}/api-keys?projectId=${project._id}`}
            className="bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-medium px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
            <span>API Keys</span>
          </Link>
        </div>
      </div>

      {/* ── PROJECT SUMMARY CARDS ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#0e131f] border border-white/10 rounded-xl p-5 shadow-lg">
          <span className="text-[11px] font-mono text-gray-400 uppercase tracking-wider">
            PROJECT MEMBERS
          </span>
          <div className="text-2xl font-bold font-mono text-white mt-2">
            {projectMembers.length}
          </div>
          <p className="text-[11px] text-gray-500 font-mono mt-1">Authorized developers</p>
        </div>

        <div className="bg-[#0e131f] border border-white/10 rounded-xl p-5 shadow-lg">
          <span className="text-[11px] font-mono text-gray-400 uppercase tracking-wider">
            ENVIRONMENTS
          </span>
          <div className="text-2xl font-bold font-mono text-emerald-400 mt-2">
            4 Stages
          </div>
          <p className="text-[11px] text-gray-500 font-mono mt-1">Dev, Staging, Prod, Test</p>
        </div>

        <div className="bg-[#0e131f] border border-white/10 rounded-xl p-5 shadow-lg">
          <span className="text-[11px] font-mono text-gray-400 uppercase tracking-wider">
            SECURITY STATUS
          </span>
          <div className="text-2xl font-bold font-mono text-white mt-2 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span>Enforced</span>
          </div>
          <p className="text-[11px] text-gray-500 font-mono mt-1">API Key Auth Protected</p>
        </div>
      </div>

      {/* ── PROJECT MEMBERS SECTION ───────────────────────────────────────── */}
      <div className="bg-[#0e131f] border border-white/10 rounded-xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div>
            <h2 className="text-sm font-bold text-white tracking-tight">Project Members</h2>
            <p className="text-[11px] text-gray-400">Members assigned to this project workspace</p>
          </div>

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="bg-[#10b981] hover:bg-[#059669] text-[#052e16] font-semibold text-xs px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add Member</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 bg-[#090d16] text-[10px] font-mono font-semibold text-gray-400 uppercase tracking-wider">
                <th className="py-3 px-4">Member</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Joined Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {projectMembers.map((pm) => {
                const uName = pm.user?.name || "Project Member";
                const uEmail = pm.user?.email || "";
                const initials = uName
                  .split(" ")
                  .map((w) => w[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2);

                const isAdmin = pm.role === "PROJECT_ADMIN";

                return (
                  <tr key={pm.projectMembershipId} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full bg-slate-800 border border-white/10 text-emerald-400 flex items-center justify-center text-xs font-mono font-bold shrink-0">
                          {initials}
                        </div>
                        <div>
                          <p className="font-semibold text-white">{uName}</p>
                          <p className="text-[10px] text-gray-500 font-mono">{uEmail}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium border ${isAdmin
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : "bg-white/5 text-gray-400 border-white/10"
                          }`}
                      >
                        {pm.projectRole}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-mono text-gray-400">
                      {pm.createdAt
                        ? new Date(pm.createdAt).toLocaleDateString()
                        : "—"}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => openRemoveConfirm(pm.projectMembershipId, uName)}
                        className="p-1.5 hover:bg-rose-500/10 rounded text-gray-400 hover:text-rose-400 transition-colors"
                        title="Remove from Project"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Member Modal */}
      {showAddModal && (
        <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add Member to Project">
          <form onSubmit={handleAddMember} className="space-y-4">
            {modalError && (
              <div className="p-3 bg-rose-950/60 border border-rose-800/60 rounded-md text-rose-300 text-xs">
                {modalError}
              </div>
            )}

            <div>
              <label className="text-xs font-medium text-gray-300 block mb-1">
                Select Organization Member
              </label>
              <select
                className="w-full bg-[#090d16] text-gray-200 text-xs border border-white/10 rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500"
                value={selectedMembershipId}
                onChange={(e) => setSelectedMembershipId(e.target.value)}
                required
              >
                <option value="">Choose a member...</option>
                {availableOrgMembers.map((om) => (
                  <option key={om._id} value={om._id}>
                    {om.userId?.name} ({om.userId?.email})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-3.5 py-1.5 text-xs text-gray-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="bg-[#10b981] hover:bg-[#059669] text-[#052e16] font-semibold text-xs px-4 py-1.5 rounded-lg flex items-center gap-1.5"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>{submitting ? "Adding..." : "Add to Project"}</span>
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Confirm Action Modal */}
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
