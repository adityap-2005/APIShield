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
      <div className="h-screen bg-shield-bg flex items-center justify-center">
        <LoadingSpinner message="Loading workspace..." />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-shield-bg text-white font-sans antialiased selection:bg-emerald-600/30 selection:text-emerald-300">
      {/* Navigation Sidebar: Pinned 100vh full-height fixed sidebar */}
      <Sidebar
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />

      {/* Main Content Area: Header pinned at top, main scrolls independently */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <Header onMobileMenuToggle={() => setIsMobileOpen(!isMobileOpen)} />

        <main className="flex-1 overflow-y-auto w-full mx-auto p-4 sm:p-6 lg:p-8">
          {/* Zero Organization view prompt */}
          {organizations.length === 0 ? (
            <div className="max-w-md mx-auto my-16 text-center card bg-bg-shield-surface border border-white/10 p-8 rounded-xl">
              <div className="w-12 h-12 rounded-xl bg-emerald-950/60 border border-emerald-800/40 flex items-center justify-center mx-auto mb-4 text-emerald-400">
                <Building2 className="w-6 h-6" />
              </div>
              <h2 className="text-base font-bold text-white mb-2">No Organizations Found</h2>
              <p className="text-xs text-gray-400 mb-6 leading-relaxed">
                You don't belong to any organization yet. Create your first organization to begin managing your API keys, projects, and gateway security.
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
