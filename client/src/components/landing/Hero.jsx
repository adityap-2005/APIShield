import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import DashboardPreview from "./DashboardPreview";
import { ArrowRight, Shield, Terminal } from "lucide-react";

export default function Hero() {
  const { user } = useAuth();

  return (
    <section className="relative pt-12 pb-20 md:pt-20 md:pb-28 overflow-hidden">
      {/* Background Radial Tint */}
      <motion.div
        animate={{ opacity: [0.15, 0.25, 0.15] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-blue-900/20 blur-[120px] rounded-full pointer-events-none -z-10"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Staggered Content Reveal */}
          <div className="lg:col-span-6 space-y-6 text-left">
            {/* 1. Eyebrow Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-950/50 border border-blue-800/40 text-blue-300 text-xs font-mono"
            >
              <Shield className="w-3.5 h-3.5 text-blue-400" />
              <span>Unified API Credential Security</span>
            </motion.div>

            {/* 2. Main Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.1]"
            >
              Secure and manage your{" "}
              <span className="text-blue-400">
                API keys
              </span>{" "}
              with confidence.
            </motion.h1>

            {/* 3. Subheading Description */}
            <motion.p
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.25 }}
              className="text-base text-gray-400 max-w-xl leading-relaxed"
            >
              APIShield helps developers and teams create, manage, rotate, and monitor API credentials from one secure workspace.
            </motion.p>

            {/* 4. Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2"
            >
              {user ? (
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ duration: 0.15 }}
                >
                  <Link
                    to="/dashboard"
                    className="inline-flex items-center justify-center gap-2 rounded-md bg-[#2f81f7] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 hover:bg-[#58a6ff] transition-colors w-full sm:w-auto"
                  >
                    Go to Dashboard
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </motion.div>
              ) : (
                <>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ duration: 0.15 }}
                  >
                    <Link
                      to="/register"
                      className="inline-flex items-center justify-center gap-2 rounded-md bg-white px-6 py-3 text-sm font-semibold text-gray-950 hover:bg-gray-100 transition-colors shadow-lg w-full sm:w-auto"
                    >
                      Get started
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </motion.div>
                  <a
                    href="#features"
                    className="inline-flex items-center justify-center gap-2 rounded-md border border-white/10 bg-[#1c2128] px-6 py-3 text-sm font-medium text-gray-300 hover:text-white hover:border-white/20 transition-colors"
                  >
                    View documentation
                  </a>
                </>
              )}
            </motion.div>

            {/* 5. Developer Sub-label */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.55 }}
              className="pt-2 flex items-center gap-2 text-xs text-gray-500 font-mono"
            >
              <Terminal className="w-3.5 h-3.5 text-blue-400" />
              <span>Built for developers who care about secure API access.</span>
            </motion.div>
          </div>

          {/* Right Column: Dashboard Entrance */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="lg:col-span-6 w-full"
          >
            <DashboardPreview />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
