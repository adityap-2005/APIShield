import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import {
  ShieldCheck,
  Eye,
  EyeOff,
  Mail,
  ArrowRight,
  Shield,
  AlertCircle,
  Terminal,
} from "lucide-react";

export default function RegisterPage() {
  const { user, isLoading, register } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isRegistered, setIsRegistered] = useState(false);

  if (!isLoading && user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setError("Please fill in all required fields.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      await register(name.trim(), email.trim(), password);
      setIsRegistered(true);
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Render Registration Success Screen
  if (isRegistered) {
    return (
      <div className="min-h-screen bg-[#0d1117] text-white font-sans flex flex-col justify-between selection:bg-[#2f81f7]/30 selection:text-blue-300">
        <header className="border-b border-white/10 bg-[#0d1117]/90 backdrop-blur-md px-6 py-4">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-lg bg-[#2f81f7] flex items-center justify-center text-white shadow-sm shadow-blue-500/30 group-hover:bg-blue-500 transition-colors">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-bold text-white text-base tracking-tight">
                  APIShield
                </span>
                <span className="text-[10px] font-mono text-blue-300 border border-blue-800/40 px-1.5 py-0.5 rounded bg-blue-950/50">
                  v1.0
                </span>
              </div>
            </Link>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center px-4 py-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="w-full max-w-md rounded-xl border border-white/10 bg-[#161b22] p-8 shadow-2xl shadow-blue-950/20 text-center space-y-5"
          >
            <div className="w-12 h-12 rounded-xl bg-green-950/60 border border-green-800/60 text-green-400 mx-auto flex items-center justify-center">
              <Mail className="w-6 h-6" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold text-white">Account created successfully!</h2>
              <p className="text-xs text-gray-400 leading-relaxed">
                We've sent a verification link to <span className="font-semibold text-blue-300 font-mono">{email}</span>.
              </p>
              <p className="text-xs text-gray-500">
                Please verify your email address before signing in.
              </p>
            </div>

            <div className="pt-2">
              <Link
                to="/login"
                className="btn-primary w-full py-2.5 text-xs font-semibold"
              >
                Continue to Sign In <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </motion.div>
        </main>

        <footer className="border-t border-white/10 bg-[#0d1117] py-4 px-6 text-center text-[11px] text-gray-500 font-mono">
          APIShield · Developer API Credential Management & Governance
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d1117] text-white font-sans flex flex-col justify-between selection:bg-[#2f81f7]/30 selection:text-blue-300">
      {/* Top Minimal Navigation Bar */}
      <header className="border-b border-white/10 bg-[#0d1117]/90 backdrop-blur-md px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-[#2f81f7] flex items-center justify-center text-white shadow-sm shadow-blue-500/30 group-hover:bg-blue-500 transition-colors">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-bold text-white text-base tracking-tight">
                APIShield
              </span>
              <span className="text-[10px] font-mono text-blue-300 border border-blue-800/40 px-1.5 py-0.5 rounded bg-blue-950/50">
                v1.0
              </span>
            </div>
          </Link>

          <Link
            to="/login"
            className="text-xs font-medium text-gray-400 hover:text-white transition-colors"
          >
            Already have an account? <span className="text-white font-semibold underline underline-offset-4">Sign in &rarr;</span>
          </Link>
        </div>
      </header>

      {/* Centered Auth Layout */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-10">
        <div className="w-full max-w-[880px] grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Quiet Workspace Context */}
          <motion.div
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="hidden lg:flex lg:col-span-5 flex-col space-y-6 text-left pr-2"
          >
            <div className="space-y-2.5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-950/50 border border-blue-800/40 text-blue-300 text-xs font-mono">
                <Terminal className="w-3.5 h-3.5 text-blue-400" />
                <span>Workspace Setup</span>
              </div>
              <h1 className="text-3xl font-extrabold text-white tracking-tight leading-tight">
                Create your organization workspace.
              </h1>
              <p className="text-xs text-gray-400 leading-relaxed">
                Issue scoped API keys, assign role-based permissions, and track all credential events with real-time audit trails.
              </p>
            </div>

            {/* Compact Workspace Capabilities Card */}
            <div className="rounded-xl border border-white/10 bg-[#161b22] p-4 space-y-2.5 font-mono text-[11px] shadow-xl shadow-blue-950/10">
              <div className="text-[10px] text-gray-500 pb-1 border-b border-white/5 flex items-center justify-between uppercase tracking-wider">
                <span>V1 Workspace Features</span>
                <span className="text-green-400">Enabled</span>
              </div>

              <div className="space-y-1.5 text-xs font-sans">
                <div className="flex items-center justify-between py-1.5 px-2.5 rounded bg-[#1c2128] border border-white/5">
                  <span className="text-gray-400">API Key Governance</span>
                  <span className="text-green-400 text-[10px] font-mono">Scoped & Hashed</span>
                </div>
                <div className="flex items-center justify-between py-1.5 px-2.5 rounded bg-[#1c2128] border border-white/5">
                  <span className="text-gray-400">Organization RBAC</span>
                  <span className="text-white text-[10px] font-mono">Owner / Admin / Member</span>
                </div>
                <div className="flex items-center justify-between py-1.5 px-2.5 rounded bg-[#1c2128] border border-white/5">
                  <span className="text-gray-400">Usage Telemetry</span>
                  <span className="text-blue-300 text-[10px] font-mono">Real-time Metrics</span>
                </div>
                <div className="flex items-center justify-between py-1.5 px-2.5 rounded bg-[#1c2128] border border-white/5">
                  <span className="text-gray-400">Immutable Audit Logs</span>
                  <span className="text-blue-300 text-[10px] font-mono">Actor & Metadata</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-gray-500 font-mono">
              <Shield className="w-3.5 h-3.5 text-blue-400" />
              <span>Multi-tenant data isolation & hashed secrets.</span>
            </div>
          </motion.div>

          {/* Right Column: Compact Registration Form */}
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
                  Create your account
                </h2>
                <p className="text-xs text-gray-400">
                  Start managing your API credentials and organization access.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3.5">
                {error && (
                  <div className="p-3 rounded-md bg-red-950/60 border border-red-800/60 text-red-300 text-xs font-medium flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Name Field */}
                <div>
                  <label className="label" htmlFor="name">
                    Full Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    className="input"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (error) setError("");
                    }}
                    disabled={loading}
                    required
                  />
                </div>

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
                      if (error) setError("");
                    }}
                    disabled={loading}
                    required
                    autoComplete="email"
                  />
                </div>

                {/* Password Field */}
                <div>
                  <label className="label" htmlFor="password">
                    Password <span className="text-gray-500 font-normal">(min 8 chars)</span>
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
                      disabled={loading}
                      required
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

                {/* Confirm Password Field */}
                <div>
                  <label className="label" htmlFor="confirmPassword">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      className="input pr-10"
                      placeholder="••••••••••••"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (error) setError("");
                      }}
                      disabled={loading}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white focus:outline-none transition-colors"
                      aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                      tabIndex={0}
                    >
                      {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Submit Action Button */}
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  className="btn-primary w-full py-2.5 text-xs font-semibold mt-2"
                  disabled={loading}
                >
                  {loading ? (
                    "Creating account..."
                  ) : (
                    <>
                      Create account
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </motion.button>
              </form>

              {/* Bottom Login Link */}
              <div className="pt-3 border-t border-white/10 text-center text-xs text-gray-400">
                Already have an account?{" "}
                <Link to="/login" className="font-semibold text-white hover:underline underline-offset-4 ml-1">
                  Sign in
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
