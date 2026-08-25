import { useState } from "react";
import { Link, useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ShieldCheck, UserPlus, Eye, EyeOff, Mail, ArrowRight } from "lucide-react";

export default function RegisterPage() {
  const { user, isLoading, register } = useAuth();
  const navigate = useNavigate();

  if (!isLoading && user) {
    return <Navigate to="/dashboard" replace />;
  }

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isRegistered, setIsRegistered] = useState(false);

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
      <div className="min-h-screen bg-[#0d1117] flex flex-col justify-center items-center p-4">
        <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#238636]/20 border border-[#238636]/40 text-[#58a6ff] mb-3">
            <ShieldCheck className="w-7 h-7 text-[#238636]" />
          </div>
          <h2 className="text-2xl font-bold text-[#f0f6fc] tracking-tight">APIShield</h2>
        </div>

        <div className="w-full sm:max-w-md card bg-[#161b22] border border-[#30363d] p-8 shadow-2xl text-center space-y-5">
          <div className="w-12 h-12 rounded-full bg-[#1f6feb]/20 border border-[#58a6ff]/40 text-[#58a6ff] mx-auto flex items-center justify-center">
            <Mail className="w-6 h-6" />
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-bold text-[#f0f6fc]">Account created successfully!</h3>
            <p className="text-xs text-[#c9d1d9] leading-relaxed">
              We've sent a verification email to <span className="font-semibold text-[#58a6ff]">{email}</span>.
            </p>
            <p className="text-xs text-[#8b949e]">
              Please verify your email before logging in.
            </p>
          </div>

          <div className="pt-2">
            <Link
              to="/login"
              className="btn-primary w-full justify-center text-sm py-2.5 flex items-center gap-2"
            >
              Go to Login <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d1117] flex flex-col justify-center items-center p-4">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#238636]/20 border border-[#238636]/40 text-[#58a6ff] mb-3">
          <ShieldCheck className="w-7 h-7 text-[#238636]" />
        </div>
        <h2 className="text-2xl font-bold text-[#f0f6fc] tracking-tight">Create your APIShield Account</h2>
        <p className="text-xs text-[#8b949e] mt-1">Get started managing your developer teams and API keys</p>
      </div>

      <div className="w-full sm:max-w-md card bg-[#161b22] border border-[#30363d] p-8 shadow-2xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-md bg-red-950/60 border border-red-800/80 text-red-300 text-xs font-medium">
              {error}
            </div>
          )}

          <div>
            <label className="label" htmlFor="name">Full Name</label>
            <input
              id="name"
              type="text"
              className="input"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div>
            <label className="label" htmlFor="email">Email address</label>
            <input
              id="email"
              type="email"
              className="input"
              placeholder="developer@apishield.io"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
              autoComplete="email"
            />
          </div>

          <div>
            <label className="label" htmlFor="password">Password (min 8 chars)</label>
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

          <div>
            <label className="label" htmlFor="confirmPassword">Confirm Password</label>
            <div className="relative">
              <input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                className="input pr-10"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8b949e] hover:text-[#f0f6fc] focus:outline-none transition-colors"
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                tabIndex={0}
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary w-full justify-center text-sm py-2.5 mt-2"
            disabled={loading}
          >
            {loading ? "Creating account..." : "Create Account"}
            {!loading && <UserPlus className="w-4 h-4" />}
          </button>
        </form>
      </div>

      <p className="mt-6 text-center text-xs text-[#8b949e]">
        Already have an account?{" "}
        <Link to="/login" className="font-medium text-[#58a6ff] hover:underline">
          Sign in instead
        </Link>
      </p>
    </div>
  );
}
