import { motion } from "framer-motion";
import { KeyRound, Users, ShieldCheck, BarChart3, Lock } from "lucide-react";

export default function TrustSection() {
  const pillars = [
    { label: "API KEY MANAGEMENT", icon: KeyRound },
    { label: "TEAM ACCESS", icon: Users },
    { label: "AUDIT TRAIL", icon: ShieldCheck },
    { label: "USAGE INSIGHTS", icon: BarChart3 },
    { label: "SECURE CREDENTIALS", icon: Lock },
  ];

  return (
    <motion.section
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="border-y border-white/5 bg-[#0e131b] py-8"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
        <p className="text-[11px] font-mono tracking-widest text-gray-500 uppercase">
          Built for modern API teams
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 pt-1">
          {pillars.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.08 }}
                whileHover={{ y: -2, transition: { duration: 0.15 } }}
                className="flex items-center gap-2 text-xs font-mono text-gray-400 px-3 py-1.5 rounded-md border border-white/5 bg-[#161b22] hover:border-blue-500/30 hover:text-blue-300 transition-colors"
              >
                <Icon className="w-3.5 h-3.5 text-blue-400" />
                <span>{item.label}</span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.section>
  );
}
