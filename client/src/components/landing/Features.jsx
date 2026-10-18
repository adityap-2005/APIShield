import { motion } from "framer-motion";
import {
  KeyRound,
  Server,
  Users,
  FileText,
  BarChart3,
  ShieldCheck,
  Check,
} from "lucide-react";

export default function Features() {
  const featureList = [
    {
      id: "keys",
      title: "API Key Lifecycle & Instant Revocation",
      description:
        "Generate scoped, prefixed credentials (aps_...) with custom permissions, rotation schedules, and one-click revocation that takes effect across the gateway instantly.",
      icon: KeyRound,
      badge: "CREDENTIAL SECURITY",
      content: (
        <div className="rounded-lg border border-white/5 bg-[#0e131b] p-3.5 font-mono text-[11px] text-gray-300 space-y-1.5 overflow-x-auto">
          <div className="text-gray-500 text-[10px] pb-1 border-b border-white/5 flex items-center justify-between">
            <span>curl command</span>
            <span className="text-emerald-400">bash</span>
          </div>
          <p className="text-gray-400">curl -X GET \</p>
          <p className="pl-4 text-gray-400">
            -H <span className="text-emerald-300">"x-api-key: aps_live_948f21•••"</span> \
          </p>
          <p className="pl-4 text-gray-400">
            https://gateway.apishield.io/v1/orders
          </p>
          <div className="pt-1 flex items-center gap-2 text-[10px] text-emerald-400">
            <Check className="w-3 h-3" />
            <span>Key hash verified • Scope: [read:orders]</span>
          </div>
        </div>
      ),
    },
    {
      id: "gateway",
      title: "Upstream API Integrations & Gateway Proxy",
      description:
        "Keep origin credentials confidential. The APIShield proxy authenticates incoming calls, injects encrypted upstream secrets, and proxies traffic smoothly to your services.",
      icon: Server,
      badge: "GATEWAY ROUTING",
      content: (
        <div className="rounded-lg border border-white/5 bg-[#0e131b] p-3 space-y-2 text-xs font-mono">
          <div className="flex items-center justify-between py-1 px-2 rounded bg-white/5">
            <span className="text-gray-400 text-[11px]">Ingress</span>
            <span className="text-emerald-400 text-[11px]">POST /gateway/stripe/charge</span>
          </div>
          <div className="flex items-center justify-between py-1 px-2 rounded bg-white/5">
            <span className="text-gray-400 text-[11px]">Upstream</span>
            <span className="text-gray-200 text-[11px]">api.stripe.com/v1/charges</span>
          </div>
          <div className="flex items-center justify-between text-[10px] text-gray-500 pt-0.5">
            <span>Secret Masking: Enabled</span>
            <span className="text-emerald-400">Proxy Overhead: &lt; 2ms</span>
          </div>
        </div>
      ),
    },
    {
      id: "projects",
      title: "Multi-Tenant Organization & Project Hierarchy",
      description:
        "Structure resources logically. Organizations contain Projects, which encapsulate API Keys, Integrations, and Member roles with zero cross-project leakage.",
      icon: Users,
      badge: "ACCESS GOVERNANCE",
      content: (
        <div className="rounded-lg border border-white/5 bg-[#0e131b] p-3 space-y-2 text-xs">
          <div className="flex items-center justify-between py-1 px-2 rounded bg-white/5">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold flex items-center justify-center font-mono">
                SA
              </div>
              <span className="text-gray-200 text-[11px]">lead-architect@corp.io</span>
            </div>
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/40">
              OWNER
            </span>
          </div>
          <div className="flex items-center justify-between py-1 px-2 rounded hover:bg-white/5">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-bold flex items-center justify-center font-mono">
                DE
              </div>
              <span className="text-gray-300 text-[11px]">backend-dev@corp.io</span>
            </div>
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800/40">
              MEMBER
            </span>
          </div>
        </div>
      ),
    },
    {
      id: "analytics",
      title: "Gateway Telemetry & Endpoint Analytics",
      description:
        "Inspect real-time request volume, latency distributions, and status codes (2xx, 4xx, 5xx). Identify high-traffic endpoints and latency spikes instantly.",
      icon: BarChart3,
      badge: "TELEMETRY",
      content: (
        <div className="rounded-lg border border-white/5 bg-[#0e131b] p-3.5 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-300 font-mono">Gateway Health</span>
            <span className="text-emerald-400 font-mono text-[11px] font-semibold">
              99.98% Success
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden flex">
            <div className="h-full bg-emerald-400 w-[99.2%]" />
            <div className="h-full bg-amber-400 w-[0.6%]" />
            <div className="h-full bg-red-400 w-[0.2%]" />
          </div>
          <div className="flex items-center justify-between text-[10px] font-mono text-gray-500 pt-1">
            <span>200 OK (99.2%)</span>
            <span>401 Unauthorized (0.6%)</span>
            <span>500 Error (0.2%)</span>
          </div>
        </div>
      ),
    },
    {
      id: "audit",
      title: "Real-Time Immutable Audit Logging",
      description:
        "Full audit trail for every credential generated, rotated, or revoked, as well as team membership changes, complete with actor attribution and timestamps.",
      icon: FileText,
      badge: "COMPLIANCE & AUDIT",
      content: (
        <div className="rounded-lg border border-white/5 bg-[#0e131b] p-3 font-mono text-[11px] space-y-1.5">
          <div className="flex items-center justify-between text-gray-400">
            <div className="flex items-center gap-2">
              <span className="text-gray-500">14:22:04</span>
              <span className="text-emerald-400">key.created</span>
            </div>
            <span className="text-gray-400">production-worker</span>
          </div>
          <div className="flex items-center justify-between text-gray-400 border-t border-white/5 pt-1.5">
            <div className="flex items-center gap-2">
              <span className="text-gray-500">14:18:30</span>
              <span className="text-amber-400">key.rotated</span>
            </div>
            <span className="text-gray-400">webhook-ingest</span>
          </div>
          <div className="flex items-center justify-between text-gray-400 border-t border-white/5 pt-1.5">
            <div className="flex items-center gap-2">
              <span className="text-gray-500">13:50:11</span>
              <span className="text-blue-400">member.invited</span>
            </div>
            <span className="text-gray-400">security-lead</span>
          </div>
        </div>
      ),
    },
    {
      id: "security",
      title: "Zero-Trust Encryption & Secret Masking",
      description:
        "Raw API keys are never stored in plain text. Upstream credentials are encrypted at rest with industry-standard cryptographic algorithms.",
      icon: ShieldCheck,
      badge: "SECURITY ASSURANCE",
      content: (
        <div className="rounded-lg border border-white/5 bg-[#0e131b] p-3 space-y-2 text-xs font-mono">
          <div className="flex items-center justify-between py-1 px-2 rounded bg-white/5">
            <span className="text-gray-400 text-[11px]">Storage Hash</span>
            <span className="text-emerald-300 text-[11px]">bcrypt salted (cost 10)</span>
          </div>
          <div className="flex items-center justify-between py-1 px-2 rounded bg-white/5">
            <span className="text-gray-400 text-[11px]">Raw Key Exposure</span>
            <span className="text-emerald-400 text-[11px]">Never (One-time reveal)</span>
          </div>
          <div className="flex items-center justify-between text-[10px] text-gray-500 pt-0.5">
            <span>Encrypted at Rest</span>
            <span className="text-emerald-400">TLS In Transit</span>
          </div>
        </div>
      ),
    },
  ];

  return (
    <section id="features" className="py-20 md:py-28 bg-[#0d1117] text-left">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="space-y-3"
        >
          <div className="inline-flex items-center gap-1.5 text-xs font-mono text-emerald-400 uppercase tracking-widest">
            <span>// PLATFORM CAPABILITIES</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Security controls developers actually need
          </h2>
          <p className="text-sm text-gray-400 max-w-2xl leading-relaxed">
            Everything required to issue, govern, and monitor API credentials
            across projects, backed by high-throughput proxy routing.
          </p>
        </motion.div>

        {/* 3x2 Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featureList.map((f, index) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={f.id}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.08, ease: "easeOut" }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="rounded-xl border border-white/10 bg-[#161b22] p-5 space-y-4 hover:border-emerald-500/40 hover:shadow-lg hover:shadow-emerald-950/20 transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-8 h-8 rounded-lg border border-emerald-500/30 bg-emerald-950/60 text-emerald-400 flex items-center justify-center">
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-mono text-emerald-400/80 bg-emerald-950/40 border border-emerald-800/30 px-2 py-0.5 rounded">
                      {f.badge}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white tracking-tight leading-snug">
                    {f.title}
                  </h3>

                  <p className="text-xs text-gray-400 leading-relaxed">
                    {f.description}
                  </p>
                </div>

                <div className="pt-2">{f.content}</div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
