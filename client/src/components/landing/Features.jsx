import { motion } from "framer-motion";
import { KeyRound, Users, FileText, BarChart3 } from "lucide-react";

export default function Features() {
  const featureList = [
    {
      id: "lifecycle",
      title: "API Key Lifecycle",
      description: "Create, manage, rotate, and revoke API credentials from one centralized workspace.",
      icon: KeyRound,
      iconBg: "bg-blue-950/60 border-blue-800/60 text-blue-400",
      content: (
        <div className="rounded-lg border border-white/5 bg-[#1c2128] p-3.5 font-mono text-[11px] text-gray-300 space-y-1 overflow-x-auto">
          <div className="text-gray-500 text-[10px] pb-1 border-b border-white/5 flex items-center justify-between">
            <span>Example Usage</span>
            <span className="text-blue-400">javascript</span>
          </div>
          <p className="text-blue-300">const <span className="text-white">apiKey</span> = await <span className="text-blue-400">apiShield</span>.keys.create(&#123;</p>
          <p className="pl-4 text-gray-300">name: <span className="text-green-300">"production-api"</span>,</p>
          <p className="pl-4 text-gray-300">scopes: [<span className="text-green-300">"read"</span>, <span className="text-green-300">"write"</span>]</p>
          <p className="text-blue-300">&#125;);</p>
        </div>
      ),
    },
    {
      id: "access",
      title: "Controlled Access",
      description: "Manage organization members, teams, invitations, and roles from one place.",
      icon: Users,
      iconBg: "bg-blue-950/60 border-blue-800/60 text-blue-400",
      content: (
        <div className="rounded-lg border border-white/5 bg-[#1c2128] p-3 space-y-2 text-xs">
          <div className="flex items-center justify-between py-1 px-2 rounded bg-white/5">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-blue-600/30 text-blue-300 text-[10px] font-bold flex items-center justify-center font-mono">
                AD
              </div>
              <span className="text-gray-200 text-[11px]">aditya@apishield.io</span>
            </div>
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800/40">
              OWNER
            </span>
          </div>

          <div className="flex items-center justify-between py-1 px-2 rounded hover:bg-white/5">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-blue-600/20 text-blue-300 text-[10px] font-bold flex items-center justify-center font-mono">
                DV
              </div>
              <span className="text-gray-300 text-[11px]">dev-lead@apishield.io</span>
            </div>
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800/40">
              ADMIN
            </span>
          </div>
        </div>
      ),
    },
    {
      id: "audit",
      title: "Real-Time Audit Trail",
      description: "Track important actions across your organization with clear audit records.",
      icon: FileText,
      iconBg: "bg-yellow-950/60 border-yellow-800/60 text-yellow-400",
      content: (
        <div className="rounded-lg border border-white/5 bg-[#1c2128] p-3 font-mono text-[11px] space-y-2">
          <div className="flex items-center justify-between text-gray-400">
            <div className="flex items-center gap-2">
              <span className="text-gray-500">11:42:18</span>
              <span className="text-green-400">key_created</span>
            </div>
            <span className="text-gray-500">production-api</span>
          </div>
          <div className="flex items-center justify-between text-gray-400 border-t border-white/5 pt-1.5">
            <div className="flex items-center gap-2">
              <span className="text-gray-500">11:40:12</span>
              <span className="text-blue-400">member_invited</span>
            </div>
            <span className="text-gray-500">team-lead</span>
          </div>
          <div className="flex items-center justify-between text-gray-400 border-t border-white/5 pt-1.5">
            <div className="flex items-center gap-2">
              <span className="text-gray-500">11:38:05</span>
              <span className="text-blue-300">role_updated</span>
            </div>
            <span className="text-gray-500">admin</span>
          </div>
        </div>
      ),
    },
    {
      id: "analytics",
      title: "Usage & Analytics",
      description: "Understand API activity through usage information and organization analytics.",
      icon: BarChart3,
      iconBg: "bg-green-950/60 border-green-800/60 text-green-400",
      content: (
        <div className="rounded-lg border border-white/5 bg-[#1c2128] p-3.5 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-300 font-mono">Response Status</span>
            <span className="text-green-400 font-mono text-[11px] font-semibold">98.4% Success</span>
          </div>

          <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden flex">
            <div className="h-full bg-green-400 w-[98.4%]" />
            <div className="h-full bg-yellow-400 w-[1.2%]" />
            <div className="h-full bg-red-400 w-[0.4%]" />
          </div>

          <div className="flex items-center justify-between text-[10px] font-mono text-gray-500 pt-1">
            <span>200 OK (98.4%)</span>
            <span>401 Unauthorized (1.2%)</span>
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
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="space-y-3"
        >
          <div className="inline-flex items-center gap-1.5 text-xs font-mono text-blue-400 uppercase tracking-widest">
            <span>// BUILT FOR API INFRASTRUCTURE</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Security details developers actually need
          </h2>
          <p className="text-sm text-gray-400 max-w-2xl leading-relaxed">
            Everything you need to secure, govern, and monitor API credentials across your organization.
          </p>
        </motion.div>

        {/* 2x2 Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {featureList.map((f, index) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={f.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1, ease: "easeOut" }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="rounded-xl border border-white/10 bg-[#161b22] p-6 space-y-5 hover:border-blue-500/40 hover:shadow-lg hover:shadow-blue-950/20 transition-colors"
              >
                <div className="space-y-2">
                  <div className={`w-8 h-8 rounded-lg border flex items-center justify-center ${f.iconBg}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <h3 className="text-lg font-bold text-white">{f.title}</h3>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    {f.description}
                  </p>
                </div>

                {f.content}
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
