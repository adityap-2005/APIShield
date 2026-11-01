/**
 * ProjectSelector.jsx
 * Supabase-style Project Selector dropdown.
 */

import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Check, ChevronsUpDown, Box, Plus } from "lucide-react";
import { useOrg } from "../context/OrgContext";
import CreateProjectModal from "./CreateProjectModal";

export default function ProjectSelector() {
  const { activeOrg, projects, activeProject, switchProject } = useOrg();
  const [isOpen, setIsOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const closeOnOutsideClick = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener("mousedown", closeOnOutsideClick);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (project) => {
    switchProject(project);
    setIsOpen(false);
    // If on /projects/:oldProjectId or /org/:orgId/projects/:oldProjectId, update route
    const match = location.pathname.match(/^(.*\/projects\/)[^/]+$/);
    if (match) {
      navigate(`${match[1]}${project._id}`);
    }
  };

  const projectName = activeProject?.name || (projects.length > 0 ? projects[0].name : "Select Project");

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen((open) => !open)}
          className="flex items-center gap-2 px-2 py-1 rounded-md text-sm font-medium text-gray-200 hover:text-white hover:bg-white/5 transition-all focus:outline-none"
          title={projectName}
          aria-label="Select project"
        >
          {/* Isometric Box / Project icon */}
          <Box className="w-4 h-4 text-gray-300 shrink-0" />
          <span className="truncate max-w-[130px] sm:max-w-[170px] text-white">
            {projectName}
          </span>
          <ChevronsUpDown className="w-3.5 h-3.5 text-gray-400 shrink-0 ml-0.5" />
        </button>

        {isOpen && (
          <div className="absolute left-0 mt-2 w-72 bg-[#161b22] border border-white/10 rounded-xl shadow-2xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
            <div className="px-3 py-2 text-[10px] font-mono font-semibold text-gray-400 uppercase tracking-wider border-b border-white/5">
              Projects
            </div>

            <div className="max-h-60 overflow-y-auto py-1">
              {projects.length === 0 ? (
                <div className="px-3 py-3 text-xs text-gray-400 italic text-center">
                  No projects configured yet
                </div>
              ) : (
                projects.map((project) => {
                  const isSelected = activeProject?._id === project._id;
                  return (
                    <button
                      key={project._id}
                      onClick={() => handleSelect(project)}
                      className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-white/5 transition-colors ${
                        isSelected ? "text-emerald-400 font-semibold bg-emerald-950/30" : "text-gray-300"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <Box className="w-3.5 h-3.5 shrink-0 text-gray-400" />
                        <span className="truncate">{project.name}</span>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
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
                <span>New Project</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </>
  );
}
