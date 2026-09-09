/**
 * TeamsPage.jsx
 *
 * Displays all teams within the active organization.
 * Allows creating new teams and deleting teams (with ConfirmModal confirmation).
 */

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useOrg } from "../context/OrgContext";
import teamsApi from "../api/teams";

import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";
import EmptyState from "../components/EmptyState";
import Modal from "../components/Modal";
import ConfirmModal from "../components/ConfirmModal";

import { Users, Plus, ArrowRight, Trash2 } from "lucide-react";

export default function TeamsPage() {
  const { activeOrg } = useOrg();

  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Create Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState("");

  // Confirm Modal
  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    teamId: null,
    teamName: "",
    loading: false,
  });

  const loadTeams = async () => {
    if (!activeOrg) return;
    try {
      setLoading(true);
      setError("");
      const response = await teamsApi.getAll(activeOrg._id);
      setTeams(response.data?.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load teams.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeams();
  }, [activeOrg]);

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setModalError("Team name is required.");
      return;
    }

    try {
      setSubmitting(true);
      setModalError("");
      await teamsApi.create(activeOrg._id, name.trim(), description.trim() || undefined);
      setName("");
      setDescription("");
      setShowCreateModal(false);
      loadTeams();
    } catch (err) {
      setModalError(err.response?.data?.message || "Failed to create team.");
    } finally {
      setSubmitting(false);
    }
  };

  const openDeleteConfirm = (teamId, teamName) => {
    setConfirmState({
      isOpen: true,
      teamId,
      teamName,
      loading: false,
    });
  };

  const handleConfirmDelete = async () => {
    const { teamId } = confirmState;
    try {
      setConfirmState((prev) => ({ ...prev, loading: true }));
      await teamsApi.delete(activeOrg._id, teamId);
      setConfirmState({ isOpen: false, teamId: null, teamName: "", loading: false });
      loadTeams();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete team.");
      setConfirmState((prev) => ({ ...prev, loading: false }));
    }
  };

  if (!activeOrg) {
    return <EmptyState message="No active organization selected." />;
  }

  if (loading) {
    return <LoadingSpinner message="Loading teams..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-400" />
            Teams
          </h1>
          <p className="page-description">Manage workgroups and developer team assignments</p>
        </div>

        <button onClick={() => setShowCreateModal(true)} className="btn-primary text-xs">
          <Plus className="w-4 h-4" />
          Create Team
        </button>
      </div>

      {error && <ErrorMessage message={error} onRetry={loadTeams} />}

      {/* Teams Grid */}
      {!error && (
        teams.length === 0 ? (
          <EmptyState
            message="No teams created yet in this organization."
            action={
              <button onClick={() => setShowCreateModal(true)} className="btn-primary text-xs">
                <Plus className="w-4 h-4" />
                Create First Team
              </button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teams.map((team) => (
              <div key={team._id} className="card bg-[#161b22] border-white/10 hover:border-blue-500/40 hover:shadow-lg hover:shadow-blue-950/20 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-white text-base tracking-tight">{team.name}</h3>
                      <p className="font-mono text-[11px] text-gray-500 mt-0.5">slug: {team.slug}</p>
                    </div>
                    <button
                      onClick={() => openDeleteConfirm(team._id, team.name)}
                      className="p-1.5 text-gray-500 hover:text-red-400 rounded transition-colors"
                      title="Delete Team"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="text-xs text-gray-400 mt-3 line-clamp-2">
                    {team.description || "No description provided."}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-white/5 flex items-center justify-between">
                  <span className="text-[10px] text-gray-500 font-mono">
                    Created {new Date(team.createdAt).toLocaleDateString()}
                  </span>
                  <Link
                    to={`/org/${activeOrg._id}/teams/${team._id}`}
                    className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1 transition-colors"
                  >
                    Manage Team <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Modal: Create Team */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create New Team">
        <form onSubmit={handleCreateTeam} className="space-y-4">
          {modalError && (
            <div className="p-3 bg-red-950/60 border border-red-800/60 rounded-md text-red-300 text-xs">
              {modalError}
            </div>
          )}

          <div>
            <label className="label">Team Name *</label>
            <input
              type="text"
              className="input"
              placeholder="e.g. Backend Platform"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={submitting}
              required
            />
          </div>

          <div>
            <label className="label">Description (Optional)</label>
            <textarea
              className="input resize-none h-20"
              placeholder="Responsible for core database & API services"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={submitting}
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
            <button type="button" onClick={() => setShowCreateModal(false)} className="btn-secondary text-xs" disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn-primary text-xs" disabled={submitting}>
              {submitting ? "Creating..." : "Create Team"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmState.isOpen}
        onClose={() => setConfirmState((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={handleConfirmDelete}
        title="Delete Team?"
        description={`Are you sure you want to delete team "${confirmState.teamName}"?\nAll memberships and API key associations for this team will be permanently deleted.`}
        confirmText="Delete Team"
        variant="danger"
        loading={confirmState.loading}
      />
    </div>
  );
}
