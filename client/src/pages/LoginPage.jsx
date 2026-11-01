import { useState } from "react";
import { Link, useNavigate, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import BrandLogo from "../components/BrandLogo";
import {
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
  Terminal,
  Shield,
} from "lucide-react";

export default function LoginPage() {
  const { user, isLoading, login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [isUnverified, setIsUnverified] = useState(false);

  if (!isLoading && user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setIsUnverified(false);
      await login(email.trim(), password);
      navigate("/dashboard");
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Invalid email or password";
      setError(errorMsg);

      if (
        err.response?.status === 403 &&
        errorMsg.toLowerCase().includes("verify")
      ) {
        setIsUnverified(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    setGoogleLoading(true);
    const apiBase = import.meta.env.VITE_API_BASE_URL || "/api/v1";
    // Redirect browser to {VITE_API_BASE_URL}/auth/google
    window.location.href = `${apiBase}/auth/google`;
  };

  return (
    <div className="min-h-screen bg-[#0d1117] text-white font-sans flex flex-col justify-between selection:bg-emerald-500/30 selection:text-emerald-300">
      {/* Top Minimal Navigation Bar */}
      <header className="border-b border-white/10 bg-[#0d1117]/90 backdrop-blur-md px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <BrandLogo size="md" badge="v1.0" to="/" />

          <Link
            to="/register"
            className="text-xs font-medium text-gray-400 hover:text-white transition-colors"
          >
            Need an account? <span className="text-white font-semibold underline underline-offset-4">Create one &rarr;</span>
          </Link>
        </div>
      </header>

      {/* Centered Auth Layout */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-10">
        <div className="w-full max-w-[880px] grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Quiet Product Context & Security Flow */}
          <motion.div
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="hidden lg:flex lg:col-span-5 flex-col space-y-6 text-left pr-2"
          >
            <div className="space-y-2.5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/50 border border-emerald-800/40 text-emerald-300 text-xs font-mono">
                <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                <span>Console Authentication</span>
              </div>
              <h1 className="text-3xl font-extrabold text-white tracking-tight leading-tight">
                Manage API credentials with confidence.
              </h1>
              <p className="text-xs text-gray-400 leading-relaxed">
                Centralized workspace for API key creation, rotation, project access, and real-time audit records.
              </p>
            </div>

            {/* Compact Technical Security Pipeline Flow */}
            <div className="rounded-xl border border-white/10 bg-[#161b22] p-4 space-y-2.5 font-mono text-[11px] shadow-xl shadow-blue-950/10">
              <div className="text-[10px] text-gray-500 pb-1 border-b border-white/5 flex items-center justify-between uppercase tracking-wider">
                <span>Security Pipeline</span>
                <span className="text-green-400">Active</span>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between py-1.5 px-2.5 rounded bg-[#1c2128] border border-white/5">
                  <span className="text-gray-400">1. API Request</span>
                  <span className="text-blue-300 text-[10px]">Bearer Token</span>
                </div>
                <div className="flex items-center justify-between py-1.5 px-2.5 rounded bg-[#1c2128] border border-white/5">
                  <span className="text-gray-400">2. Identity & RBAC</span>
                  <span className="text-white text-[10px]">Owner / Admin</span>
                </div>
                <div className="flex items-center justify-between py-1.5 px-2.5 rounded bg-[#1c2128] border border-white/5">
                  <span className="text-gray-400">3. SHA-256 Match</span>
                  <span className="text-green-400 text-[10px]">Authorized</span>
                </div>
                <div className="flex items-center justify-between py-1.5 px-2.5 rounded bg-[#1c2128] border border-white/5">
                  <span className="text-gray-400">4. Audit Trail</span>
                  <span className="text-gray-400 text-[10px]">Logged</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-gray-500 font-mono">
              <Shield className="w-3.5 h-3.5 text-blue-400" />
              <span>Multi-tenant data isolation & hashed secrets.</span>
            </div>
          </motion.div>

          {/* Right Column: Compact Form Card */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.05, ease: "easeOut" }}
            className="lg:col-span-7 flex justify-center"
          >
            <div className="w-full max-w-md rounded-xl border border-white/10 bg-[#161b22] p-8 shadow-2xl shadow-blue-950/20 text-left space-y-5">
              {/* Form Heading */}
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-white tracking-tight">
                  Welcome back
                </h2>
                <p className="text-xs text-gray-400">
                  Sign in to your APIShield workspace.
                </p>
              </div>

              {/* Google OAuth Login Button */}
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading || googleLoading}
                className="w-full py-2.5 px-4 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 text-white text-xs font-semibold flex items-center justify-center gap-2.5 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>{googleLoading ? "Connecting to Google..." : "Continue with Google"}</span>
              </motion.button>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="h-px bg-white/10 flex-1" />
                <span className="text-[11px] text-gray-500 font-mono uppercase">or with email</span>
                <div className="h-px bg-white/10 flex-1" />
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Standard Error Notice */}
                {error && !isUnverified && (
                  <div className="p-3 rounded-md bg-red-950/60 border border-red-800/60 text-red-300 text-xs font-medium flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Unverified Email Notice */}
                {isUnverified && (
                  <div className="p-3.5 rounded-md bg-yellow-950/50 border border-yellow-800/60 space-y-1.5 text-xs text-yellow-200">
                    <div className="flex items-center gap-2 font-semibold text-yellow-300">
                      <AlertCircle className="w-4 h-4 shrink-0 text-yellow-400" />
                      <span>Email Verification Required</span>
                    </div>
                    <p className="text-[11px] text-yellow-300/80 leading-relaxed pl-6">
                      Please check your inbox and verify your email address before signing in.
                    </p>
                  </div>
                )}

                {/* Email Field */}
                <div>
                  <label className="label" htmlFor="email">
                    Email address
                  </label>
                  <input
                    id="email"
                    type="email"
                    className="input"
                    placeholder="developer@apishield.io"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (isUnverified) setIsUnverified(false);
                      if (error) setError("");
                    }}
                    disabled={loading || googleLoading}
                    required
                    autoComplete="email"
                  />
                </div>

                {/* Password Field */}
                <div>
                  <label className="label" htmlFor="password">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      className="input pr-10"
                      placeholder="••••••••••••"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (error) setError("");
                      }}
                      disabled={loading || googleLoading}
                      required
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white focus:outline-none transition-colors"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      tabIndex={0}
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  className="btn-primary w-full py-2.5 text-xs font-semibold mt-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loading || googleLoading}
                >
                  {loading ? (
                    "Signing in..."
                  ) : (
                    <>
                      Sign in
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </motion.button>
              </form>

              {/* Bottom Register Link */}
              <div className="pt-3 border-t border-white/10 text-center text-xs text-gray-400">
                Don't have an account?{" "}
                <Link to="/register" className="font-semibold text-white hover:underline underline-offset-4 ml-1">
                  Create an account
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Footer Note */}
      <footer className="border-t border-white/10 bg-[#0d1117] py-4 px-6 text-center text-[11px] text-gray-500 font-mono">
        APIShield · Developer API Credential Management & Governance
      </footer>
    </div>
  );
}
