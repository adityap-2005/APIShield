/**
 * SettingsPage.jsx
 *
 * Settings page displaying organization configuration and account details.
 * Information is read-only in strict compliance with existing backend capability.
 */

import { useOrg } from "../context/OrgContext";
import { useAuth } from "../context/AuthContext";
import Badge from "../components/Badge";
import EmptyState from "../components/EmptyState";
import { Settings, Building2, User, Globe, FileText, Calendar } from "lucide-react";

export default function SettingsPage() {
  const { activeOrg } = useOrg();
  const { user } = useAuth();

  if (!activeOrg) {
    return <EmptyState message="No active organization selected." />;
  }

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Settings className="w-5 h-5 text-gray-400" />
            Organization & Account Settings
          </h1>
          <p className="page-description">Overview of organization configuration and profile details</p>
        </div>
      </div>

      {/* Organization Information */}
      <div className="card space-y-4">
        <h2 className="text-sm font-semibold text-gray-200 border-b border-gray-800 pb-3 flex items-center gap-2">
          <Building2 className="w-4 h-4 text-brand-400" />
          Active Organization Details
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="label">Organization Name</label>
            <div className="input bg-gray-950 font-medium text-gray-200">{activeOrg.name}</div>
          </div>

          <div>
            <label className="label">Slug Identifier</label>
            <div className="input bg-gray-950 font-mono text-gray-400">{activeOrg.slug}</div>
          </div>

          <div>
            <label className="label">Website</label>
            <div className="input bg-gray-950 font-mono text-gray-400 flex items-center gap-2">
              <Globe className="w-3.5 h-3.5 text-gray-500" />
              {activeOrg.website || "Not set"}
            </div>
          </div>

          <div>
            <label className="label">Status</label>
            <div className="py-2">
              <Badge variant="success">{activeOrg.status || "ACTIVE"}</Badge>
            </div>
          </div>

          <div className="sm:col-span-2">
            <label className="label">Description</label>
            <div className="input bg-gray-950 text-gray-300 min-h-[60px]">
              {activeOrg.description || "No description provided."}
            </div>
          </div>

          <div>
            <label className="label">Created Date</label>
            <div className="input bg-gray-950 font-mono text-gray-400">
              {new Date(activeOrg.createdAt).toLocaleString()}
            </div>
          </div>
        </div>

        <p className="text-[11px] text-gray-500 italic pt-2">
          * Organization configuration is read-only.
        </p>
      </div>

      {/* User Account Details */}
      <div className="card space-y-4">
        <h2 className="text-sm font-semibold text-gray-200 border-b border-gray-800 pb-3 flex items-center gap-2">
          <User className="w-4 h-4 text-purple-400" />
          User Profile Information
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="label">Full Name</label>
            <div className="input bg-gray-950 text-gray-200">{user?.name}</div>
          </div>

          <div>
            <label className="label">Email Address</label>
            <div className="input bg-gray-950 font-mono text-gray-200">{user?.email}</div>
          </div>

          <div>
            <label className="label">Account Status</label>
            <div className="py-2">
              <Badge variant="success">{user?.status || "ACTIVE"}</Badge>
            </div>
          </div>

          <div>
            <label className="label">Verification Status</label>
            <div className="py-2">
              <Badge variant={user?.isVerified ? "success" : "warning"}>
                {user?.isVerified ? "Verified" : "Unverified"}
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
