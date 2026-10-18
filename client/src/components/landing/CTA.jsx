import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { ArrowRight, LayoutDashboard, Terminal } from "lucide-react";

export default function CTA() {
  const { user } = useAuth();

  return (
    <section className="relative py-24 md:py-32 bg-[#0d1117] overflow-hidden border-t border-white/5 text-center">
      {/* Subtle Animated Radial Emerald Glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-emerald-500/10 blur-[140px] rounded-full pointer-events-none -z-10"
        aria-hidden="true"
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 relative z-10">
        {/* Eyebrow */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/50 border border-emerald-800/40 text-emerald-300 text-xs font-mono"
        >
          <Terminal className="w-3.5 h-3.5 text-emerald-400" />
          <span>Instant Setup • No Complex Proxies Required</span>
        </motion.div>

        {/* Heading */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight"
        >
          Ready to secure your{" "}
          <span className="text-emerald-400">API infrastructure</span>?
        </motion.h2>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45, delay: 0.1, ease: "easeOut" }}
          className="text-sm sm:text-base text-gray-400 max-w-xl mx-auto leading-relaxed"
        >
          Bring API keys, upstream proxy routing, project access, and audit
          trails into one unified developer console.
        </motion.p>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45, delay: 0.2, ease: "easeOut" }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2"
        >
          {user ? (
            <Link
              to="/dashboard"
              className="btn-primary px-8 py-3 text-sm font-semibold"
            >
              <LayoutDashboard className="w-4 h-4" />
              Open Console
            </Link>
          ) : (
            <>
              <Link
                to="/register"
                className="btn-primary px-8 py-3 text-sm font-semibold"
              >
                Create Free Account
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/login"
                className="btn-secondary px-8 py-3 text-sm font-medium"
              >
                Sign In to Console
              </Link>
            </>
          )}
        </motion.div>
      </div>
    </section>
  );
}
