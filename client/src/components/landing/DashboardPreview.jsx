import { motion } from "framer-motion";
import { KeyRound, Activity, ShieldCheck, Terminal, Server, ArrowRight } from "lucide-react";

export default function DashboardPreview() {
  const sampleKeys = [
    {
      name: "production-worker",
      prefix: "aps_live_948f21•••",
      scopes: "gateway:call, read:metrics",
      status: "Active",
      lastUsed: "4m ago",
    },
    {
      name: "webhook-ingest",
      prefix: "aps_live_512b77•••",
      scopes: "gateway:call",
      status: "Active",
      lastUsed: "12m ago",
    },
    {
      name: "telemetry-collector",
      prefix: "aps_live_389c04•••",
      scopes: "read:telemetry",
      status: "Active",
      lastUsed: "1h ago",
    },
  ];

  return (
    <motion.div
      animate={{ y: [0, -4, 0] }}
      transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      className="w-full rounded-2xl border border-white/10 bg-[#161b22] shadow-2xl shadow-emerald-950/20 overflow-hidden text-left font-sans select-none"
    >
      {/* Console Window Top Chrome Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#1c2128] border-b border-white/5 text-[11px] text-gray-400">
        <div className="flex items-center gap-2">
          {/* Traffic light window controls */}
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500/80 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
          </div>
          <span className="ml-2 font-mono text-gray-300 flex items-center gap-1.5 text-[11px]">
            <Terminal className="w-3.5 h-3.5 text-emerald-400" />
            <span>apishield.internal / acme-org / production</span>
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-emerald-400 font-mono text-[10px]">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          gateway active
        </div>
      </div>

      {/* Console Interior */}
      <div className="p-5 space-y-4">
        {/* Metric Cards Grid */}
        <div className="grid grid-cols-3 gap-2.5">
          {/* Metric 1: Request Volume */}
          <div className="rounded-lg border border-white/5 bg-[#0e131b] p-3 space-y-1.5">
            <div className="flex items-center justify-between text-gray-400 text-[10px]">
              <span className="flex items-center gap-1 font-mono">
                <Activity className="w-3 h-3 text-emerald-400" />
                Requests (24h)
              </span>
              <span className="font-mono text-emerald-400">+14%</span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-xl font-bold font-mono text-white">2.48M</span>
              <span className="text-[10px] text-gray-500 font-mono">99.98%</span>
            </div>
          </div>

          {/* Metric 2: Active Keys */}
          <div className="rounded-lg border border-white/5 bg-[#0e131b] p-3 space-y-1.5">
            <div className="flex items-center justify-between text-gray-400 text-[10px]">
              <span className="flex items-center gap-1 font-mono">
                <KeyRound className="w-3 h-3 text-emerald-400" />
                Active Keys
              </span>
              <span className="text-[10px] font-mono text-emerald-400">Scoped</span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-xl font-bold font-mono text-white">18</span>
              <span className="text-[10px] text-gray-500 font-mono">0 revoked</span>
            </div>
          </div>

          {/* Metric 3: Avg Proxy Latency */}
          <div className="rounded-lg border border-white/5 bg-[#0e131b] p-3 space-y-1.5">
            <div className="flex items-center justify-between text-gray-400 text-[10px]">
              <span className="flex items-center gap-1 font-mono">
                <Server className="w-3 h-3 text-emerald-400" />
                Proxy Latency
              </span>
              <span className="font-mono text-emerald-400">&lt; 2ms</span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-xl font-bold font-mono text-white">41ms</span>
              <span className="text-[10px] text-gray-500 font-mono">p99: 86ms</span>
            </div>
          </div>
        </div>

        {/* Live Gateway Route Execution Card */}
        <div className="rounded-lg border border-white/5 bg-[#0e131b] p-3 space-y-2">
          <div className="flex items-center justify-between text-[11px] pb-1 border-b border-white/5">
            <span className="font-semibold text-gray-300 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Gateway Route Proxy
            </span>
            <span className="text-[10px] text-gray-500 font-mono">Verified Ingress</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-[#161b22] p-2.5 rounded border border-white/5 text-xs font-mono">
            <div className="flex items-center gap-2 overflow-hidden">
              <span className="bg-emerald-500/20 text-emerald-400 text-[10px] px-1.5 py-0.5 rounded font-bold shrink-0">
                POST
              </span>
              <span className="text-gray-200 truncate text-[11px]">
                /gateway/payments/charge
              </span>
              <ArrowRight className="w-3 h-3 text-gray-500 shrink-0" />
              <span className="text-gray-400 truncate text-[11px] hidden sm:inline">
                https://api.stripe.com/v1/charges
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0 text-[10px]">
              <span className="text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-1.5 py-0.5 rounded font-semibold">
                200 OK
              </span>
              <span className="text-gray-500">38ms</span>
            </div>
          </div>
        </div>

        {/* Scoped API Keys Table Preview */}
        <div className="rounded-lg border border-white/5 bg-[#0e131b] p-3 space-y-2">
          <div className="flex items-center justify-between text-[11px] font-semibold text-gray-300 pb-1 border-b border-white/5">
            <span className="flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
              Project API Keys
            </span>
            <span className="text-[10px] text-gray-500 font-mono">Scoped Workspace</span>
          </div>

          <div className="space-y-1.5">
            {sampleKeys.map((k) => (
              <div
                key={k.name}
                className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-white/5 transition-colors text-xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                  <span className="font-mono text-gray-200 text-[11px] truncate">
                    {k.name}
                  </span>
                  <span className="font-mono text-gray-500 text-[10px] hidden sm:inline">
                    {k.prefix}
                  </span>
                </div>
                <div className="flex items-center gap-2.5 shrink-0">
                  <span className="text-[10px] font-mono text-gray-500 hidden md:inline">
                    {k.scopes}
                  </span>
                  <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950/60 border border-emerald-800/40 px-1.5 py-0.5 rounded">
                    {k.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
