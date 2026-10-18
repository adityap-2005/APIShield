import { motion } from "framer-motion";
import { BrandSymbol } from "../BrandLogo";
import { Terminal, Shield, ArrowRight, Server, CheckCircle2, Lock } from "lucide-react";

export default function ProductPrinciple() {
  const flowSteps = [
    {
      step: "01",
      title: "Client Request with Scoped Key",
      description:
        "Client sends an HTTP request with the header 'x-api-key: aps_live_...'. No origin credentials or master passwords are ever exposed to the client.",
      icon: Terminal,
      highlight: "Ingress Verification",
    },
    {
      step: "02",
      title: "Gateway Policy & Hash Authorization",
      description:
        "APIShield matches the key hash, evaluates active project permissions, enforces RBAC rules, and decrypts the upstream credential in memory.",
      icon: Shield,
      highlight: "Zero-Trust Gate",
    },
    {
      step: "03",
      title: "Upstream Execution & Telemetry",
      description:
        "Request is securely proxied to your upstream API. Response latency, HTTP status, and audit records are captured asynchronously without overhead.",
      icon: Server,
      highlight: "Secure Proxy & Logs",
    },
  ];

  return (
    <section id="how-it-works" className="py-20 md:py-28 bg-[#0d1117] border-t border-white/5 text-left">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="space-y-3"
        >
          <div className="inline-flex items-center gap-1.5 text-xs font-mono text-emerald-400 uppercase tracking-widest">
            <span>// ARCHITECTURE &amp; FLOW</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            How APIShield guards your gateway traffic
          </h2>
          <p className="text-sm text-gray-400 max-w-2xl leading-relaxed">
            A high-performance reverse proxy that authenticates keys, insulates
            backend services, and records immutable telemetry.
          </p>
        </motion.div>

        {/* 3-Step Flow Diagram */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          {flowSteps.map((step, index) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: index * 0.1, ease: "easeOut" }}
                className="relative rounded-xl border border-white/10 bg-[#161b22] p-6 space-y-4 hover:border-emerald-500/40 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-2xl font-black text-emerald-400/40">
                    {step.step}
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-emerald-950/60 border border-emerald-800/40 text-emerald-400 flex items-center justify-center">
                    <Icon className="w-4 h-4" />
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] font-mono text-emerald-400 tracking-wider uppercase font-semibold">
                    {step.highlight}
                  </span>
                  <h3 className="text-base font-bold text-white tracking-tight">
                    {step.title}
                  </h3>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Core Product Principle Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="relative rounded-2xl border border-white/10 bg-[#161b22] p-8 sm:p-12 text-center space-y-5 shadow-2xl overflow-hidden"
        >
          {/* Subtle emerald ambient glow */}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-48 bg-emerald-500/10 blur-[90px] rounded-full pointer-events-none"
            aria-hidden="true"
          />

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-800/40 text-emerald-300 text-xs font-mono">
            <BrandSymbol className="w-3.5 h-3.5" />
            <span>Product Principle</span>
          </div>

          <blockquote className="text-xl sm:text-2xl lg:text-3xl font-bold text-white tracking-tight leading-snug max-w-2xl mx-auto">
            "API credentials should be easy to manage without becoming easy to misuse."
          </blockquote>

          <p className="text-xs sm:text-sm text-gray-400 max-w-xl mx-auto leading-relaxed">
            APIShield is built to give engineering teams a single, structured
            cockpit for credential lifecycle, upstream security, and real-time
            observability.
          </p>

          <div className="pt-2 flex items-center justify-center gap-2 text-xs text-emerald-400 font-mono">
            <Lock className="w-3.5 h-3.5" />
            <span>Security by default • Transparent by design</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
