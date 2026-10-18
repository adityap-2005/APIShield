import { Link } from "react-router-dom";
import BrandLogo from "../BrandLogo";

export default function Footer() {
  const footerLinks = {
    Platform: [
      { label: "API Keys", href: "#features" },
      { label: "Gateway Routing", href: "#how-it-works" },
      { label: "Upstream APIs", href: "#features" },
      { label: "Project Governance", href: "#features" },
    ],
    Architecture: [
      { label: "Overview", href: "#how-it-works" },
      { label: "Security & Hashing", href: "#security" },
      { label: "Telemetry & Logs", href: "#telemetry" },
      { label: "Audit Trails", href: "#features" },
    ],
    Console: [
      { label: "Sign In", href: "/login", isRoute: true },
      { label: "Create Account", href: "/register", isRoute: true },
      { label: "Dashboard", href: "/dashboard", isRoute: true },
    ],
  };

  return (
    <footer className="border-t border-white/10 bg-[#0d1117] text-left text-xs text-gray-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
          {/* Brand Column */}
          <div className="md:col-span-5 space-y-4">
            <BrandLogo size="md" to="/" />
            <p className="text-xs text-gray-400 max-w-sm leading-relaxed">
              Unified API credential security, upstream proxy routing, and
              real-time telemetry. Built for engineering teams that value control
              and reliability.
            </p>
            <div className="pt-2 text-[11px] font-mono text-gray-400 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>APIShield Gateway System Operational</span>
            </div>
          </div>

          {/* Nav Columns */}
          <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8">
            {Object.entries(footerLinks).map(([category, links]) => (
              <div key={category} className="space-y-3">
                <h4 className="font-semibold text-white text-xs tracking-wider uppercase font-mono">
                  {category}
                </h4>
                <ul className="space-y-2">
                  {links.map((link) => (
                    <li key={link.label}>
                      {link.isRoute ? (
                        <Link
                          to={link.href}
                          className="text-gray-400 hover:text-white transition-colors"
                        >
                          {link.label}
                        </Link>
                      ) : (
                        <a
                          href={link.href}
                          className="text-gray-400 hover:text-white transition-colors"
                        >
                          {link.label}
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-gray-400 text-[11px] font-mono">
          <p>© {new Date().getFullYear()} APIShield. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span>Developer Infrastructure</span>
            <span>•</span>
            <span className="text-emerald-400">Zero-Trust Architecture</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
