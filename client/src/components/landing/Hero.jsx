import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import DashboardPreview from "./DashboardPreview";
import { BrandSymbol } from "../BrandLogo";
import { ArrowRight, Terminal, Shield, CheckCircle2 } from "lucide-react";

export default function Hero() {
  const { user } = useAuth();

  return (
    <section className="relative pt-12 pb-20 md:pt-20 md:pb-28 overflow-hidden">
      {/* Background Radial Tint (Emerald Restrained Ambient Glow) */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[350px] bg-emerald-500/10 blur-[130px] rounded-full pointer-events-none -z-10"
        aria-hidden="true"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Staggered Content Reveal */}
          <div className="lg:col-span-6 space-y-6 text-left">
            {/* 1. Eyebrow Badge */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/50 border border-emerald-800/40 text-emerald-300 text-xs font-mono"
            >
              <BrandSymbol className="w-3.5 h-3.5" />
              <span>Unified API Security &amp; Gateway Console</span>
            </motion.div>

            {/* 2. Main Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.08]"
            >
              Secure and manage your{" "}
              <span className="text-emerald-400">APIs</span> from one place.
            </motion.h1>

            {/* 3. Subheading Description */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-base text-gray-400 max-w-xl leading-relaxed"
            >
              Create, rotate, and revoke scoped API keys, route traffic securely
              through upstream integrations, and monitor gateway telemetry with
              fine-grained organization and project controls.
            </motion.p>

            {/* 4. Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2"
            >
              {user ? (
                <Link
                  to="/dashboard"
                  className="btn-primary px-6 py-3 text-sm justify-center sm:w-auto"
                >
                  Open Console
                  <ArrowRight className="w-4 h-4" />
                </Link>
              ) : (
                <>
                  <Link
                    to="/register"
                    className="btn-primary px-6 py-3 text-sm justify-center sm:w-auto"
                  >
                    Get Started Free
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <a
                    href="#how-it-works"
                    className="btn-secondary px-6 py-3 text-sm justify-center sm:w-auto"
                  >
                    Explore Architecture
                  </a>
                </>
              )}
            </motion.div>

            {/* 5. Terminal CLI Preview / Trust Badges */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="pt-2 space-y-2"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/5 bg-[#0e131b] font-mono text-xs text-gray-400 overflow-x-auto max-w-full">
                <Terminal className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="text-gray-500">curl -H</span>
                <span className="text-emerald-300">"x-api-key: aps_live_•••"</span>
                <span className="text-gray-400">https://api.apishield.io/gateway/...</span>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-[11px] text-gray-400 font-mono">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Zero gateway latency overhead
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  SHA-256 hashed keys
                </span>
              </div>
            </motion.div>
          </div>

          {/* Right Column: Console Preview Entrance */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.15, ease: "easeOut" }}
            className="lg:col-span-6 w-full"
          >
            <DashboardPreview />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
