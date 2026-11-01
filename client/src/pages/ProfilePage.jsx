import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useOrg } from "../context/OrgContext";
import authApi from "../api/auth";
import Modal from "../components/Modal";
import Badge from "../components/Badge";
import { User, Edit3, Check, AlertCircle, Save, Building2 } from "lucide-react";

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const { organizations } = useOrg();

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [modalError, setModalError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Sync state when modal opens
  useEffect(() => {
    if (user?.name) {
      setName(user.name);
    }
  }, [user?.name, isModalOpen]);

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "AP";

  const handleOpenModal = () => {
    setName(user?.name || "");
    setModalError("");
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    if (isSaving) return;
    setIsModalOpen(false);
    setModalError("");
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setModalError("");

    const trimmedName = name.trim();

    if (!trimmedName) {
      setModalError("Full name is required.");
      return;
    }

    if (trimmedName.length < 2 || trimmedName.length > 50) {
      setModalError("Name must be between 2 and 50 characters.");
      return;
    }

    try {
      setIsSaving(true);
      const response = await authApi.updateProfile(trimmedName);
      const updatedUser = response.data?.data;

      if (updatedUser) {
        updateUser(updatedUser);
      } else {
        updateUser({ name: trimmedName });
      }

      setIsModalOpen(false);
      setSuccessMessage("Profile updated successfully.");
    } catch (err) {
      setModalError(err.response?.data?.message || "Failed to update profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <User className="w-5 h-5 text-blue-400" />
            My Profile
          </h1>
          <p className="page-description">Your personal account details and platform memberships</p>
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

      {/* Clean Read-Only Profile Card */}
      <div className="card bg-[#161b22] border border-white/10 space-y-6 rounded-xl shadow-xl shadow-blue-950/10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 border-b border-white/5 pb-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-xl bg-blue-950/60 border border-blue-800/40 text-blue-300 flex items-center justify-center text-xl font-bold font-mono shadow-md">
              {initials}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">{user?.name}</h2>
              <p className="text-xs text-gray-400 font-mono mt-0.5">{user?.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="success">{user?.status || "ACTIVE"}</Badge>
                <Badge variant={user?.isVerified ? "success" : "warning"}>
                  {user?.isVerified ? "Verified Account" : "Unverified"}
                </Badge>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleOpenModal}
            className="btn-primary text-xs flex items-center gap-1.5 self-start sm:self-center"
          >
            <Edit3 className="w-3.5 h-3.5" />
            Update Profile
          </button>
        </div>

        {/* Read-Only Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="label">Full Name</label>
            <div className="input bg-[#1c2128] text-white font-medium">{user?.name || "N/A"}</div>
          </div>

          <div>
            <label className="label">Email Address</label>
            <div className="input bg-[#1c2128] font-mono text-gray-300">{user?.email || "N/A"}</div>
          </div>

          <div>
            <label className="label">Account ID</label>
            <div className="input bg-[#1c2128] font-mono text-gray-500">{user?._id || "N/A"}</div>
          </div>

          <div>
            <label className="label">Member Since</label>
            <div className="input bg-[#1c2128] font-mono text-gray-500">
              {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}
            </div>
          </div>
        </div>
      </div>

      {/* Organization Memberships */}
      <div className="card bg-[#161b22] border border-white/10 space-y-4 rounded-xl">
        <h2 className="text-xs font-mono font-semibold text-gray-400 uppercase tracking-wider border-b border-white/5 pb-3 flex items-center gap-2">
          <Building2 className="w-4 h-4 text-blue-400" />
          Associated Workspaces ({organizations.length})
        </h2>

        {organizations.length === 0 ? (
          <p className="text-xs text-gray-500 italic py-2">No workspace memberships found.</p>
        ) : (
          <div className="divide-y divide-white/5">
            {organizations.map((org) => (
              <div key={org._id} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-white block">{org.name}</span>
                  <span className="text-[11px] text-gray-500 font-mono">slug: {org.slug}</span>
                </div>
                <Badge variant="success">ACTIVE</Badge>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Centered Update Profile Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title="Update Profile"
        size="md"
      >
        <form onSubmit={handleSaveProfile} className="space-y-4">
          {modalError && (
            <div className="p-3 bg-red-950/60 border border-red-800/60 rounded-md flex items-center gap-2 text-xs text-red-300">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{modalError}</span>
            </div>
          )}

          <div>
            <label className="label" htmlFor="modalFullName">
              Full Name <span className="text-blue-400">*</span>
            </label>
            <input
              id="modalFullName"
              type="text"
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your full name"
              disabled={isSaving}
              required
              minLength={2}
              maxLength={50}
              autoFocus
            />
            <span className="text-[11px] text-gray-500 font-mono mt-1 block">
              Between 2 and 50 characters.
            </span>
          </div>

          <div>
            <label className="label" htmlFor="modalEmail">
              Email Address <span className="text-gray-500 font-normal">(Read-only)</span>
            </label>
            <input
              id="modalEmail"
              type="email"
              className="input bg-[#0d1117] text-gray-500 cursor-not-allowed font-mono"
              value={user?.email || ""}
              readOnly
              disabled
            />
            <span className="text-[11px] text-gray-500 font-mono mt-1 block">
              Email address cannot be changed.
            </span>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={handleCloseModal}
              disabled={isSaving}
              className="btn-secondary text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving || !name.trim() || name.trim().length < 2}
              className="btn-primary text-xs flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
