import { motion } from "framer-motion";
import { KeyRound, Server, ShieldCheck, Activity, Lock, FolderKanban } from "lucide-react";

export default function TrustSection() {
  const pillars = [
    { label: "SCOPED API KEYS", icon: KeyRound },
    { label: "GATEWAY ROUTING", icon: Server },
    { label: "PROJECT ISOLATION", icon: FolderKanban },
    { label: "INSTANT REVOCATION", icon: Lock },
    { label: "AUDIT TRAILS", icon: ShieldCheck },
    { label: "REAL-TIME TELEMETRY", icon: Activity },
  ];

  return (
    <section className="border-y border-white/5 bg-[#0e131b] py-8 select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
        <p className="text-[11px] font-mono tracking-widest text-gray-500 uppercase">
          Engineered for reliable developer infrastructure
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 pt-1">
          {pillars.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: index * 0.05 }}
                whileHover={{ y: -2, transition: { duration: 0.15 } }}
                className="flex items-center gap-2 text-xs font-mono text-gray-400 px-3.5 py-1.5 rounded-lg border border-white/5 bg-[#161b22] hover:border-emerald-500/40 hover:text-emerald-300 transition-colors"
              >
                <Icon className="w-3.5 h-3.5 text-emerald-400" />
                <span>{item.label}</span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
