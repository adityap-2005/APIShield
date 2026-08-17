/**
 * Sidebar.jsx
 *
 * GitHub-inspired responsive collapsible navigation sidebar.
 * Supports:
 * - Desktop Expanded mode (Full text labels + icons)
 * - Desktop Collapsed mode (Icons only + tooltips)
 * - Mobile Drawer mode (Opened via hamburger toggle, backdrop click closes)
 */

import { NavLink, useParams } from "react-router-dom";
import { useOrg } from "../context/OrgContext";
import {
  LayoutDashboard,
  KeyRound,
  Users,
  UserCheck,
  Mail,
  Activity,
  FileText,
  BarChart3,
  Settings,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  X
} from "lucide-react";

export default function Sidebar({
  isCollapsed,
  setIsCollapsed,
  isMobileOpen,
  setIsMobileOpen
}) {
  const { activeOrg } = useOrg();
  const params = useParams();

  const currentOrgId = params.organizationId || activeOrg?._id;

  // Base path prefix for organization routes
  const basePath = currentOrgId ? `/org/${currentOrgId}` : "/dashboard";

  const navItems = [
    { to: `${basePath}`, label: "Overview", icon: LayoutDashboard },
    { to: currentOrgId ? `/org/${currentOrgId}/api-keys` : "/api-keys", label: "API Keys", icon: KeyRound },
    { to: currentOrgId ? `/org/${currentOrgId}/teams` : "/teams", label: "Teams", icon: Users },
    { to: currentOrgId ? `/org/${currentOrgId}/members` : "/members", label: "Members", icon: UserCheck },
    { to: currentOrgId ? `/org/${currentOrgId}/invitations` : "/invitations", label: "Invitations", icon: Mail },
    { to: currentOrgId ? `/org/${currentOrgId}/usage` : "/usage", label: "Usage", icon: Activity },
    { to: currentOrgId ? `/org/${currentOrgId}/audit-logs` : "/audit-logs", label: "Audit Logs", icon: FileText },
    { to: currentOrgId ? `/org/${currentOrgId}/analytics` : "/analytics", label: "Analytics", icon: BarChart3 },
    { to: currentOrgId ? `/org/${currentOrgId}/settings` : "/settings", label: "Org Settings", icon: Settings },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#161b22] border-r border-[#30363d]">
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-[#30363d] shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#238636] flex items-center justify-center text-white shadow-xs shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          {(!isCollapsed || isMobileOpen) && (
            <div>
              <span className="font-bold text-[#f0f6fc] text-sm tracking-tight block">APIShield</span>
              <span className="text-[10px] text-[#8b949e] font-mono block leading-none">Gateway Platform</span>
            </div>
          )}
        </div>

        {/* Mobile close button */}
        {isMobileOpen && (
          <button
            onClick={() => setIsMobileOpen(false)}
            className="p-1 text-[#8b949e] hover:text-[#f0f6fc] rounded lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 p-2.5 space-y-1 overflow-y-auto">
        {(!isCollapsed || isMobileOpen) && (
          <div className="px-3 py-1.5 text-[10px] font-bold text-[#8b949e] uppercase tracking-wider">
            Organization Workspace
          </div>
        )}

        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.label}
              to={item.to}
              onClick={() => isMobileOpen && setIsMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-md transition-all relative group ${
                  isActive
                    ? "bg-[#1f6feb]/15 text-[#58a6ff] border-l-2 border-[#58a6ff]"
                    : "text-[#c9d1d9] hover:text-[#f0f6fc] hover:bg-[#21262d]"
                } ${isCollapsed && !isMobileOpen ? "justify-center px-2" : ""}`
              }
              title={isCollapsed && !isMobileOpen ? item.label : undefined}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {(!isCollapsed || isMobileOpen) && (
                <span className="truncate">{item.label}</span>
              )}

              {/* Tooltip for collapsed desktop view */}
              {isCollapsed && !isMobileOpen && (
                <div className="absolute left-full ml-2 px-2.5 py-1 bg-[#21262d] text-[#f0f6fc] text-[11px] font-medium rounded border border-[#30363d] shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-50 whitespace-nowrap">
                  {item.label}
                </div>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Desktop Collapse Toggle Footer */}
      <div className="hidden lg:flex p-3 border-t border-[#30363d] items-center justify-between shrink-0">
        {!isCollapsed && (
          <span className="text-[11px] text-[#8b949e] font-mono">Collapse Sidebar</span>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 rounded-md border border-[#30363d] bg-[#21262d] text-[#c9d1d9] hover:text-[#f0f6fc] hover:bg-[#30363d] transition-colors mx-auto"
          aria-label={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Permanent Sidebar */}
      <aside
        className={`hidden lg:block shrink-0 transition-all duration-200 ${
          isCollapsed ? "w-16" : "w-64"
        } min-h-screen`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileOpen(false)}
          />

          {/* Drawer content */}
          <div className="relative w-64 max-w-xs bg-[#161b22] h-full shadow-2xl z-10">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
