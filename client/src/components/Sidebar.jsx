import { NavLink, useParams, useLocation, Link } from "react-router-dom";
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
  X,
  ArrowLeft,
  Building2
} from "lucide-react";

export default function Sidebar({
  isCollapsed,
  setIsCollapsed,
  isMobileOpen,
  setIsMobileOpen
}) {
  const { activeOrg } = useOrg();
  const params = useParams();
  const location = useLocation();

  // Determine if current route is in Organization Context vs User Context
  const isOrgContext = Boolean(params.organizationId) || location.pathname.startsWith("/org/");
  const currentOrgId = params.organizationId || activeOrg?._id;

  // Navigation Items for User Personal Area vs Organization Workspace
  const userNavItems = [
    { to: "/dashboard", label: "My Dashboard", icon: LayoutDashboard },
    { to: "/invitations", label: "My Invitations", icon: Mail },
    { to: "/profile", label: "My Profile", icon: UserCheck },
    { to: "/settings/personal", label: "Personal Settings", icon: Settings },
  ];

  const orgNavItems = currentOrgId ? [
    { to: `/org/${currentOrgId}`, label: "Overview", icon: LayoutDashboard },
    { to: `/org/${currentOrgId}/api-keys`, label: "API Keys", icon: KeyRound },
    { to: `/org/${currentOrgId}/teams`, label: "Teams", icon: Users },
    { to: `/org/${currentOrgId}/members`, label: "Members", icon: UserCheck },
    { to: `/org/${currentOrgId}/invitations`, label: "Org Invitations", icon: Mail },
    { to: `/org/${currentOrgId}/usage`, label: "Usage", icon: Activity },
    { to: `/org/${currentOrgId}/audit-logs`, label: "Audit Logs", icon: FileText },
    { to: `/org/${currentOrgId}/analytics`, label: "Analytics", icon: BarChart3 },
    { to: `/org/${currentOrgId}/settings`, label: "Org Settings", icon: Settings },
  ] : [];

  const navItems = isOrgContext ? orgNavItems : userNavItems;
  const sectionTitle = isOrgContext ? "Organization Workspace" : "Personal Area";

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
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 p-2.5 space-y-1 overflow-y-auto">
        {(!isCollapsed || isMobileOpen) && (
          <div className="px-3 py-1.5 text-[10px] font-bold text-[#8b949e] uppercase tracking-wider flex items-center gap-1.5">
            {isOrgContext ? <Building2 className="w-3 h-3 text-[#58a6ff]" /> : null}
            <span>{sectionTitle}</span>
          </div>
        )}

        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.label}
              to={item.to}
              onClick={() => isMobileOpen && setIsMobileOpen(false)}
              end={item.to === `/org/${currentOrgId}` || item.to === "/dashboard"}
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

        {/* Back to Personal Area Link when inside Org Context */}
        {isOrgContext && (!isCollapsed || isMobileOpen) && (
          <div className="pt-4 mt-2 border-t border-[#30363d]/60">
            <Link
              to="/dashboard"
              onClick={() => isMobileOpen && setIsMobileOpen(false)}
              className="flex items-center gap-2 px-3 py-1.5 text-xs text-[#8b949e] hover:text-[#58a6ff] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Personal Dashboard</span>
            </Link>
          </div>
        )}
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
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileOpen(false)}
          />
          <div className="relative w-64 max-w-xs bg-[#161b22] h-full shadow-2xl z-10">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
