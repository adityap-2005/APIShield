/**
 * CreateOrgModal.jsx
 * Modal to create a new organization.
 * Backend route: POST /organizations { name, description?, website? }
 */

import { useState } from "react";
import Modal from "./Modal";
import organizationsApi from "../api/organizations";
import { useOrg } from "../context/OrgContext";

export default function CreateOrgModal({ isOpen, onClose }) {
  const { addOrg } = useOrg();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [website, setWebsite] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Organization name is required");
      return;
    }

    try {
      setLoading(true);
      setError("");
      const response = await organizationsApi.create(
        name.trim(),
        description.trim() || undefined,
        website.trim() || undefined
      );

      const newOrg = response.data.data;
      addOrg(newOrg);
      setName("");
      setDescription("");
      setWebsite("");
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create organization");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Organization">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-950/50 border border-red-800 rounded text-red-300 text-xs">
            {error}
          </div>
        )}

        <div>
          <label className="label">Organization Name *</label>
          <input
            type="text"
            className="input"
            placeholder="e.g. Acme Corp"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
            required
          />
        </div>

        <div>
          <label className="label">Description (Optional)</label>
          <textarea
            className="input resize-none h-20"
            placeholder="Brief description of your organization"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={loading}
          />
        </div>

        <div>
          <label className="label">Website (Optional)</label>
          <input
            type="url"
            className="input"
            placeholder="https://example.com"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            disabled={loading}
          />
          <span className="text-[11px] text-gray-500 mt-1 block">Must start with http:// or https://</span>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-gray-800">
          <button type="button" onClick={onClose} className="btn-secondary text-xs" disabled={loading}>
            Cancel
          </button>
          <button type="submit" className="btn-primary text-xs" disabled={loading}>
            {loading ? "Creating..." : "Create Organization"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
