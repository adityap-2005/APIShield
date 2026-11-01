/**
 * OrgSelector.jsx
 * Supabase-style Organization Selector dropdown.
 */

import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useOrg } from "../context/OrgContext";
import { Boxes, Plus, Check, ChevronsUpDown } from "lucide-react";
import CreateOrgModal from "./CreateOrgModal";

export default function OrgSelector() {
  const { organizations, activeOrg, switchOrg } = useOrg();
  const [isOpen, setIsOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

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
    if (location.pathname.startsWith("/org/")) {
      const newPath = location.pathname.replace(/^\/org\/[^/]+/, `/org/${org._id}`);
      navigate(newPath);
    }
  };

  const orgName = activeOrg?.name || (organizations.length > 0 ? organizations[0].name : "Select Organization");

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-2 py-1 rounded-md text-sm font-medium text-gray-200 hover:text-white hover:bg-white/5 transition-all focus:outline-none"
          title={orgName}
        >
          {/* Hexagonal/Boxes icon */}
          <Boxes className="w-4 h-4 text-gray-300 shrink-0" />
          <span className="truncate max-w-[130px] sm:max-w-[170px] text-white">
            {orgName}
          </span>
          <span className="bg-white/10 border border-white/5 text-gray-300 font-mono text-[10px] px-1.5 py-0.5 rounded font-semibold tracking-wide uppercase leading-none">
            FREE
          </span>
          <ChevronsUpDown className="w-3.5 h-3.5 text-gray-400 shrink-0 ml-0.5" />
        </button>

        {isOpen && (
          <div className="absolute left-0 mt-2 w-72 bg-[#161b22] border border-white/10 rounded-xl shadow-2xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
            <div className="px-3 py-2 text-[10px] font-mono font-semibold text-gray-400 uppercase tracking-wider border-b border-white/5">
              Organizations
            </div>

            <div className="max-h-60 overflow-y-auto py-1">
              {organizations.length === 0 ? (
                <div className="px-3 py-3 text-xs text-gray-400 italic text-center">
                  No organizations found
                </div>
              ) : (
                organizations.map((org) => {
                  const isActive = activeOrg?._id === org._id;
                  return (
                    <button
                      key={org._id}
                      onClick={() => handleSelectOrg(org)}
                      className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-white/5 transition-colors ${
                        isActive ? "text-emerald-400 font-semibold bg-emerald-950/30" : "text-gray-300"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <Boxes className="w-3.5 h-3.5 shrink-0 text-gray-400" />
                        <span className="truncate">{org.name}</span>
                      </div>
                      {isActive && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                    </button>
                  );
                })
              )}
            </div>

            <div className="border-t border-white/5 pt-1 mt-1">
              <button
                onClick={() => {
                  setIsOpen(false);
                  setShowCreateModal(true);
                }}
                className="w-full text-left px-3 py-2 text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-2 hover:bg-white/5 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Organization</span>
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
