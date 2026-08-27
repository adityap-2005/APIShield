import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import ProfileDropdown from "../ProfileDropdown";
import { ShieldCheck, Menu, X, ArrowRight, LayoutDashboard } from "lucide-react";

export default function Navbar() {
  const { user, isLoading } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <motion.header
      initial={{ opacity: 0, y: -15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="sticky top-0 z-50 border-b border-white/10 bg-[#050505]/90 backdrop-blur-md"
    >
      {/* Announcement Bar */}
      <div className="border-b border-purple-500/20 bg-purple-950/40 px-4 py-1.5 text-center text-xs text-purple-200">
        <span>APIShield V1 is now live</span>
        <span className="mx-2 text-purple-400">→</span>
        <a
          href="#features"
          className="font-medium text-purple-300 hover:text-white transition-colors underline-offset-2 hover:underline"
        >
          Explore the platform &rarr;
        </a>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center text-white shadow-sm shadow-purple-500/30 group-hover:bg-purple-500 transition-colors">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <span className="font-bold text-white text-base tracking-tight">
            APIShield
          </span>
        </Link>

        {/* Center Desktop Links */}
        <nav className="hidden md:flex items-center gap-8 text-xs font-medium text-gray-400">
          <a href="#features" className="hover:text-white transition-colors">
            Product
          </a>
          <a href="#features" className="hover:text-white transition-colors">
            Developers
          </a>
          <a href="#value" className="hover:text-white transition-colors">
            Solutions
          </a>
          <a href="#principle" className="hover:text-white transition-colors">
            Documentation
          </a>
        </nav>

        {/* Right Action Buttons */}
        <div className="hidden md:flex items-center gap-3">
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white/20 border-t-purple-500 rounded-full animate-spin" />
          ) : user ? (
            <div className="flex items-center gap-3">
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-1.5 rounded-md bg-purple-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm shadow-purple-500/20 hover:bg-purple-500 transition-colors"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                Dashboard
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
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                transition={{ duration: 0.15 }}
              >
                <Link
                  to="/register"
                  className="inline-flex items-center gap-1 rounded-md bg-purple-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm shadow-purple-500/20 hover:bg-purple-500 transition-colors"
                >
                  Get Started
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </motion.div>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="flex md:hidden items-center gap-2">
          {user && <ProfileDropdown />}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="text-gray-400 hover:text-white p-1.5 focus:outline-none"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-white/10 bg-[#0a0a0c] px-4 py-4 space-y-3">
          <nav className="flex flex-col gap-2.5 text-sm text-gray-300">
            <a
              href="#features"
              onClick={() => setIsMobileMenuOpen(false)}
              className="py-1 hover:text-white"
            >
              Product
            </a>
            <a
              href="#features"
              onClick={() => setIsMobileMenuOpen(false)}
              className="py-1 hover:text-white"
            >
              Developers
            </a>
            <a
              href="#value"
              onClick={() => setIsMobileMenuOpen(false)}
              className="py-1 hover:text-white"
            >
              Solutions
            </a>
            <a
              href="#principle"
              onClick={() => setIsMobileMenuOpen(false)}
              className="py-1 hover:text-white"
            >
              Documentation
            </a>
          </nav>

          <div className="pt-3 border-t border-white/10 flex flex-col gap-2">
            {user ? (
              <Link
                to="/dashboard"
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full text-center py-2 rounded-md bg-purple-600 text-xs font-semibold text-white"
              >
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full text-center py-2 rounded-md border border-white/10 text-xs font-medium text-gray-300 hover:text-white"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full text-center py-2 rounded-md bg-purple-600 text-xs font-semibold text-white"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </motion.header>
  );
}
