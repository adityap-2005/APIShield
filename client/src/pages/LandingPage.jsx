import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ProfileDropdown from "../components/ProfileDropdown";
import LoadingSpinner from "../components/LoadingSpinner";
import {
  ShieldCheck,
  KeyRound,
  Users,
  BarChart3,
  FileText,
  RefreshCw,
  ArrowRight,
  Lock,
  LayoutDashboard
} from "lucide-react";

export default function LandingPage() {
  const { user, isLoading } = useAuth();

  return (
    <div className="min-h-screen bg-[#0d1117] text-[#f0f6fc] font-sans flex flex-col justify-between">
      {/* Top Navbar */}
      <header className="h-16 border-b border-[#30363d] bg-[#161b22] px-6 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#238636] flex items-center justify-center text-white shadow-xs">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <span className="font-bold text-[#f0f6fc] text-base tracking-tight">APIShield</span>
        </div>

        {/* Authenticated vs Unauthenticated Navigation Header */}
        <div className="flex items-center gap-3">
          {isLoading ? (
            <div className="w-6 h-6 border-2 border-[#30363d] border-t-[#58a6ff] rounded-full animate-spin" />
          ) : user ? (
            <div className="flex items-center gap-3">
              <Link to="/dashboard" className="btn-primary text-xs flex items-center gap-1.5">
                <LayoutDashboard className="w-3.5 h-3.5" />
                Go to Dashboard
              </Link>
              <ProfileDropdown />
            </div>
          ) : (
            <>
              <Link to="/login" className="btn-secondary text-xs">
                Sign In
              </Link>
              <Link to="/register" className="btn-primary text-xs">
                Get Started
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-5xl mx-auto px-6 py-16 sm:py-24 text-center space-y-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1f6feb]/15 border border-[#58a6ff]/30 text-[#58a6ff] text-xs font-semibold">
          <Lock className="w-3.5 h-3.5" />
          <span>Developer API Gateway & Security</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold text-[#f0f6fc] tracking-tight leading-tight max-w-3xl mx-auto">
          Secure and manage your APIs with confidence.
        </h1>

        <p className="text-sm sm:text-base text-[#8b949e] max-w-2xl mx-auto leading-relaxed">
          Manage API keys, teams, role-based access control, usage analytics, and audit activity from one developer-focused platform.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          {user ? (
            <Link to="/dashboard" className="btn-primary text-sm px-6 py-2.5 w-full sm:w-auto justify-center">
              Go to Dashboard <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <>
              <Link to="/register" className="btn-primary text-sm px-6 py-2.5 w-full sm:w-auto justify-center">
                Get Started <ArrowRight className="w-4 h-4" />
              </Link>
              <Link to="/login" className="btn-secondary text-sm px-6 py-2.5 w-full sm:w-auto justify-center">
                Sign In to Console
              </Link>
            </>
          )}
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left pt-12">
          <div className="card space-y-3">
            <div className="w-9 h-9 rounded-lg bg-purple-950/60 border border-purple-800/80 flex items-center justify-center text-purple-400">
              <KeyRound className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-[#f0f6fc]">API Key Lifecycle</h3>
            <p className="text-xs text-[#8b949e] leading-relaxed">
              Create, scoped permissions, instant revocation, and automated key secret rotation with one-time plain-text display.
            </p>
          </div>

          <div className="card space-y-3">
            <div className="w-9 h-9 rounded-lg bg-blue-950/60 border border-blue-800/80 flex items-center justify-center text-blue-400">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-[#f0f6fc]">Team & Org RBAC</h3>
            <p className="text-xs text-[#8b949e] leading-relaxed">
              Granular role-based access control across organizations and workgroup teams (`OWNER`, `ADMIN`, `DEVELOPER`).
            </p>
          </div>

          <div className="card space-y-3">
            <div className="w-9 h-9 rounded-lg bg-green-950/60 border border-green-800/80 flex items-center justify-center text-green-400">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-[#f0f6fc]">Usage & Analytics</h3>
            <p className="text-xs text-[#8b949e] leading-relaxed">
              Track requests over time, latency, HTTP status code distributions, and top endpoint activity in real-time.
            </p>
          </div>

          <div className="card space-y-3">
            <div className="w-9 h-9 rounded-lg bg-yellow-950/60 border border-yellow-800/80 flex items-center justify-center text-yellow-400">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-[#f0f6fc]">Audit Logging</h3>
            <p className="text-xs text-[#8b949e] leading-relaxed">
              Complete, immutable audit trails capturing actor, action type, entity modifications, and JSON metadata.
            </p>
          </div>

          <div className="card space-y-3">
            <div className="w-9 h-9 rounded-lg bg-red-950/60 border border-red-800/80 flex items-center justify-center text-red-400">
              <RefreshCw className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-[#f0f6fc]">Secure Key Rotation</h3>
            <p className="text-xs text-[#8b949e] leading-relaxed">
              Rotate active API key secrets instantly without losing key metadata or historical telemetry data.
            </p>
          </div>

          <div className="card space-y-3">
            <div className="w-9 h-9 rounded-lg bg-cyan-950/60 border border-cyan-800/80 flex items-center justify-center text-cyan-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-[#f0f6fc]">Security First</h3>
            <p className="text-xs text-[#8b949e] leading-relaxed">
              Hashed database key storage, JWT Bearer header authentication, and strict multi-tenant data isolation.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#30363d] bg-[#161b22] py-6 px-6 text-center text-xs text-[#8b949e]">
        <p>APIShield Developer Platform — API Key & Gateway Security</p>
      </footer>
    </div>
  );
}
