import { motion } from "framer-motion";
import { KeyRound, Activity, ShieldCheck, Terminal } from "lucide-react";

export default function DashboardPreview() {
  const sampleKeys = [
    {
      name: "production-api",
      scope: "read, write",
      status: "Active",
      created: "2d ago",
    },
    {
      name: "development-api",
      scope: "read",
      status: "Active",
      created: "5d ago",
    },
    {
      name: "analytics-service",
      scope: "telemetry",
      status: "Active",
      created: "1w ago",
    },
  ];

  return (
    <motion.div
      animate={{ y: [0, -5, 0] }}
      transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
      className="w-full rounded-xl border border-white/10 bg-[#161b22] shadow-2xl shadow-blue-950/20 overflow-hidden text-left font-sans"
    >
      {/* Console Window Top Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#1c2128] border-b border-white/5 text-[11px] text-gray-400">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500/80 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-green-500/80 inline-block" />
          </div>
          <span className="ml-2 font-mono text-gray-300 flex items-center gap-1">
            <Terminal className="w-3 h-3 text-blue-400" />
            apishield-console
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-green-400 font-mono text-[10px]">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          live
        </div>
      </div>

      {/* Console Interior */}
      <div className="p-5 space-y-5">
        {/* Metric Cards Grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Active Keys Metric */}
          <div className="rounded-lg border border-white/5 bg-[#1c2128] p-3.5 space-y-2">
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span className="flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-blue-400" />
                Active Keys
              </span>
              <span className="text-[10px] font-mono text-green-400">+14%</span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold font-mono text-white">24</span>
              {/* Mini Sparkline SVG with path animation */}
              <svg className="w-16 h-6 text-blue-400" viewBox="0 0 60 20" fill="none">
                <motion.path
                  d="M2 16 L12 12 L22 15 L32 8 L42 11 L52 4 L58 5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1.2, delay: 0.5, ease: "easeOut" }}
                />
              </svg>
            </div>
          </div>

          {/* API Requests Metric */}
          <div className="rounded-lg border border-white/5 bg-[#1c2128] p-3.5 space-y-2">
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span className="flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-blue-400" />
                API Requests
              </span>
              <span className="text-[10px] font-mono text-green-400">+8.1%</span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold font-mono text-white">12.4K</span>
              {/* Mini Sparkline SVG with path animation */}
              <svg className="w-16 h-6 text-blue-400" viewBox="0 0 60 20" fill="none">
                <motion.path
                  d="M2 17 L12 14 L22 10 L32 12 L42 6 L52 8 L58 2"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1.2, delay: 0.7, ease: "easeOut" }}
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Recent Keys Table Preview */}
        <div className="rounded-lg border border-white/5 bg-[#1c2128] p-3.5 space-y-2.5">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-300 pb-1 border-b border-white/5">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
              Recent API Keys
            </span>
            <span className="text-[10px] text-gray-500 font-mono">Scoped Workspace</span>
          </div>

          <div className="space-y-1.5">
            {sampleKeys.map((k, index) => (
              <motion.div
                key={k.name}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.5 + index * 0.15 }}
                className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-white/5 transition-colors text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" />
                  <span className="font-mono text-gray-200 text-[11px]">{k.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-mono text-gray-500 hidden sm:inline">
                    {k.scope}
                  </span>
                  <span className="text-[10px] text-green-400 font-mono bg-green-950/60 border border-green-800/40 px-1.5 py-0.5 rounded">
                    {k.status}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
