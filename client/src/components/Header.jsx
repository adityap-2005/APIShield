/**
 * Header.jsx
 *
 * Top navigation header containing:
 * - Mobile Menu Hamburger toggle
 * - Brand logo & link
 * - Organization Selector dropdown (OrgSelector)
 * - User Profile & Navigation dropdown (ProfileDropdown)
 */

import { Link } from "react-router-dom";
import OrgSelector from "./OrgSelector";
import ProfileDropdown from "./ProfileDropdown";
import { Menu, ShieldCheck } from "lucide-react";

export default function Header({ onMobileMenuToggle }) {
  return (
    <header className="h-16 bg-[#131822]/90 backdrop-blur-md border-b border-white/10 px-4 sm:px-6 flex items-center justify-between shrink-0 sticky top-0 z-30">
      {/* Left Area: Mobile Hamburger + Brand / OrgSelector */}
      <div className="flex items-center gap-3">
        {/* Mobile Hamburger Toggle */}
        <button
          onClick={onMobileMenuToggle}
          className="p-1.5 rounded-md border border-white/10 bg-[#121216] text-gray-400 hover:text-white hover:border-white/20 lg:hidden transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Brand Link */}
        <Link to="/" className="flex items-center gap-2 font-bold text-white text-sm tracking-tight hover:opacity-90 transition-opacity">
          <div className="w-6 h-6 rounded bg-[#2f81f7] flex items-center justify-center text-white lg:hidden">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <span className="hidden sm:inline-block font-bold text-xs text-white">APIShield</span>
        </Link>

        <span className="text-white/20 font-light hidden sm:inline-block">/</span>

        {/* Organization Selector */}
        <OrgSelector />
      </div>

      {/* Right Area: Profile Dropdown */}
      <div className="flex items-center gap-3">
        <ProfileDropdown />
      </div>
    </header>
  );
}
