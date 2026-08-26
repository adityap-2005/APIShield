import { useState } from "react";
import { Link, useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ShieldCheck, ArrowRight, Eye, EyeOff, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const { user, isLoading, login } = useAuth();
  const navigate = useNavigate();

  if (!isLoading && user) {
    return <Navigate to="/dashboard" replace />;
  }

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isUnverified, setIsUnverified] = useState(false);

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

  return (
    <div className="min-h-screen bg-[#0d1117] flex flex-col justify-center items-center p-4">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#238636]/20 border border-[#238636]/40 text-[#58a6ff] mb-3">
          <ShieldCheck className="w-7 h-7 text-[#238636]" />
        </div>
        <h2 className="text-2xl font-bold text-[#f0f6fc] tracking-tight">Sign in to APIShield</h2>
        <p className="text-xs text-[#8b949e] mt-1">API Security & Developer Gateway Platform</p>
      </div>

      <div className="w-full sm:max-w-md card bg-[#161b22] border border-[#30363d] p-8 shadow-2xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Standard Error Notice */}
          {error && !isUnverified && (
            <div className="p-3 rounded-md bg-red-950/60 border border-red-800/80 text-red-300 text-xs font-medium">
              {error}
            </div>
          )}

          {/* Unverified Email Notice */}
          {isUnverified && (
            <div className="p-4 rounded-md bg-yellow-950/40 border border-yellow-800/60 space-y-2 text-xs">
              <div className="flex items-start gap-2.5 text-yellow-300">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-yellow-200">Email Verification Required</p>
                  <p className="text-yellow-300/90 text-[11px] mt-0.5 leading-relaxed">
                    Please check your inbox and verify your email address before signing in.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="label" htmlFor="email">Email address</label>
            <input
              id="email"
              type="email"
              className="input"
              placeholder="developer@apishield.io"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (isUnverified) setIsUnverified(false);
              }}
              disabled={loading}
              required
              autoComplete="email"
            />
          </div>

          <div>
            <label className="label" htmlFor="password">Password</label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                className="input pr-10"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8b949e] hover:text-[#f0f6fc] focus:outline-none transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
                tabIndex={0}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary w-full justify-center text-sm py-2.5 mt-2"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign in"}
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>
      </div>

      <p className="mt-6 text-center text-xs text-[#8b949e]">
        New to APIShield?{" "}
        <Link to="/register" className="font-medium text-[#58a6ff] hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
