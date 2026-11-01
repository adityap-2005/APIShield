/**
 * ProfileDropdown.jsx
 *
 * User profile dropdown menu in the top header.
 * Displays the authenticated user's name and role for the current organization context.
 * Provides quick access to Personal Area, Workspace Settings, and Sign out.
 */

import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useOrg } from "../context/OrgContext";
import {
  LayoutDashboard,
  UserCheck,
  Settings,
  Building2,
  LogOut,
  ChevronDown,
  Shield,
} from "lucide-react";

export default function ProfileDropdown() {
  const { user, logout, isLoading: authLoading } = useAuth();
  const { activeOrg, isLoading: orgLoading } = useOrg();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on click outside or Escape key
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

  // Derived user display properties
  const displayName = user?.name || (user?.email ? user.email.split("@")[0] : "User");

  const initials = user?.name
    ? user.name
        .split(" ")
        .filter(Boolean)
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user?.email
    ? user.email.slice(0, 2).toUpperCase()
    : "U";

  // Role display logic matching context
  let displayRole = "Role unavailable";
  if (authLoading || orgLoading) {
    displayRole = "Loading...";
  } else if (activeOrg?.role) {
    displayRole =
      activeOrg.role.charAt(0).toUpperCase() +
      activeOrg.role.slice(1).toLowerCase().replace(/_/g, " ");
  } else if (!activeOrg) {
    displayRole = "No Workspace";
  }

  const handleLogout = () => {
    setIsOpen(false);
    logout();
    navigate("/login");
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1 rounded-lg hover:bg-white/5 transition-colors focus:outline-none focus:ring-1 focus:ring-emerald-500/40"
        aria-label="User Menu"
        aria-expanded={isOpen}
      >
        <div className="w-7 h-7 rounded-full bg-slate-800 border border-white/10 text-emerald-400 flex items-center justify-center text-xs font-bold font-mono shrink-0">
          {initials}
        </div>
        <div className="text-left hidden sm:block max-w-[130px]">
          <div className="text-xs font-medium text-white leading-tight truncate">
            {displayName}
          </div>
          <div className="text-[10px] text-gray-400 leading-tight truncate">
            {displayRole}
          </div>
        </div>
        <ChevronDown className="w-3.5 h-3.5 text-gray-400 shrink-0" />
      </button>

      {/* Menu Overlay */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 max-w-[calc(100vw-2rem)] bg-[#161b22] border border-white/10 rounded-xl shadow-2xl shadow-black/60 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
          {/* User Info Header with Role */}
          <div className="px-4 py-3 border-b border-white/5 bg-[#1c2128]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-emerald-950/60 border border-emerald-800/40 text-emerald-400 flex items-center justify-center text-xs font-bold font-mono shrink-0">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-white truncate">{displayName}</p>
                <p className="text-[11px] text-gray-400 font-mono truncate">{user?.email || "No email"}</p>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <Shield className="w-2.5 h-2.5" />
                    <span>{displayRole}</span>
                  </span>
                  {activeOrg?.name && (
                    <span className="text-[10px] text-gray-400 font-mono truncate max-w-[100px]" title={activeOrg.name}>
                      {activeOrg.name}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Personal Area Links */}
          <div className="py-1">
            <div className="px-3 py-1 text-[10px] font-mono font-semibold text-gray-500 uppercase tracking-wider">
              Personal Area
            </div>
            <Link
              to="/dashboard"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-3 py-1.5 text-xs text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-emerald-400" />
              <span>My Dashboard</span>
            </Link>
            <Link
              to="/profile"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-3 py-1.5 text-xs text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
            >
              <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>My Profile</span>
            </Link>
            <Link
              to="/settings/personal"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-3 py-1.5 text-xs text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
            >
              <Settings className="w-3.5 h-3.5 text-gray-400" />
              <span>Personal Settings</span>
            </Link>
          </div>

          {/* Organization Area Link */}
          {activeOrg && (
            <div className="py-1 border-t border-white/5">
              <div className="px-3 py-1 text-[10px] font-mono font-semibold text-gray-500 uppercase tracking-wider truncate">
                Workspace: {activeOrg.name}
              </div>
              <Link
                to={`/org/${activeOrg._id}/settings`}
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2.5 px-3 py-1.5 text-xs text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
              >
                <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Workspace Settings</span>
              </Link>
            </div>
          )}

          {/* Logout */}
          <div className="py-1 border-t border-white/5">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-3 py-1.5 text-xs text-red-400 hover:bg-red-950/40 hover:text-red-300 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
