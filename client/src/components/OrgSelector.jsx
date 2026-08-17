/**
 * OrgSelector.jsx
 *
 * GitHub-inspired Organization/Workspace Selector dropdown in top navigation.
 * Displays real user organizations, indicates active organization with a checkmark,
 * and provides an option to create a new organization.
 */

import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useOrg } from "../context/OrgContext";
import { Building2, Plus, Check, ChevronDown } from "lucide-react";
import CreateOrgModal from "./CreateOrgModal";

export default function OrgSelector() {
  const { organizations, activeOrg, switchOrg } = useOrg();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleSelectOrg = (org) => {
    switchOrg(org);
    setIsOpen(false);
    navigate(`/org/${org._id}`);
  };

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-[#30363d] bg-[#0d1117] text-xs font-semibold text-[#f0f6fc] hover:bg-[#21262d] transition-colors focus:outline-none"
        >
          <Building2 className="w-4 h-4 text-[#58a6ff]" />
          <span className="truncate max-w-[140px] sm:max-w-[200px]">
            {activeOrg ? activeOrg.name : "Select Workspace"}
          </span>
          <ChevronDown className="w-3.5 h-3.5 text-[#8b949e]" />
        </button>

        {isOpen && (
          <div className="absolute left-0 mt-2 w-72 bg-[#161b22] border border-[#30363d] rounded-lg shadow-2xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
            <div className="px-3 py-2 text-[10px] font-bold text-[#8b949e] uppercase tracking-wider border-b border-[#30363d]">
              Your Organizations
            </div>

            <div className="max-h-60 overflow-y-auto py-1">
              {organizations.length === 0 ? (
                <div className="px-3 py-3 text-xs text-[#8b949e] italic text-center">
                  No organizations found
                </div>
              ) : (
                organizations.map((org) => {
                  const isActive = activeOrg?._id === org._id;
                  return (
                    <button
                      key={org._id}
                      onClick={() => handleSelectOrg(org)}
                      className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-[#21262d] transition-colors ${
                        isActive ? "text-[#58a6ff] font-semibold bg-[#1f6feb]/10" : "text-[#c9d1d9]"
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Building2 className="w-3.5 h-3.5 shrink-0 text-[#8b949e]" />
                        <span className="truncate">{org.name}</span>
                      </div>
                      {isActive && <Check className="w-4 h-4 text-[#58a6ff] shrink-0" />}
                    </button>
                  );
                })
              )}
            </div>

            <div className="border-t border-[#30363d] pt-1 mt-1">
              <button
                onClick={() => {
                  setIsOpen(false);
                  setShowCreateModal(true);
                }}
                className="w-full text-left px-3 py-2 text-xs text-[#58a6ff] font-medium flex items-center gap-2 hover:bg-[#21262d] transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Create Organization</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Org Modal */}
      <CreateOrgModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} />
    </>
  );
}
