/**
 * ProfilePage.jsx
 *
 * User Profile Page (/profile).
 * Displays user account details and active organization memberships.
 * Profile modification is kept read-only in compliance with backend capability.
 */

import { useAuth } from "../context/AuthContext";
import { useOrg } from "../context/OrgContext";
import Badge from "../components/Badge";
import { User, Mail, ShieldCheck, Calendar, Building2, Lock } from "lucide-react";

export default function ProfilePage() {
  const { user } = useAuth();
  const { organizations } = useOrg();

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "AP";

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <User className="w-5 h-5 text-[#58a6ff]" />
            My Profile
          </h1>
          <p className="page-description">Your personal account details and platform memberships</p>
        </div>
      </div>

      {/* User Card */}
      <div className="card space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-5 border-b border-[#30363d] pb-6">
          <div className="w-16 h-16 rounded-full bg-[#1f6feb]/20 border-2 border-[#58a6ff]/40 text-[#58a6ff] flex items-center justify-center text-xl font-bold font-mono shadow-md">
            {initials}
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#f0f6fc]">{user?.name}</h2>
            <p className="text-xs text-[#8b949e] font-mono mt-0.5">{user?.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="success">{user?.status || "ACTIVE"}</Badge>
              <Badge variant={user?.isVerified ? "success" : "warning"}>
                {user?.isVerified ? "Verified Account" : "Unverified"}
              </Badge>
            </div>
          </div>
        </div>

        {/* Read-Only Form Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="label">Full Name</label>
            <div className="input bg-[#0d1117] text-[#f0f6fc]">{user?.name}</div>
          </div>

          <div>
            <label className="label">Email Address</label>
            <div className="input bg-[#0d1117] font-mono text-[#f0f6fc]">{user?.email}</div>
          </div>

          <div>
            <label className="label">Account ID</label>
            <div className="input bg-[#0d1117] font-mono text-[#8b949e]">{user?._id}</div>
          </div>

          <div>
            <label className="label">Member Since</label>
            <div className="input bg-[#0d1117] font-mono text-[#8b949e]">
              {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}
            </div>
          </div>
        </div>

        {/* Read-only notification banner */}
        <div className="p-3 bg-[#21262d]/60 border border-[#30363d] rounded-md flex items-center gap-2.5 text-xs text-[#8b949e]">
          <Lock className="w-4 h-4 text-yellow-500 shrink-0" />
          <span>Profile editing is currently unavailable. Contact your system administrator for profile updates.</span>
        </div>
      </div>

      {/* Organization Memberships */}
      <div className="card space-y-4">
        <h2 className="text-sm font-bold text-[#f0f6fc] border-b border-[#30363d] pb-3 flex items-center gap-2">
          <Building2 className="w-4 h-4 text-purple-400" />
          Associated Organizations ({organizations.length})
        </h2>

        {organizations.length === 0 ? (
          <p className="text-xs text-[#8b949e] italic py-2">No organization memberships found.</p>
        ) : (
          <div className="divide-y divide-[#30363d]">
            {organizations.map((org) => (
              <div key={org._id} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-[#f0f6fc] block">{org.name}</span>
                  <span className="text-[11px] text-[#8b949e] font-mono">slug: {org.slug}</span>
                </div>
                <Badge variant="success">ACTIVE</Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
