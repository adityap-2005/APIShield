/**
 * PersonalSettingsPage.jsx
 *
 * Personal Account Settings (/settings/personal).
 * Dedicated personal settings separate from organization settings.
 */

import { useAuth } from "../context/AuthContext";
import Badge from "../components/Badge";
import { Settings, Shield, Lock, Moon } from "lucide-react";

export default function PersonalSettingsPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-400" />
            Personal Settings
          </h1>
          <p className="page-description">Manage personal preferences and security settings</p>
        </div>
      </div>

      {/* Preferences Section */}
      <div className="card bg-[#161b22] border border-white/10 space-y-4 rounded-xl">
        <h2 className="text-xs font-mono font-semibold text-gray-400 uppercase tracking-wider border-b border-white/5 pb-3 flex items-center gap-2">
          <Moon className="w-4 h-4 text-blue-400" />
          Interface Preferences
        </h2>

        <div className="space-y-3 text-xs">
          <div className="flex items-center justify-between p-3.5 bg-[#1c2128] rounded-xl border border-white/5">
            <div>
              <span className="font-semibold text-white block">Appearance Theme</span>
              <span className="text-[11px] text-gray-400">APIShield uses Obsidian Dark Theme by default</span>
            </div>
            <Badge variant="purple">Dark Theme</Badge>
          </div>

          <div className="flex items-center justify-between p-3.5 bg-[#1c2128] rounded-xl border border-white/5">
            <div>
              <span className="font-semibold text-white block">Email Notifications</span>
              <span className="text-[11px] text-gray-400">Receive alerts for team invitations and key rotations</span>
            </div>
            <Badge variant="success">Enabled</Badge>
          </div>
        </div>
      </div>

      {/* Security Section */}
      <div className="card bg-[#161b22] border border-white/10 space-y-4 rounded-xl">
        <h2 className="text-xs font-mono font-semibold text-gray-400 uppercase tracking-wider border-b border-white/5 pb-3 flex items-center gap-2">
          <Shield className="w-4 h-4 text-green-400" />
          Security Overview
        </h2>

        <div className="space-y-3 text-xs">
          <div className="flex items-center justify-between p-3.5 bg-[#1c2128] rounded-xl border border-white/5">
            <div>
              <span className="font-semibold text-white block">Authentication Method</span>
              <span className="text-[11px] text-gray-400">JWT Bearer Token Header Authentication</span>
            </div>
            <Badge variant="info">JWT Session</Badge>
          </div>

          <div className="flex items-center justify-between p-3.5 bg-[#1c2128] rounded-xl border border-white/5">
            <div>
              <span className="font-semibold text-white block">Account Verification</span>
              <span className="text-[11px] text-gray-400">Verification status registered with backend database</span>
            </div>
            <Badge variant={user?.isVerified ? "success" : "warning"}>
              {user?.isVerified ? "Verified" : "Unverified"}
            </Badge>
          </div>
        </div>

        <div className="p-3 bg-[#1c2128] border border-white/5 rounded-xl flex items-center gap-2 text-xs text-gray-400">
          <Lock className="w-4 h-4 text-yellow-400 shrink-0" />
          <span>Security configuration modifications require backend administrative permissions.</span>
        </div>
      </div>
    </div>
  );
}
