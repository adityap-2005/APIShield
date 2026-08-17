/**
 * Header.jsx
 *
 * Top navigation header containing:
 * - Mobile Menu Hamburger toggle (☰)
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
    <header className="h-16 bg-[#161b22] border-b border-[#30363d] px-4 sm:px-6 flex items-center justify-between shrink-0 sticky top-0 z-30">
      {/* Left Area: Mobile Hamburger + Brand / OrgSelector */}
      <div className="flex items-center gap-3">
        {/* Mobile Hamburger Toggle */}
        <button
          onClick={onMobileMenuToggle}
          className="p-1.5 rounded-md border border-[#30363d] bg-[#21262d] text-[#c9d1d9] hover:text-[#f0f6fc] hover:bg-[#30363d] lg:hidden transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Brand Link */}
        <Link to="/dashboard" className="flex items-center gap-2 font-bold text-[#f0f6fc] text-sm tracking-tight hover:opacity-90 transition-opacity">
          <ShieldCheck className="w-5 h-5 text-[#238636] lg:hidden" />
          <span className="hidden sm:inline-block font-mono text-xs text-[#8b949e]">APIShield</span>
        </Link>

        <span className="text-[#30363d] font-light hidden sm:inline-block">/</span>

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
