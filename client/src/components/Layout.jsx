/**
 * Layout.jsx
 *
 * Primary authenticated Layout wrapper combining:
 * - Collapsible & mobile-drawer Sidebar
 * - Top Header with OrgSelector and ProfileDropdown
 * - Content Outlet
 */

import { useState, useEffect } from "react";
import { Outlet, useParams } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { useOrg } from "../context/OrgContext";
import LoadingSpinner from "./LoadingSpinner";
import CreateOrgModal from "./CreateOrgModal";
import { Building2, Plus } from "lucide-react";

export default function Layout() {
  const { fetchOrganizations, isLoading, activeOrg, organizations, switchOrg } = useOrg();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [showCreateOrgModal, setShowCreateOrgModal] = useState(false);
  const { organizationId } = useParams();

  useEffect(() => {
    fetchOrganizations();
  }, []);

  // Synchronize activeOrg if route includes organizationId
  useEffect(() => {
    if (organizationId && organizations.length > 0) {
      const targetOrg = organizations.find((o) => o._id === organizationId);
      if (targetOrg && activeOrg?._id !== organizationId) {
        switchOrg(targetOrg);
      }
    }
  }, [organizationId, organizations]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
        <LoadingSpinner message="Loading workspace..." />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#0d1117] text-[#f0f6fc] font-sans antialiased">
      {/* Navigation Sidebar */}
      <Sidebar
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <Header onMobileMenuToggle={() => setIsMobileOpen(!isMobileOpen)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-7xl w-full mx-auto">
          {/* Zero Organization view prompt */}
          {organizations.length === 0 ? (
            <div className="max-w-md mx-auto my-16 text-center card">
              <div className="w-12 h-12 rounded-full bg-[#1f6feb]/20 border border-[#58a6ff]/30 flex items-center justify-center mx-auto mb-4 text-[#58a6ff]">
                <Building2 className="w-6 h-6" />
              </div>
              <h2 className="text-base font-bold text-[#f0f6fc] mb-2">No Organizations Found</h2>
              <p className="text-xs text-[#8b949e] mb-6 leading-relaxed">
                You don't belong to any organization yet. Create your first organization to begin managing your API keys, teams, and gateway security.
              </p>
              <button
                onClick={() => setShowCreateOrgModal(true)}
                className="btn-primary text-xs w-full justify-center"
              >
                <Plus className="w-4 h-4" />
                Create Organization
              </button>
            </div>
          ) : (
            <Outlet />
          )}
        </main>
      </div>

      {/* Modal to create organization */}
      <CreateOrgModal isOpen={showCreateOrgModal} onClose={() => setShowCreateOrgModal(false)} />
    </div>
  );
}
