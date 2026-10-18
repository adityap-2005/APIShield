import { motion } from "framer-motion";
import { Zap, ShieldCheck, RefreshCw, FileText } from "lucide-react";

export default function Metrics() {
  const metrics = [
    {
      value: "< 2ms",
      label: "Gateway Proxy Overhead",
      description:
        "High-throughput reverse proxy routing with instant key validation and async telemetry recording.",
      icon: Zap,
    },
    {
      value: "SHA-256",
      label: "Hashed Key Storage",
      description:
        "API secrets are securely salted and hashed. Raw tokens are never persisted in plaintext.",
      icon: ShieldCheck,
    },
    {
      value: "0-Downtime",
      label: "Credential Rotation",
      description:
        "Seamless key rotation workflow prevents service interruptions during security updates.",
      icon: RefreshCw,
    },
    {
      value: "100%",
      label: "Audit Coverage",
      description:
        "Every key creation, revocation, and role assignment is captured in immutable audit events.",
      icon: FileText,
    },
  ];

  return (
    <section id="security" className="py-20 bg-[#0e131b] border-t border-white/5 text-left">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="space-y-2 text-center max-w-2xl mx-auto"
        >
          <p className="text-xs font-mono text-emerald-400 uppercase tracking-widest">
            // SECURITY &amp; RELIABILITY
          </p>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">
            Engineered for predictable API operations
          </h2>
          <p className="text-sm text-gray-400">
            Hardened security primitives designed for developer peace of mind.
          </p>
        </motion.div>

        {/* 4 Cards Grid */}
        <div id="telemetry" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {metrics.map((m, index) => {
            const Icon = m.icon;
            return (
              <motion.div
                key={m.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.08, ease: "easeOut" }}
                whileHover={{ y: -3, transition: { duration: 0.2 } }}
                className="rounded-xl border border-white/10 bg-[#161b22] p-6 space-y-3.5 hover:border-emerald-500/40 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="text-3xl font-extrabold font-mono text-emerald-400">
                    {m.value}
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-emerald-950/60 border border-emerald-800/40 text-emerald-400 flex items-center justify-center">
                    <Icon className="w-4 h-4" />
                  </div>
                </div>

                <h3 className="text-sm font-bold text-white tracking-tight">
                  {m.label}
                </h3>
                <p className="text-xs text-gray-400 leading-relaxed">
                  {m.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
