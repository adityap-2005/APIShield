import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ShieldCheck } from "lucide-react";

export default function Footer() {
  const footerLinks = {
    Product: [
      { label: "API Keys", href: "#features" },
      { label: "Teams & RBAC", href: "#features" },
      { label: "Usage & Telemetry", href: "#features" },
      { label: "Audit Logs", href: "#features" },
    ],
    Developers: [
      { label: "Documentation", href: "#principle" },
      { label: "API Reference", href: "#features" },
      { label: "Getting Started", href: "#features" },
    ],
    Company: [
      { label: "About APIShield", href: "#principle" },
      { label: "Contact", href: "mailto:support@apishield.io" },
    ],
    Resources: [
      { label: "Security Overview", href: "#features" },
      { label: "System Status", href: "#" },
      { label: "Changelog", href: "#" },
    ],
  };

  return (
    <motion.footer
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="border-t border-white/10 bg-[#050505] text-left text-xs text-gray-400"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
          {/* Brand Column */}
          <div className="md:col-span-4 space-y-4">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-md bg-purple-600 flex items-center justify-center text-white">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <span className="font-bold text-white text-base tracking-tight">
                APIShield
              </span>
            </Link>
            <p className="text-xs text-gray-500 max-w-sm leading-relaxed">
              Secure API credential management for modern development teams. Create, govern, and monitor API access from one workspace.
            </p>
          </div>

          {/* Nav Columns */}
          <div className="md:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-8">
            {Object.entries(footerLinks).map(([category, links]) => (
              <div key={category} className="space-y-3">
                <h4 className="font-semibold text-white text-xs tracking-wider uppercase">
                  {category}
                </h4>
                <ul className="space-y-2">
                  {links.map((link) => (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        className="text-gray-400 hover:text-white transition-colors"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-gray-500 text-[11px]">
          <p>© {new Date().getFullYear()} APIShield. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <a href="#privacy" className="hover:text-gray-400 transition-colors">
              Privacy Policy
            </a>
            <a href="#terms" className="hover:text-gray-400 transition-colors">
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </motion.footer>
  );
}
