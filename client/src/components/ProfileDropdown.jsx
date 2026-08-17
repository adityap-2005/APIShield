/**
 * ProfileDropdown.jsx
 *
 * GitHub-inspired user profile dropdown menu in the top header.
 * Provides quick access to Personal Area (My Dashboard, My Profile, Personal Settings),
 * Organization Settings, and Sign out.
 */

import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useOrg } from "../context/OrgContext";
import {
  User,
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
        className="flex items-center gap-2 p-1 rounded-md hover:bg-[#21262d] transition-colors focus:outline-none"
        aria-label="User Menu"
      >
        <div className="w-7 h-7 rounded-full bg-[#1f6feb]/30 border border-[#58a6ff]/40 text-[#79c0ff] flex items-center justify-center text-xs font-bold font-mono shadow-xs">
          {initials}
        </div>
        <div className="text-left hidden sm:block">
          <div className="text-xs font-semibold text-[#f0f6fc] leading-tight">{user?.name}</div>
        </div>
        <ChevronDown className="w-3.5 h-3.5 text-[#8b949e]" />
      </button>

      {/* Menu Overlay */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-[#161b22] border border-[#30363d] rounded-lg shadow-2xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
          {/* User Info Header */}
          <div className="px-4 py-3 border-b border-[#30363d] bg-[#21262d]/40">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-[#1f6feb]/30 border border-[#58a6ff]/40 text-[#79c0ff] flex items-center justify-center text-sm font-bold font-mono">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-[#f0f6fc] truncate">{user?.name}</p>
                <p className="text-[11px] text-[#8b949e] font-mono truncate">{user?.email}</p>
              </div>
            </div>
          </div>

          {/* Personal Area Links */}
          <div className="py-1">
            <div className="px-3 py-1 text-[10px] font-bold text-[#8b949e] uppercase tracking-wider">
              Personal Area
            </div>
            <Link
              to="/dashboard"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-3 py-1.5 text-xs text-[#c9d1d9] hover:bg-[#21262d] hover:text-[#f0f6fc] transition-colors"
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-[#58a6ff]" />
              <span>My Dashboard</span>
            </Link>
            <Link
              to="/profile"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-3 py-1.5 text-xs text-[#c9d1d9] hover:bg-[#21262d] hover:text-[#f0f6fc] transition-colors"
            >
              <UserCheck className="w-3.5 h-3.5 text-green-400" />
              <span>My Profile</span>
            </Link>
            <Link
              to="/settings/personal"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-3 py-1.5 text-xs text-[#c9d1d9] hover:bg-[#21262d] hover:text-[#f0f6fc] transition-colors"
            >
              <Settings className="w-3.5 h-3.5 text-yellow-400" />
              <span>Personal Settings</span>
            </Link>
          </div>

          {/* Organization Area Link */}
          {activeOrg && (
            <div className="py-1 border-t border-[#30363d]">
              <div className="px-3 py-1 text-[10px] font-bold text-[#8b949e] uppercase tracking-wider">
                Organization: {activeOrg.name}
              </div>
              <Link
                to={`/org/${activeOrg._id}/settings`}
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2.5 px-3 py-1.5 text-xs text-[#c9d1d9] hover:bg-[#21262d] hover:text-[#f0f6fc] transition-colors"
              >
                <Building2 className="w-3.5 h-3.5 text-purple-400" />
                <span>Organization Settings</span>
              </Link>
            </div>
          )}

          {/* Logout */}
          <div className="py-1 border-t border-[#30363d]">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-3 py-1.5 text-xs text-red-400 hover:bg-red-950/40 transition-colors"
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
