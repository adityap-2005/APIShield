import { motion } from "framer-motion";
import { ShieldCheck, Quote } from "lucide-react";

export default function ProductPrinciple() {
  return (
    <section id="principle" className="py-20 bg-[#050505] border-t border-white/5">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative rounded-2xl border border-white/10 bg-[#0d0d12] p-8 sm:p-12 text-center space-y-6 shadow-2xl overflow-hidden"
        >
          {/* Subtle animated background glow */}
          <motion.div
            animate={{ opacity: [0.1, 0.2, 0.1] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-48 bg-purple-900/20 blur-[80px] rounded-full pointer-events-none"
          />

          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-950/60 border border-purple-800/40 text-purple-300 text-xs font-mono">
            <Quote className="w-3.5 h-3.5 text-purple-400" />
            <span>APIShield Product Principle</span>
          </div>

          {/* Main Statement */}
          <blockquote className="text-xl sm:text-2xl lg:text-3xl font-bold text-white tracking-tight leading-snug">
            "API credentials should be easy to manage without becoming easy to misuse."
          </blockquote>

          {/* Subtitle */}
          <p className="text-xs sm:text-sm text-gray-400 max-w-xl mx-auto leading-relaxed">
            APIShield is designed to give developers a clear, structured place to manage credentials, team access, and audit activity without complexity.
          </p>

          <div className="pt-2 flex items-center justify-center gap-2 text-xs text-gray-500 font-mono">
            <ShieldCheck className="w-4 h-4 text-purple-400" />
            <span>Security First • Transparent By Design</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
