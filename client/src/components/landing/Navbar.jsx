import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import BrandLogo from "../BrandLogo";
import ProfileDropdown from "../ProfileDropdown";
import { Menu, X, ArrowRight, LayoutDashboard } from "lucide-react";

export default function Navbar() {
  const { user, isLoading } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: "Features", href: "#features" },
    { label: "Architecture", href: "#how-it-works" },
    { label: "Security", href: "#security" },
    { label: "Telemetry", href: "#telemetry" },
  ];

  return (
    <motion.header
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="sticky top-0 z-50 border-b border-white/10 bg-[#0d1117]/95 backdrop-blur-md"
    >
      {/* Announcement Bar */}
      <div className="border-b border-emerald-500/20 bg-emerald-950/40 px-4 py-1.5 text-center text-xs text-emerald-300">
        <span className="font-medium">APIShield Gateway Console is live</span>
        <span className="mx-2 text-emerald-500">→</span>
        <a
          href="#features"
          className="text-emerald-400 hover:text-emerald-200 transition-colors underline-offset-2 hover:underline font-mono text-[11px]"
        >
          Explore platform capabilities &rarr;
        </a>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <BrandLogo size="md" to="/" />

        {/* Center Desktop Links */}
        <nav className="hidden md:flex items-center gap-8 text-xs font-medium text-gray-400">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="hover:text-white transition-colors"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Right Action Buttons */}
        <div className="hidden md:flex items-center gap-3">
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white/20 border-t-emerald-500 rounded-full animate-spin" />
          ) : user ? (
            <div className="flex items-center gap-3">
              <Link
                to="/dashboard"
                className="btn-primary py-1.5 px-3.5"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                Console
              </Link>
              <ProfileDropdown />
            </div>
          ) : (
            <>
              <Link
                to="/login"
                className="text-xs font-medium text-gray-300 hover:text-white px-3 py-1.5 transition-colors"
              >
                Sign in
              </Link>
              <Link
                to="/register"
                className="btn-primary py-1.5 px-3.5"
              >
                Get Started
                <ArrowRight className="w-3 h-3" />
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="flex md:hidden items-center gap-2">
          {user && <ProfileDropdown />}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="text-gray-400 hover:text-white p-2 rounded-lg border border-white/10 bg-[#161b22] focus:outline-none"
            aria-label="Toggle navigation menu"
          >
            {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-white/10 bg-[#161b22] px-4 py-4 space-y-4"
          >
            <nav className="flex flex-col gap-2.5 text-sm text-gray-300">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="py-1.5 px-2 rounded hover:bg-white/5 hover:text-white transition-colors"
                >
                  {link.label}
                </a>
              ))}
            </nav>

            <div className="pt-3 border-t border-white/10 flex flex-col gap-2">
              {user ? (
                <Link
                  to="/dashboard"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="btn-primary w-full py-2.5 text-xs text-center"
                >
                  Go to Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="w-full text-center py-2 rounded-lg border border-white/10 bg-[#1c2128] text-xs font-medium text-gray-300 hover:text-white transition-colors"
                  >
                    Sign in
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="btn-primary w-full py-2.5 text-xs text-center"
                  >
                    Get Started Free
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
