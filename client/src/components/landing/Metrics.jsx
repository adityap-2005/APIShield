import { motion } from "framer-motion";

export default function Metrics() {
  const metrics = [
    {
      value: "1",
      label: "Centralized workspace",
      description: "All keys, teams, and audit logs managed from a single place.",
    },
    {
      value: "Teams",
      label: "Organized access",
      description: "Granular role-based permissions per team and workspace.",
    },
    {
      value: "API Keys",
      label: "Managed securely",
      description: "Scoped, hash-verified credentials with full lifecycle control.",
    },
    {
      value: "Audit Ready",
      label: "Track important actions",
      description: "Immutable event logs for every rotation and member change.",
    },
  ];

  return (
    <section id="value" className="py-20 bg-[#0e131b] border-t border-white/5 text-left">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="space-y-2 text-center max-w-2xl mx-auto"
        >
          <p className="text-xs font-mono text-blue-400 uppercase tracking-widest">
            // RELIABLE BY DESIGN
          </p>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">
            Engineered for reliable credential control
          </h2>
          <p className="text-sm text-gray-400">
            Clear, honest architecture built for developer productivity and peace of mind.
          </p>
        </motion.div>

        {/* 4 Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {metrics.map((m, index) => (
            <motion.div
              key={m.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: index * 0.1, ease: "easeOut" }}
              whileHover={{ y: -3, transition: { duration: 0.2 } }}
              className="rounded-xl border border-white/10 bg-[#161b22] p-6 space-y-3 hover:border-blue-500/30 transition-colors"
            >
              <div className="text-3xl font-extrabold font-mono text-blue-300">
                {m.value}
              </div>
              <h3 className="text-sm font-bold text-white tracking-tight">
                {m.label}
              </h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                {m.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
