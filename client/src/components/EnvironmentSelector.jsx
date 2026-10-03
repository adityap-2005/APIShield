/**
 * EnvironmentSelector.jsx
 * Supabase-style Environment / Branch Selector dropdown.
 */

import { useEffect, useRef, useState } from "react";
import { ChevronsUpDown, Check, Plus } from "lucide-react";
import { useOrg } from "../context/OrgContext";

const ENV_STAGE_STYLES = {
  PRODUCTION: {
    badge: "text-[#f59e0b] border-[#f59e0b]/40 bg-[#f59e0b]/10",
    dot: "bg-[#f59e0b]",
    label: "PRODUCTION",
  },
  STAGING: {
    badge: "text-purple-400 border-purple-500/40 bg-purple-500/10",
    dot: "bg-purple-400",
    label: "STAGING",
  },
  DEVELOPMENT: {
    badge: "text-blue-400 border-blue-500/40 bg-blue-500/10",
    dot: "bg-blue-400",
    label: "DEVELOPMENT",
  },
  TEST: {
    badge: "text-emerald-400 border-emerald-500/40 bg-emerald-500/10",
    dot: "bg-emerald-400",
    label: "TEST",
  },
};

export default function EnvironmentSelector() {
  const { environments, activeEnvironment, switchEnvironment } = useOrg();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

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

  const envList = environments?.length > 0 ? environments : [
    { _id: "development", name: "DEVELOPMENT" },
    { _id: "staging", name: "STAGING" },
    { _id: "production", name: "PRODUCTION" },
    { _id: "test", name: "TEST" },
  ];

  const currentRawName = activeEnvironment?.name || "production";
  const currentUpper = currentRawName.toUpperCase();
  const currentStage = ENV_STAGE_STYLES[currentUpper] || ENV_STAGE_STYLES.PRODUCTION;
  const currentDisplayName = currentRawName.toLowerCase();

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen((open) => !open)}
        className="flex items-center gap-2 px-2 py-1 rounded-md text-sm font-medium text-gray-200 hover:text-white hover:bg-white/5 transition-all focus:outline-none"
        aria-label="Select environment"
        title={`Environment: ${currentRawName}`}
      >
        <span className="truncate max-w-[100px] sm:max-w-[130px] text-white">
          {currentDisplayName}
        </span>
        <span
          className={`border font-mono text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider leading-none shrink-0 ${currentStage.badge}`}
        >
          {currentStage.label}
        </span>
        <ChevronsUpDown className="w-3.5 h-3.5 text-gray-400 shrink-0 ml-0.5" />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-56 bg-[#161b22] border border-white/10 rounded-xl shadow-2xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
          <div className="px-3 py-2 text-[10px] font-mono font-semibold text-gray-400 uppercase tracking-wider border-b border-white/5">
            Environments
          </div>
          <div className="max-h-60 overflow-y-auto py-1">
            {envList.map((env) => {
              const isSelected =
                (activeEnvironment?.name || "").toUpperCase() === (env.name || "").toUpperCase();
              const upper = (env.name || "").toUpperCase();
              const stage = ENV_STAGE_STYLES[upper] || ENV_STAGE_STYLES.DEVELOPMENT;
              const formattedName = (env.name || "").toLowerCase();

              return (
                <button
                  key={env._id || env.name}
                  onClick={() => {
                    switchEnvironment(env);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-white/5 transition-colors ${
                    isSelected ? "text-emerald-400 font-semibold bg-emerald-950/30" : "text-gray-300"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full ${stage.dot}`} />
                    <span className="capitalize">{formattedName}</span>
                    <span
                      className={`border font-mono text-[9px] font-semibold px-1.5 py-0.2 rounded-full uppercase tracking-wider leading-none ml-1 ${stage.badge}`}
                    >
                      {stage.label}
                    </span>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
