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
  Building2,
  Blocks,
  Shield
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

  // Personal Area Navigation
  const userNavSections = [
    {
      title: "Personal Area",
      items: [
        { to: "/dashboard", label: "My Dashboard", icon: LayoutDashboard },
        { to: "/invitations", label: "My Invitations", icon: Mail },
        { to: "/profile", label: "My Profile", icon: UserCheck },
        { to: "/settings/personal", label: "Personal Settings", icon: Settings },
      ]
    }
  ];

  // Organization Workspace structured into professional sections
  const orgNavSections = currentOrgId ? [
    {
      title: "Overview",
      items: [
        { to: `/org/${currentOrgId}`, label: "Overview", icon: LayoutDashboard },
      ]
    },
    {
      title: "Workspace",
      items: [
        { to: `/org/${currentOrgId}/integrations`, label: "Environments & APIs", icon: Blocks },
        { to: `/org/${currentOrgId}/teams`, label: "Teams", icon: Users },
        { to: `/org/${currentOrgId}/members`, label: "Members", icon: UserCheck },
        { to: `/org/${currentOrgId}/invitations`, label: "Invitations", icon: Mail },
      ]
    },
    {
      title: "Security",
      items: [
        { to: `/org/${currentOrgId}/api-keys`, label: "API Keys", icon: KeyRound },
        { to: `/org/${currentOrgId}/audit-logs`, label: "Audit Logs", icon: FileText },
      ]
    },
    {
      title: "Analytics",
      items: [
        { to: `/org/${currentOrgId}/usage`, label: "Usage", icon: Activity },
        { to: `/org/${currentOrgId}/analytics`, label: "Analytics", icon: BarChart3 },
      ]
    },
    {
      title: "Organization",
      items: [
        { to: `/org/${currentOrgId}/settings`, label: "Settings", icon: Settings },
      ]
    }
  ] : [];

  const navSections = isOrgContext ? orgNavSections : userNavSections;

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#131822] border-r border-white/10 select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-white/10 shrink-0">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-[#2f81f7] flex items-center justify-center text-white shadow-sm shadow-blue-500/30 group-hover:bg-blue-500 transition-colors shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          {(!isCollapsed || isMobileOpen) && (
            <div>
              <span className="font-bold text-white text-sm tracking-tight block">APIShield</span>
              <span className="text-[10px] text-gray-500 font-mono block leading-none">Console</span>
            </div>
          )}
        </Link>

        {/* Mobile close button */}
        {isMobileOpen && (
          <button
            onClick={() => setIsMobileOpen(false)}
            className="p-1 text-gray-400 hover:text-white rounded lg:hidden"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation Sections */}
      <nav className="flex-1 p-2.5 space-y-4 overflow-y-auto">
        {navSections.map((section, idx) => (
          <div key={section.title || idx} className="space-y-1">
            {(!isCollapsed || isMobileOpen) && (
              <div className="px-3 pt-2 pb-1 text-[10px] font-mono font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                {idx === 0 && isOrgContext && <Building2 className="w-3 h-3 text-blue-400" />}
                {idx === 2 && isOrgContext && <Shield className="w-3 h-3 text-blue-400" />}
                <span>{section.title}</span>
              </div>
            )}

            {section.items.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.label}
                  to={item.to}
                  onClick={() => isMobileOpen && setIsMobileOpen(false)}
                  end={item.to === `/org/${currentOrgId}` || item.to === "/dashboard"}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-md transition-all relative group ${
                      isActive
                        ? "bg-blue-950/40 text-blue-300 border-l-2 border-blue-500"
                        : "text-gray-400 hover:text-white hover:bg-white/5"
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
                    <div className="absolute left-full ml-2 px-2.5 py-1 bg-[#1c2128] text-white text-[11px] font-medium rounded border border-white/10 shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-50 whitespace-nowrap">
                      {item.label}
                    </div>
                  )}
                </NavLink>
              );
            })}
          </div>
        ))}

        {/* Back to Personal Area Link when inside Org Context */}
        {isOrgContext && (!isCollapsed || isMobileOpen) && (
          <div className="pt-3 mt-2 border-t border-white/5">
            <Link
              to="/dashboard"
              onClick={() => isMobileOpen && setIsMobileOpen(false)}
              className="flex items-center gap-2 px-3 py-1.5 text-xs text-gray-400 hover:text-blue-300 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Personal Dashboard</span>
            </Link>
          </div>
        )}
      </nav>

      {/* Desktop Collapse Toggle Footer */}
      <div className="hidden lg:flex p-3 border-t border-white/10 items-center justify-between shrink-0">
        {!isCollapsed && (
          <span className="text-[11px] text-gray-500 font-mono">Collapse Sidebar</span>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 rounded-md border border-white/10 bg-[#121216] text-gray-400 hover:text-white hover:border-white/20 transition-colors mx-auto"
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
            className="fixed inset-0 bg-black/80 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileOpen(false)}
          />
          <div className="relative w-64 max-w-xs bg-[#131822] h-full shadow-2xl z-10">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
