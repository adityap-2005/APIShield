import { NavLink, useParams, useLocation, Link } from "react-router-dom";
import { useOrg } from "../context/OrgContext";
import {
  LayoutDashboard,
  FolderKanban,
  Layers,
  Blocks,
  Server,
  KeyRound,
  Activity,
  BarChart3,
  FileText,
  Settings,
  ShieldCheck,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronDown,
  X,
} from "lucide-react";

export default function Sidebar({
  isCollapsed,
  setIsCollapsed,
  isMobileOpen,
  setIsMobileOpen
}) {
  const { activeOrg, organizations } = useOrg();
  const params = useParams();
  const location = useLocation();

  const orgId = params.organizationId || activeOrg?._id || organizations[0]?._id;

  // Build target link based on whether an org is available
  const getHref = (path) => (orgId ? `/org/${orgId}${path}` : path);

  const mainItems = [
    { to: orgId ? `/org/${orgId}` : "/overview", label: "Overview", icon: LayoutDashboard, exact: true },
    { to: getHref("/projects"), label: "Projects", icon: FolderKanban },
    { to: getHref("/environments"), label: "Environments", icon: Layers },
    { to: getHref("/integrations"), label: "Integrations", icon: Blocks },
    {
      to: getHref("/upstream-apis"),
      label: "Upstream APIs",
      icon: Server,
      isActive: (loc) =>
        loc.pathname.includes("/upstream-apis") ||
        loc.pathname.includes("/test-api"),
    },
    { to: getHref("/api-keys"), label: "API Keys", icon: KeyRound },
  ];

  const monitoringItems = [
    { to: getHref("/usage"), label: "Usage", icon: Activity },
    { to: getHref("/analytics"), label: "Analytics", icon: BarChart3 },
    { to: getHref("/audit-logs"), label: "Audit Logs", icon: FileText },
  ];

  const organizationItems = [
    { to: getHref("/settings"), label: "Settings", icon: Settings },
  ];

  const orgInitials = activeOrg?.name
    ? activeOrg.name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
    : "AP";

  const renderNavItem = (item) => {
    const Icon = item.icon;
    const isCustomActive = item.isActive ? item.isActive(location) : undefined;

    return (
      <NavLink
        key={item.label}
        to={item.to}
        end={item.exact}
        onClick={() => isMobileOpen && setIsMobileOpen(false)}
        className={({ isActive }) => {
          const active = isCustomActive !== undefined ? isCustomActive : isActive;
          return `flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-lg transition-all relative group ${active
              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold shadow-sm shadow-emerald-950/20"
              : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
            } ${isCollapsed && !isMobileOpen ? "justify-center px-2" : ""}`;
        }}
      >
        <Icon className="w-4 h-4 shrink-0" />
        {(!isCollapsed || isMobileOpen) && (
          <span className="truncate">{item.label}</span>
        )}

        {/* Tooltip for collapsed desktop view */}
        {isCollapsed && !isMobileOpen && (
          <div className="absolute left-full ml-2 px-2.5 py-1 bg-shield-surface text-white text-[11px] font-medium rounded-md border border-white/10 shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-50 whitespace-nowrap">
            {item.label}
          </div>
        )}
      </NavLink>
    );
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-shield-sidebar border-r border-white/10 select-none">
      {/* Brand Header */}
      <div className={`h-14 flex items-center border-b border-white/10 shrink-0 ${isCollapsed && !isMobileOpen ? "justify-center px-2" : "justify-between px-4"}`}>
        {isCollapsed && !isMobileOpen ? (
          <button
            onClick={() => setIsCollapsed(false)}
            className="w-7 h-7 rounded-md bg-emerald-500 flex items-center justify-center shrink-0 relative group"
            aria-label="Expand sidebar"
          >
            <ShieldCheck className="w-4 h-4 text-[#052e16] group-hover:opacity-0 transition-opacity" />
            <PanelLeftOpen className="w-4 h-4 text-[#052e16] absolute opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        ) : (
          <>
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-7 h-7 rounded-md bg-emerald-500 flex items-center justify-center text-[#052e16] shadow-sm shadow-emerald-500/30 group-hover:bg-emerald-400 transition-colors shrink-0">
                <ShieldCheck className="w-4 h-4 text-black" />
              </div>
              <div>
                <span className="font-bold text-white text-xs tracking-tight block">APIShield</span>
                <span className="text-[8px] text-gray-500 font-mono block tracking-wider uppercase font-semibold">GATEWAY OS</span>
              </div>
            </Link>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsCollapsed(true)}
                className="hidden lg:flex p-1 text-gray-400 hover:text-white rounded"
                aria-label="Collapse sidebar"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>

              {isMobileOpen && (
                <button
                  onClick={() => setIsMobileOpen(false)}
                  className="p-1 text-gray-400 hover:text-white rounded lg:hidden"
                  aria-label="Close menu"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-3 space-y-4 overflow-y-auto no-scrollbar">
        {/* Main Items */}
        <div className="space-y-1">
          {mainItems.map(renderNavItem)}
        </div>

        {/* Monitoring Section */}
        <div className="space-y-1 pt-1">
          {(!isCollapsed || isMobileOpen) && (
            <div className="px-3 pb-1 text-[10px] font-mono font-semibold text-gray-500 uppercase tracking-wider">
              Monitoring
            </div>
          )}
          {monitoringItems.map(renderNavItem)}
        </div>

        {/* Organization Section */}
        <div className="space-y-1 pt-1">
          {(!isCollapsed || isMobileOpen) && (
            <div className="px-3 pb-1 text-[10px] font-mono font-semibold text-gray-500 uppercase tracking-wider">
              Organization
            </div>
          )}
          {organizationItems.map(renderNavItem)}
        </div>
      </nav>

      {/* Bottom Pinned Organization Card */}
      {(!isCollapsed || isMobileOpen) && (
        <div className="p-2.5 border-t border-white/10 shrink-0">
          <Link
            to={getHref("/settings")}
            className="flex items-center justify-between p-2 rounded-lg bg-shield-subsurface hover:bg-shield-panel border border-white/5 hover:border-white/10 transition-colors group"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-md bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 flex items-center justify-center text-xs font-bold font-mono shrink-0">
                {orgInitials}
              </div>
              <div className="min-w-0 text-left">
                <p className="text-xs font-semibold text-white truncate group-hover:text-emerald-400 transition-colors">
                  {activeOrg?.name || "Acme College"}
                </p>
                <p className="text-[10px] text-gray-400 leading-tight">
                  {activeOrg?.role || "Owner"}
                </p>
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-gray-500 group-hover:text-white shrink-0 ml-1" />
          </Link>
        </div>
      )}

    </div>
  );

  return (
    <>
      {/* Desktop Permanent Static Sidebar */}
      <aside
        className={`hidden lg:block shrink-0 transition-all duration-200 ${isCollapsed ? "w-16" : "w-64"
          } h-screen`}
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
          <div className="relative w-64 max-w-xs bg-shield-sidebar h-full shadow-2xl z-10">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
