import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useOrg } from "../context/OrgContext";
import organizationsApi from "../api/organizations";
import EmptyState from "../components/EmptyState";
import ConfirmModal from "../components/ConfirmModal";
import {
  Settings,
  Building2,
  Globe,
  Trash2,
  Check,
  AlertCircle,
  AlertTriangle,
  Save,
  Shield,
  Lock,
  KeyRound,
  Users,
  CreditCard
} from "lucide-react";

export default function SettingsPage() {
  const { organizationId } = useParams();
  const { activeOrg, organizations, updateOrg, removeOrg } = useOrg();
  const navigate = useNavigate();

  const currentOrg = organizations.find((o) => o._id === organizationId) || activeOrg;
  const targetOrgId = currentOrg?._id;

  const [activeTab, setActiveTab] = useState("general"); // "general" | "members" | "security" | "billing"

  // Form State
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [website, setWebsite] = useState("");
  const [enforce2FA, setEnforce2FA] = useState(false);
  const [requireSignedRequests, setRequireSignedRequests] = useState(true);

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState("");

  // Delete State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    if (currentOrg) {
      setName(currentOrg.name || "");
      setSlug(currentOrg.slug || "acme-college");
      setDescription(currentOrg.description || "Academic computing & API gateway infrastructure");
      setWebsite(currentOrg.website || "https://acme.edu");
    }
  }, [currentOrg]);

  if (!currentOrg) {
    return <EmptyState message="No active organization selected." />;
  }

  const handleSave = async (e) => {
    e.preventDefault();
    setSaveError("");
    setSaveSuccess(false);

    if (!name.trim()) {
      setSaveError("Organization name is required.");
      return;
    }

    try {
      setIsSaving(true);
      const res = await organizationsApi.update(targetOrgId, {
        name: name.trim(),
        description: description.trim(),
        website: website.trim(),
      });

      const updated = res.data?.data || {
        ...currentOrg,
        name: name.trim(),
        description: description.trim(),
        website: website.trim(),
      };
      updateOrg(updated);

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      setSaveError(err.response?.data?.message || "Failed to update organization settings.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteOrg = async () => {
    try {
      setIsDeleting(true);
      setDeleteError("");
      await organizationsApi.delete(targetOrgId);
      removeOrg(targetOrgId);
      setIsDeleteModalOpen(false);
      navigate("/dashboard");
    } catch (err) {
      setDeleteError(err.response?.data?.message || "Failed to delete organization.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070b12] text-gray-100 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* ── HEADER (Matches Screen #6) ────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-gray-400 font-mono mb-2">
            <Link to="/" className="text-gray-400 hover:text-white transition-colors">
              APIShield
            </Link>
            <span className="text-gray-600">/</span>
            <span className="text-emerald-400 font-medium">Settings</span>
          </nav>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Settings
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Manage organization settings, security preferences, and member access.
          </p>
        </div>
      </div>

      {/* ── SETTINGS TABS (Matches Screen #6) ──────────────────────────────── */}
      <div className="flex items-center gap-4 border-b border-white/10 pb-1">
        <button
          type="button"
          onClick={() => setActiveTab("general")}
          className={`pb-2.5 text-xs font-medium transition-colors relative ${
            activeTab === "general"
              ? "text-emerald-400 font-semibold"
              : "text-gray-400 hover:text-white"
          }`}
        >
          General
          {activeTab === "general" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500 rounded-full" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("members")}
          className={`pb-2.5 text-xs font-medium transition-colors relative ${
            activeTab === "members"
              ? "text-emerald-400 font-semibold"
              : "text-gray-400 hover:text-white"
          }`}
        >
          Members & Access
          {activeTab === "members" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500 rounded-full" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("security")}
          className={`pb-2.5 text-xs font-medium transition-colors relative ${
            activeTab === "security"
              ? "text-emerald-400 font-semibold"
              : "text-gray-400 hover:text-white"
          }`}
        >
          Security & Compliance
          {activeTab === "security" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500 rounded-full" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("billing")}
          className={`pb-2.5 text-xs font-medium transition-colors relative ${
            activeTab === "billing"
              ? "text-emerald-400 font-semibold"
              : "text-gray-400 hover:text-white"
          }`}
        >
          Billing & Plans
          {activeTab === "billing" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500 rounded-full" />
          )}
        </button>
      </div>

      {/* ── GENERAL SETTINGS TAB CONTENT (Matches Screen #6) ────────────────── */}
      {activeTab === "general" && (
        <form onSubmit={handleSave} className="space-y-6 max-w-4xl">
          {saveSuccess && (
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span>Organization settings saved successfully.</span>
            </div>
          )}

          {saveError && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>{saveError}</span>
            </div>
          )}

          <div className="bg-[#0e131f] border border-white/10 rounded-xl p-5 shadow-xl space-y-4">
            <h2 className="text-sm font-bold text-white tracking-tight border-b border-white/10 pb-3">
              Organization Profile
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-300 block mb-1">
                  Organization Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#090d16] text-gray-200 text-xs border border-white/10 rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-300 block mb-1">
                  Organization Slug
                </label>
                <input
                  type="text"
                  value={slug}
                  disabled
                  className="w-full bg-[#090d16]/60 text-gray-500 text-xs font-mono border border-white/10 rounded-lg px-3 py-2 cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-300 block mb-1">
                Description
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-[#090d16] text-gray-200 text-xs border border-white/10 rounded-lg p-3 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-300 block mb-1">
                Website URL
              </label>
              <input
                type="text"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://example.com"
                className="w-full bg-[#090d16] text-gray-200 text-xs font-mono border border-white/10 rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Security Preferences */}
          <div className="bg-[#0e131f] border border-white/10 rounded-xl p-5 shadow-xl space-y-4">
            <h2 className="text-sm font-bold text-white tracking-tight border-b border-white/10 pb-3">
              Security Preferences
            </h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-white">Enforce Two-Factor Authentication</p>
                  <p className="text-[11px] text-gray-400">
                    Require all organization members to have 2FA enabled.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setEnforce2FA(!enforce2FA)}
                  className={`w-10 h-5 flex items-center rounded-full p-0.5 transition-colors ${
                    enforce2FA ? "bg-emerald-500" : "bg-gray-700"
                  }`}
                >
                  <span
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                      enforce2FA ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between border-t border-white/5 pt-3">
                <div>
                  <p className="text-xs font-semibold text-white">Require Signed API Requests</p>
                  <p className="text-[11px] text-gray-400">
                    Verify request signatures on all upstream gateway routes.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setRequireSignedRequests(!requireSignedRequests)}
                  className={`w-10 h-5 flex items-center rounded-full p-0.5 transition-colors ${
                    requireSignedRequests ? "bg-emerald-500" : "bg-gray-700"
                  }`}
                >
                  <span
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                      requireSignedRequests ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="bg-[#10b981] hover:bg-[#059669] text-[#052e16] font-semibold text-xs px-5 py-2.5 rounded-lg flex items-center gap-2 shadow-lg shadow-emerald-950/40 transition-all cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? "Saving Changes..." : "Save Changes"}</span>
            </button>
          </div>

          {/* ── DANGER ZONE (Matches Screen #6) ─────────────────────────────── */}
          <div className="bg-[#0e131f] border border-rose-500/20 rounded-xl p-5 shadow-xl space-y-3">
            <h2 className="text-sm font-bold text-rose-400 tracking-tight flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              <span>Danger Zone</span>
            </h2>
            <p className="text-xs text-gray-400">
              Permanently delete this organization and all associated projects, environments, integrations, and API keys. This action cannot be undone.
            </p>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(true)}
                className="bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 font-semibold text-xs px-4 py-2 rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Organization</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <ConfirmModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleDeleteOrg}
          title="Delete Organization"
          message={`Are you sure you want to delete ${currentOrg.name}? This will permanently delete all projects, integrations, environments, and API keys.`}
          confirmText="Yes, delete organization"
          isDanger={true}
          isLoading={isDeleting}
        />
      )}
    </div>
  );
}
