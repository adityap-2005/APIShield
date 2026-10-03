/**
 * CreateProjectModal.jsx
 * Modal to create a new project in the active organization.
 * Backend route: POST /organizations/:organizationId/projects { name, description? }
 */

import { useState } from "react";
import Modal from "./Modal";
import projectsApi from "../api/projects";
import { useOrg } from "../context/OrgContext";

export default function CreateProjectModal({ isOpen, onClose }) {
  const { activeOrg, addProject } = useOrg();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Project name is required");
      return;
    }

    if (!activeOrg?._id) {
      setError("Please select an organization first");
      return;
    }

    try {
      setLoading(true);
      setError("");
      const response = await projectsApi.create(
        activeOrg._id,
        name.trim(),
        description.trim() || undefined
      );

      const newProject = response.data?.data;
      if (newProject) {
        addProject(newProject);
      }
      setName("");
      setDescription("");
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create project");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Project">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-950/60 border border-red-800/60 rounded-md text-red-300 text-xs">
            {error}
          </div>
        )}

        <div>
          <label className="label">Project Name *</label>
          <input
            type="text"
            className="input"
            placeholder="e.g. Production API Gateway"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
            required
            autoFocus
          />
        </div>

        <div>
          <label className="label">Description (Optional)</label>
          <textarea
            className="input resize-none h-20"
            placeholder="Brief description of this project"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={loading}
          />
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary text-xs"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary text-xs"
            disabled={loading}
          >
            {loading ? "Creating..." : "Create Project"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
