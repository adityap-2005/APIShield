import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { useOrg } from "../context/OrgContext";
import projectsApi from "../api/projects";

import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";
import EmptyState from "../components/EmptyState";
import Modal from "../components/Modal";
import ConfirmModal from "../components/ConfirmModal";

import {
  FolderKanban,
  Plus,
  ArrowRight,
  Trash2,
  Blocks,
  KeyRound,
  Layers,
  Users
} from "lucide-react";

export default function ProjectsPage() {
  const { activeOrg } = useOrg();
  const params = useParams();
  const orgId = params.organizationId || activeOrg?._id;

  const [projects, setProjects] = useState([]);
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
    projectId: null,
    projectName: "",
    loading: false,
  });

  const loadProjects = async () => {
    if (!orgId) return;
    try {
      setLoading(true);
      setError("");
      const response = await projectsApi.getAll(orgId);
      setProjects(response.data?.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load projects.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, [orgId]);

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setModalError("Project name is required.");
      return;
    }

    try {
      setSubmitting(true);
      setModalError("");
      await projectsApi.create(orgId, name.trim(), description.trim() || undefined);
      setName("");
      setDescription("");
      setShowCreateModal(false);
      loadProjects();
    } catch (err) {
      setModalError(err.response?.data?.message || "Failed to create project.");
    } finally {
      setSubmitting(false);
    }
  };

  const openDeleteConfirm = (projectId, projectName) => {
    setConfirmState({
      isOpen: true,
      projectId,
      projectName,
      loading: false,
    });
  };

  const handleConfirmDelete = async () => {
    const { projectId } = confirmState;
    try {
      setConfirmState((prev) => ({ ...prev, loading: true }));
      await projectsApi.delete(orgId, projectId);
      setConfirmState({ isOpen: false, projectId: null, projectName: "", loading: false });
      loadProjects();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete project.");
      setConfirmState((prev) => ({ ...prev, loading: false }));
    }
  };

  if (!orgId) {
    return <EmptyState message="No active organization selected." />;
  }

  if (loading) {
    return <LoadingSpinner message="Loading projects..." />;
  }

  return (
    <div className="min-h-screen bg-[#070b12] text-gray-100 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* ── HEADER ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-gray-400 font-mono mb-2">
            <Link to="/" className="text-gray-400 hover:text-white transition-colors">
              APIShield
            </Link>
            <span className="text-gray-600">/</span>
            <span className="text-emerald-400 font-medium">Projects</span>
          </nav>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Projects
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Manage projects, environments, and team access within {activeOrg?.name || "your organization"}.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-[#10b981] hover:bg-[#059669] text-[#052e16] font-semibold text-xs px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg shadow-emerald-950/40 transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Create Project</span>
        </button>
      </div>

      {error && <ErrorMessage message={error} onRetry={loadProjects} />}

      {/* Projects Grid */}
      {!error && (
        projects.length === 0 ? (
          <EmptyState
            message="No projects created yet in this organization."
            action={
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-[#10b981] hover:bg-[#059669] text-[#052e16] font-semibold text-xs px-4 py-2 rounded-lg flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                Create First Project
              </button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {projects.map((project) => (
              <div
                key={project._id}
                className="bg-[#0e131f] border border-white/10 hover:border-white/20 rounded-xl p-5 shadow-lg transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                        <FolderKanban className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-sm tracking-tight">{project.name}</h3>
                        <p className="font-mono text-[10px] text-gray-500">slug: {project.slug}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => openDeleteConfirm(project._id, project.name)}
                      className="p-1.5 text-gray-500 hover:text-rose-400 rounded transition-colors"
                      title="Delete Project"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <p className="text-xs text-gray-400 mt-3 line-clamp-2">
                    {project.description || "No description provided."}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Link
                      to={`/org/${orgId}/integrations?projectId=${project._id}`}
                      className="text-[11px] text-gray-400 hover:text-emerald-400 font-mono flex items-center gap-1 transition-colors"
                      title="Manage Integrations"
                    >
                      <Blocks className="w-3.5 h-3.5 text-emerald-400" />
                      APIs
                    </Link>
                    <Link
                      to={`/org/${orgId}/api-keys?projectId=${project._id}`}
                      className="text-[11px] text-gray-400 hover:text-emerald-400 font-mono flex items-center gap-1 transition-colors"
                      title="Manage API Keys"
                    >
                      <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
                      Keys
                    </Link>
                  </div>
                  <Link
                    to={`/org/${orgId}/projects/${project._id}`}
                    className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 transition-colors"
                  >
                    <span>Manage</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Modal: Create Project */}
      {showCreateModal && (
        <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create New Project">
          <form onSubmit={handleCreateProject} className="space-y-4">
            {modalError && (
              <div className="p-3 bg-rose-950/60 border border-rose-800/60 rounded-md text-rose-300 text-xs">
                {modalError}
              </div>
            )}

            <div>
              <label className="text-xs font-medium text-gray-300 block mb-1">Project Name *</label>
              <input
                type="text"
                className="w-full bg-[#090d16] text-gray-200 text-xs border border-white/10 rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500"
                placeholder="e.g. Backend Platform"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={submitting}
                required
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-300 block mb-1">Description</label>
              <textarea
                className="w-full bg-[#090d16] text-gray-200 text-xs border border-white/10 rounded-lg p-3 focus:outline-none focus:border-emerald-500"
                placeholder="Brief summary of services grouped in this project"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                disabled={submitting}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-3.5 py-1.5 text-xs text-gray-400 hover:text-white"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="bg-[#10b981] hover:bg-[#059669] text-[#052e16] font-semibold text-xs px-4 py-1.5 rounded-lg flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{submitting ? "Creating..." : "Create Project"}</span>
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Confirm Delete Modal */}
      {confirmState.isOpen && (
        <ConfirmModal
          isOpen={confirmState.isOpen}
          onClose={() => setConfirmState({ isOpen: false, projectId: null, projectName: "", loading: false })}
          onConfirm={handleConfirmDelete}
          title="Delete Project"
          message={`Are you sure you want to delete "${confirmState.projectName}"? All environment integrations and API keys within this project will be deleted.`}
          confirmText="Delete Project"
          isDanger={true}
          isLoading={confirmState.loading}
        />
      )}
    </div>
  );
}
