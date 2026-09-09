import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useOrg } from "../context/OrgContext";
import organizationsApi from "../api/organizations";
import Modal from "../components/Modal";
import ConfirmModal from "../components/ConfirmModal";
import Badge from "../components/Badge";
import EmptyState from "../components/EmptyState";
import { Settings, Building2, Globe, Edit3, Trash2, Check, AlertCircle, AlertTriangle, Save } from "lucide-react";

export default function SettingsPage() {
  const { organizationId } = useParams();
  const { activeOrg, organizations, updateOrg, removeOrg } = useOrg();
  const navigate = useNavigate();

  const currentOrg = organizations.find((o) => o._id === organizationId) || activeOrg;
  const targetOrgId = currentOrg?._id;

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [website, setWebsite] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [modalError, setModalError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Delete Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  // Sync state when org or modal opens
  useEffect(() => {
    if (currentOrg) {
      setName(currentOrg.name || "");
      setDescription(currentOrg.description || "");
      setWebsite(currentOrg.website || "");
    }
  }, [currentOrg?._id, currentOrg?.name, currentOrg?.description, currentOrg?.website, isEditModalOpen]);

  if (!currentOrg) {
    return <EmptyState message="No active organization selected." />;
  }

  const handleOpenEditModal = () => {
    setName(currentOrg.name || "");
    setDescription(currentOrg.description || "");
    setWebsite(currentOrg.website || "");
    setModalError("");
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    if (isSaving) return;
    setIsEditModalOpen(false);
    setModalError("");
  };

  const handleSaveOrg = async (e) => {
    e.preventDefault();
    setModalError("");

    const trimmedName = name.trim();
    if (!trimmedName) {
      setModalError("Organization name is required.");
      return;
    }

    if (trimmedName.length < 3 || trimmedName.length > 100) {
      setModalError("Organization name must be between 3 and 100 characters.");
      return;
    }

    if (website.trim() && !website.trim().startsWith("http")) {
      setModalError("Website URL must start with http:// or https://");
      return;
    }

    try {
      setIsSaving(true);
      const response = await organizationsApi.update(targetOrgId, {
        name: trimmedName,
        description: description.trim(),
        website: website.trim(),
      });

      const updatedData = response.data?.data;
      if (updatedData) {
        updateOrg(updatedData);
      } else {
        updateOrg({
          _id: targetOrgId,
          name: trimmedName,
          description: description.trim(),
          website: website.trim(),
        });
      }

      setIsEditModalOpen(false);
      setSuccessMessage("Workspace updated successfully.");
    } catch (err) {
      setModalError(err.response?.data?.message || "Failed to update workspace. Only workspace owners can edit details.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      setIsDeleting(true);
      setDeleteError("");
      await organizationsApi.delete(targetOrgId);

      setIsDeleteModalOpen(false);
      removeOrg(targetOrgId);
      navigate("/dashboard");
    } catch (err) {
      setDeleteError(err.response?.data?.message || "Failed to delete workspace. Only workspace owners can delete this workspace.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-400" />
            Workspace Settings
          </h1>
          <p className="page-description">Manage configuration and preferences for {currentOrg.name}</p>
        </div>
      </div>

      {/* Success Feedback Alert */}
      {successMessage && (
        <div className="p-3 bg-green-950/60 border border-green-800/60 rounded-xl flex items-center justify-between text-xs text-green-300">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-green-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button
            onClick={() => setSuccessMessage("")}
            className="text-green-400 hover:text-green-200 text-xs underline ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Clean Read-Only Organization Details Card */}
      <div className="card bg-[#161b22] border border-white/10 space-y-6 rounded-xl shadow-xl shadow-blue-950/10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-400" />
              {currentOrg.name}
            </h2>
            <p className="text-xs text-gray-500 font-mono mt-0.5">slug: {currentOrg.slug}</p>
          </div>

          <button
            type="button"
            onClick={handleOpenEditModal}
            className="btn-primary text-xs flex items-center gap-1.5 self-start sm:self-center"
          >
            <Edit3 className="w-3.5 h-3.5" />
            Update Workspace
          </button>
        </div>

        {/* Read-Only Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="label">Workspace Name</label>
            <div className="input bg-[#1c2128] text-white font-medium">{currentOrg.name}</div>
          </div>

          <div>
            <label className="label">Slug Identifier</label>
            <div className="input bg-[#1c2128] font-mono text-gray-400">{currentOrg.slug}</div>
          </div>

          <div>
            <label className="label">Website</label>
            <div className="input bg-[#1c2128] font-mono text-white flex items-center gap-2">
              <Globe className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              {currentOrg.website ? (
                <a
                  href={currentOrg.website}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-400 hover:text-blue-300 hover:underline truncate"
                >
                  {currentOrg.website}
                </a>
              ) : (
                <span className="text-gray-500">Not set</span>
              )}
            </div>
          </div>

          <div>
            <label className="label">Status</label>
            <div className="py-1">
              <Badge variant="success">{currentOrg.status || "ACTIVE"}</Badge>
            </div>
          </div>

          <div className="sm:col-span-2">
            <label className="label">Description</label>
            <div className="input bg-[#1c2128] text-gray-300 min-h-[60px] py-2">
              {currentOrg.description || "No description provided."}
            </div>
          </div>

          <div>
            <label className="label">Created Date</label>
            <div className="input bg-[#1c2128] font-mono text-gray-400">
              {currentOrg.createdAt ? new Date(currentOrg.createdAt).toLocaleString() : "N/A"}
            </div>
          </div>

          <div>
            <label className="label">Workspace ID</label>
            <div className="input bg-[#1c2128] font-mono text-gray-400">{currentOrg._id}</div>
          </div>
        </div>
      </div>

      {/* Danger Zone: Delete Organization */}
      <div className="card border-red-900/40 bg-[#161b22] space-y-4 rounded-xl">
        <div className="flex items-center justify-between border-b border-red-900/30 pb-3">
          <h2 className="text-sm font-bold text-red-400 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            Danger Zone
          </h2>
          <span className="text-[10px] font-mono text-red-400/80 uppercase tracking-wider">Destructive Action</span>
        </div>

        {deleteError && (
          <div className="p-3 bg-red-950/60 border border-red-800/60 rounded-md flex items-center gap-2 text-xs text-red-300">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{deleteError}</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 py-2">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-white">Delete this workspace</p>
            <p className="text-xs text-gray-400 leading-relaxed">
              Permanently remove <span className="font-semibold text-white">{currentOrg.name}</span>, all teams, API keys, audit logs, and telemetry. Once deleted, this workspace cannot be recovered.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setDeleteError("");
              setIsDeleteModalOpen(true);
            }}
            className="btn-danger text-xs px-4 py-2 shrink-0 flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete Workspace
          </button>
        </div>
      </div>

      {/* Centered Update Organization Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        title="Update Workspace"
        size="lg"
      >
        <form onSubmit={handleSaveOrg} className="space-y-4">
          {modalError && (
            <div className="p-3 bg-red-950/60 border border-red-800/60 rounded-md flex items-center gap-2 text-xs text-red-300">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{modalError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="sm:col-span-2">
              <label className="label" htmlFor="modalOrgName">
                Workspace Name <span className="text-blue-400">*</span>
              </label>
              <input
                id="modalOrgName"
                type="text"
                className="input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My Workspace"
                disabled={isSaving}
                required
                minLength={3}
                maxLength={100}
                autoFocus
              />
              <span className="text-[10px] text-gray-500 font-mono mt-1 block">
                Between 3 and 100 characters.
              </span>
            </div>

            <div>
              <label className="label" htmlFor="modalSlug">
                Slug Identifier <span className="text-gray-500 font-normal">(Read-only)</span>
              </label>
              <input
                id="modalSlug"
                type="text"
                className="input bg-[#0d1117] font-mono text-gray-500 cursor-not-allowed"
                value={currentOrg.slug || ""}
                readOnly
                disabled
              />
            </div>

            <div>
              <label className="label" htmlFor="modalWebsite">
                Website
              </label>
              <input
                id="modalWebsite"
                type="url"
                className="input"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://example.com"
                disabled={isSaving}
              />
              <span className="text-[10px] text-gray-500 font-mono mt-1 block">
                Must start with http:// or https://
              </span>
            </div>

            <div className="sm:col-span-2">
              <label className="label" htmlFor="modalDescription">
                Description
              </label>
              <textarea
                id="modalDescription"
                className="input min-h-[80px] py-2"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Briefly describe what this workspace is for..."
                disabled={isSaving}
                maxLength={500}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={handleCloseEditModal}
              disabled={isSaving}
              className="btn-secondary text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving || !name.trim() || name.trim().length < 3}
              className="btn-primary text-xs flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirmation Modal for Deletion */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => !isDeleting && setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        title={`Delete "${currentOrg.name}"?`}
        description={`Are you sure you want to permanently delete "${currentOrg.name}"?\n\nThis will immediately delete all associated teams, API keys, members, invitations, and analytics. This action cannot be undone.`}
        confirmText="Yes, delete workspace"
        cancelText="Cancel"
        variant="danger"
        loading={isDeleting}
      />
    </div>
  );
}
