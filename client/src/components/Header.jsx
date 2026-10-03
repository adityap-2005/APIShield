/**
 * Header.jsx
 *
 * Top context navbar:
 * Organization [▼] / Project [▼] / Environment [▼] / Integration [▼]
 *
 * Route-based visibility:
 * - Overview, Usage, Analytics, Audit Logs, Settings: Organization only
 * - Projects, Project Overview, Environments, Members: Organization + Project
 * - API Keys: Organization + Project + Environment (NO Integration selector)
 * - Integrations, Upstream APIs: Organization + Project + Environment + Integration
 */

import { useLocation } from "react-router-dom";
import OrgSelector from "./OrgSelector";
import ProjectSelector from "./ProjectSelector";
import EnvironmentSelector from "./EnvironmentSelector";
import IntegrationSelector from "./IntegrationSelector";
import ProfileDropdown from "./ProfileDropdown";
import { Menu, Bell } from "lucide-react";

function getContextVisibility(pathname) {
  // Normalize pathname by stripping `/org/:organizationId` prefix if present
  const cleanPath = pathname.replace(/^\/org\/[^/]+/, "");

  let showProject = false;
  let showEnvironment = false;
  let showIntegration = false;

  // Upstream APIs / Test API: Org + Project + Environment + Integration
  if (
    cleanPath.startsWith("/upstream-apis") ||
    cleanPath.startsWith("/test-api")
  ) {
    showProject = true;
    showEnvironment = true;
    showIntegration = true;
  }
  // API Keys: Org + Project only (no Environment or Integration selector in navbar)
  else if (cleanPath.startsWith("/api-keys")) {
    showProject = true;
    showEnvironment = false;
    showIntegration = false;
  }
  // Projects list: Org only (navbar selector is redundant on projects page)
  else if (cleanPath === "/projects" || cleanPath === "/projects/") {
    showProject = false;
    showEnvironment = false;
    showIntegration = false;
  }
  // Project detail, Environments, Integrations, Members, Invitations: Org + Project
  else if (
    cleanPath.startsWith("/projects/") ||
    cleanPath.startsWith("/environments") ||
    cleanPath.startsWith("/integrations") ||
    cleanPath.startsWith("/members") ||
    cleanPath.startsWith("/invitations")
  ) {
    showProject = true;
    showEnvironment = false;
    showIntegration = false;
  }
  // Overview, Usage, Analytics, Audit Logs, Settings: Org only
  else {
    showProject = false;
    showEnvironment = false;
    showIntegration = false;
  }

  return { showProject, showEnvironment, showIntegration };
}

export default function Header({ onMobileMenuToggle }) {
  const location = useLocation();
  const { showProject, showEnvironment, showIntegration } = getContextVisibility(location.pathname);

  return (
    <header className="h-14 bg-[#0a0d14] border-b border-white/10 px-3 sm:px-5 flex items-center justify-between shrink-0 sticky top-0 z-30 select-none">
      {/* Left Area: Mobile Hamburger + Context Bar */}
      <div className="flex items-center gap-1 sm:gap-1.5 py-1 min-w-0 flex-wrap sm:flex-nowrap">
        {/* Mobile Hamburger Toggle */}
        <button
          onClick={onMobileMenuToggle}
          className="p-1.5 rounded-md border border-white/10 bg-[#0e131f] text-gray-400 hover:text-white hover:border-white/20 lg:hidden transition-colors shrink-0 mr-1"
          aria-label="Open navigation menu"
        >
          <Menu className="w-4 h-4" />
        </button>

        {/* Organization Selector (Always visible) */}
        <div className="shrink-0">
          <OrgSelector />
        </div>

        {/* Project Selector */}
        {showProject && (
          <>
            <span className="text-white/20 font-light text-sm select-none px-0.5 shrink-0">/</span>
            <div className="shrink-0">
              <ProjectSelector />
            </div>
          </>
        )}

        {/* Environment Selector */}
        {showEnvironment && (
          <>
            <span className="text-white/20 font-light text-sm select-none px-0.5 shrink-0">/</span>
            <div className="shrink-0">
              <EnvironmentSelector />
            </div>
          </>
        )}

        {/* Integration Selector */}
        {showIntegration && (
          <>
            <span className="text-white/20 font-light text-sm select-none px-0.5 shrink-0 hidden sm:inline-block">/</span>
            <div className="shrink-0 hidden sm:block">
              <IntegrationSelector />
            </div>
          </>
        )}
      </div>

      {/* Right Area: Notifications & Profile Dropdown */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0 ml-2">
        <button
          type="button"
          className="relative p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
          title="Notifications"
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        </button>

        <ProfileDropdown />
      </div>
    </header>
  );
}

