/**
 * PersonalSettingsPage.jsx
 *
 * Personal Account Settings (/settings/personal).
 * Dedicated personal settings separate from organization settings.
 */

import { useAuth } from "../context/AuthContext";
import Badge from "../components/Badge";
import { Settings, Shield, Lock, Bell, Moon } from "lucide-react";

export default function PersonalSettingsPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Settings className="w-5 h-5 text-yellow-400" />
            Personal Settings
          </h1>
          <p className="page-description">Manage personal preferences and security settings</p>
        </div>
      </div>

      {/* Preferences Section */}
      <div className="card space-y-4">
        <h2 className="text-sm font-bold text-[#f0f6fc] border-b border-[#30363d] pb-3 flex items-center gap-2">
          <Moon className="w-4 h-4 text-[#58a6ff]" />
          Interface Preferences
        </h2>

        <div className="space-y-3 text-xs">
          <div className="flex items-center justify-between p-3 bg-[#0d1117] rounded-md border border-[#30363d]">
            <div>
              <span className="font-semibold text-[#f0f6fc] block">Appearance Theme</span>
              <span className="text-[11px] text-[#8b949e]">APIShield uses GitHub Dark Theme by default</span>
            </div>
            <Badge variant="purple">Dark Theme</Badge>
          </div>

          <div className="flex items-center justify-between p-3 bg-[#0d1117] rounded-md border border-[#30363d]">
            <div>
              <span className="font-semibold text-[#f0f6fc] block">Email Notifications</span>
              <span className="text-[11px] text-[#8b949e]">Receive alerts for team invitations and key rotations</span>
            </div>
            <Badge variant="success">Enabled</Badge>
          </div>
        </div>
      </div>

      {/* Security Section */}
      <div className="card space-y-4">
        <h2 className="text-sm font-bold text-[#f0f6fc] border-b border-[#30363d] pb-3 flex items-center gap-2">
          <Shield className="w-4 h-4 text-green-400" />
          Security Overview
        </h2>

        <div className="space-y-3 text-xs">
          <div className="flex items-center justify-between p-3 bg-[#0d1117] rounded-md border border-[#30363d]">
            <div>
              <span className="font-semibold text-[#f0f6fc] block">Authentication Method</span>
              <span className="text-[11px] text-[#8b949e]">JWT Bearer Token Header Authentication</span>
            </div>
            <Badge variant="info">JWT Session</Badge>
          </div>

          <div className="flex items-center justify-between p-3 bg-[#0d1117] rounded-md border border-[#30363d]">
            <div>
              <span className="font-semibold text-[#f0f6fc] block">Account Verification</span>
              <span className="text-[11px] text-[#8b949e]">Verification status registered with database</span>
            </div>
            <Badge variant={user?.isVerified ? "success" : "warning"}>
              {user?.isVerified ? "Verified" : "Unverified"}
            </Badge>
          </div>
        </div>

        <div className="p-3 bg-[#21262d]/60 border border-[#30363d] rounded-md flex items-center gap-2 text-xs text-[#8b949e]">
          <Lock className="w-4 h-4 text-yellow-500 shrink-0" />
          <span>Security configuration modifications require backend administrative permissions.</span>
        </div>
      </div>
    </div>
  );
}
