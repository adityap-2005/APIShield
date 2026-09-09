/**
 * ProfileDropdown.jsx
 *
 * User profile dropdown menu in the top header.
 * Provides quick access to Personal Area (My Dashboard, My Profile, Personal Settings),
 * Organization Settings, and Sign out.
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
  ChevronDown
} from "lucide-react";

export default function ProfileDropdown() {
  const { user, logout } = useAuth();
  const { activeOrg } = useOrg();
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

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "AP";

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
        className="flex items-center gap-2 p-1 rounded-md hover:bg-white/5 transition-colors focus:outline-none"
        aria-label="User Menu"
      >
        <div className="w-7 h-7 rounded-full bg-blue-950/60 border border-blue-800/40 text-blue-300 flex items-center justify-center text-xs font-bold font-mono">
          {initials}
        </div>
        <div className="text-left hidden sm:block">
          <div className="text-xs font-medium text-white leading-tight">{user?.name}</div>
        </div>
        <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
      </button>

      {/* Menu Overlay */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-[#161b22] border border-white/10 rounded-xl shadow-2xl shadow-blue-950/20 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
          {/* User Info Header */}
          <div className="px-4 py-3 border-b border-white/5 bg-[#1c2128]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-blue-950/60 border border-blue-800/40 text-blue-300 flex items-center justify-center text-xs font-bold font-mono">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-white truncate">{user?.name}</p>
                <p className="text-[11px] text-gray-400 font-mono truncate">{user?.email}</p>
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
              <LayoutDashboard className="w-3.5 h-3.5 text-blue-400" />
              <span>My Dashboard</span>
            </Link>
            <Link
              to="/profile"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-3 py-1.5 text-xs text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
            >
              <UserCheck className="w-3.5 h-3.5 text-green-400" />
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
              <div className="px-3 py-1 text-[10px] font-mono font-semibold text-gray-500 uppercase tracking-wider">
                Workspace: {activeOrg.name}
              </div>
              <Link
                to={`/org/${activeOrg._id}/settings`}
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2.5 px-3 py-1.5 text-xs text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
              >
                <Building2 className="w-3.5 h-3.5 text-blue-400" />
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
