import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { ArrowRight } from "lucide-react";

export default function CTA() {
  const { user } = useAuth();

  return (
    <section className="relative py-24 md:py-32 bg-[#050505] overflow-hidden border-t border-white/5 text-center">
      {/* Subtle Animated Radial Purple Glow */}
      <motion.div
        animate={{ opacity: [0.35, 0.55, 0.35] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-purple-900/30 blur-[130px] rounded-full pointer-events-none -z-10"
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 relative z-10">
        {/* Animated Heading */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight"
        >
          Start managing your{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-purple-200">
            API credentials
          </span>{" "}
          today.
        </motion.h2>

        {/* Animated Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.15, ease: "easeOut" }}
          className="text-sm sm:text-base text-gray-400 max-w-xl mx-auto leading-relaxed"
        >
          Bring API keys, teams, access control, usage, and audit activity into one unified workspace.
        </motion.p>

        {/* Animated Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2"
        >
          {user ? (
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              transition={{ duration: 0.15 }}
            >
              <Link
                to="/dashboard"
                className="inline-flex items-center justify-center gap-2 rounded-md bg-white px-7 py-3 text-sm font-semibold text-gray-950 hover:bg-gray-100 transition-colors shadow-lg"
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
                  className="inline-flex items-center justify-center gap-2 rounded-md bg-white px-7 py-3 text-sm font-semibold text-gray-950 hover:bg-gray-100 transition-colors shadow-lg"
                >
                  Get started
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </motion.div>
              <a
                href="#features"
                className="inline-flex items-center justify-center gap-2 rounded-md border border-white/10 bg-[#121216] px-6 py-3 text-sm font-medium text-gray-300 hover:text-white hover:border-white/20 transition-colors"
              >
                View documentation
              </a>
            </>
          )}
        </motion.div>
      </div>
    </section>
  );
}
