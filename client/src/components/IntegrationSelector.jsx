/**
 * IntegrationSelector.jsx
 * Context Integration Selector dropdown in top navigation.
 */

import { useEffect, useRef, useState } from "react";
import { ChevronsUpDown, Check, Blocks, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { useOrg } from "../context/OrgContext";

export default function IntegrationSelector() {
  const { integrations, activeIntegration, switchIntegration, activeOrg, activeProject, activeEnvironment } = useOrg();
  const [isOpen, setIsOpen] = useState(false);
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

  const activeEnvUpper = (activeEnvironment?.name || "").toUpperCase();
  // Filter integrations to those configured with the active environment, or all if none specified
  const filteredIntegrations = integrations.filter((integ) => {
    if (!activeEnvUpper) return true;
    return (integ.environments || []).some(
      (e) => (e.name || "").toUpperCase() === activeEnvUpper
    );
  });

  const displayList = filteredIntegrations.length > 0 ? filteredIntegrations : integrations;
  const currentInteg = displayList.find((i) => i._id === activeIntegration?._id) || displayList[0];
  const integName = currentInteg?.name || activeIntegration?.name || "Select Integration";

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen((open) => !open)}
        className="flex items-center gap-2 px-2 py-1 rounded-md text-sm font-medium text-gray-200 hover:text-white hover:bg-white/5 transition-all focus:outline-none"
        aria-label="Select integration"
        title={integName}
      >
        <Blocks className="w-4 h-4 text-emerald-400 shrink-0" />
        <span className="truncate max-w-[110px] sm:max-w-[140px] text-white">
          {integName}
        </span>
        <ChevronsUpDown className="w-3.5 h-3.5 text-gray-400 shrink-0 ml-0.5" />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-64 bg-[#161b22] border border-white/10 rounded-xl shadow-2xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
          <div className="px-3 py-2 text-[10px] font-mono font-semibold text-gray-400 uppercase tracking-wider border-b border-white/5 flex items-center justify-between">
            <span>Integrations</span>
            {activeEnvironment?.name && (
              <span className="text-[9px] text-emerald-400/80 font-normal">
                {activeEnvironment.name}
              </span>
            )}
          </div>

          <div className="max-h-60 overflow-y-auto py-1">
            {displayList.length === 0 ? (
              <div className="px-3 py-3 text-xs text-gray-400 italic text-center">
                No integrations in active environment
              </div>
            ) : (
              displayList.map((integ) => {
                const isSelected = activeIntegration?._id === integ._id;
                return (
                  <button
                    key={integ._id}
                    onClick={() => {
                      switchIntegration(integ);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-white/5 transition-colors ${
                      isSelected ? "text-emerald-400 font-semibold bg-emerald-950/30" : "text-gray-300"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <Blocks className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="truncate">{integ.name}</span>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                  </button>
                );
              })
            )}
          </div>

          <div className="border-t border-white/5 pt-1 mt-1">
            <Link
              to={activeOrg?._id ? `/org/${activeOrg._id}/integrations?action=create` : "/integrations?action=create"}
              onClick={() => setIsOpen(false)}
              className="w-full text-left px-3 py-2 text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-2 hover:bg-white/5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Configure Integration</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
