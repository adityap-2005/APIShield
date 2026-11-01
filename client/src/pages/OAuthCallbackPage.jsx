import { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import authApi from "../api/auth";
import { AlertCircle, ArrowLeft, Terminal } from "lucide-react";
import LoadingSpinner from "../components/LoadingSpinner";
import BrandLogo from "../components/BrandLogo";

export default function OAuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setAuthSession } = useAuth();

  const [status, setStatus] = useState("loading"); // "loading" | "error"
  const [errorMessage, setErrorMessage] = useState("");
  const processedRef = useRef(false);

  useEffect(() => {
    // Prevent duplicate processing in React Strict Mode
    if (processedRef.current) return;
    processedRef.current = true;

    const handleCallback = async () => {
      // 1. Check for query error parameter from backend redirect
      const oauthError = searchParams.get("error");
      if (oauthError) {
        setStatus("error");
        setErrorMessage(
          oauthError === "google_auth_failed"
            ? "Google authentication was cancelled or failed. Please try again."
            : "Authentication error occurred during Google sign-in. Please try again."
        );
        return;
      }

      try {
        // 2. Call /auth/refresh with credentials to exchange HTTP-only cookie for access token
        const refreshRes = await authApi.refreshToken();
        const accessToken =
          refreshRes.data?.accessToken ||
          refreshRes.data?.token ||
          refreshRes.data?.data?.accessToken;

        if (!accessToken) {
          throw new Error("Missing access token in refresh response.");
        }

        // 3. Fetch authenticated user profile using the new access token
        const profileRes = await authApi.getProfile();
        const user = profileRes.data?.data || profileRes.data?.user;

        if (!user) {
          throw new Error("Unable to retrieve user profile.");
        }

        // 4. Update AuthContext state and session
        setAuthSession(user, accessToken);

        // 5. Redirect to authenticated dashboard
        navigate("/dashboard", { replace: true });
      } catch (err) {
        setStatus("error");
        setErrorMessage(
          err.response?.data?.message ||
            "Unable to complete Google sign-in. Your session may have expired. Please try logging in again."
        );
      }
    };

    handleCallback();
  }, [navigate, searchParams, setAuthSession]);

  return (
    <div className="min-h-screen bg-[#0d1117] text-white font-sans flex flex-col justify-between selection:bg-emerald-500/30 selection:text-emerald-300">
      <header className="border-b border-white/10 bg-[#0d1117]/90 backdrop-blur-md px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <BrandLogo size="md" badge="v1.0" to="/" />
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-10">
        <div className="w-full max-w-md rounded-xl border border-white/10 bg-[#161b22] p-8 shadow-2xl text-center space-y-6">
          {status === "loading" ? (
            <div className="space-y-4 py-6">
              <div className="flex justify-center">
                <LoadingSpinner size="lg" />
              </div>
              <div className="space-y-1">
                <h2 className="text-base font-semibold text-white">
                  Completing Google sign-in...
                </h2>
                <p className="text-xs text-gray-400">
                  Verifying authorization and establishing your secure session.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>

              <div className="space-y-1.5">
                <h2 className="text-base font-bold text-white tracking-tight">
                  Authentication Failed
                </h2>
                <p className="text-xs text-gray-400 leading-relaxed">
                  {errorMessage}
                </p>
              </div>

              <div className="pt-2">
                <Link
                  to="/login"
                  className="btn-primary w-full py-2.5 text-xs font-semibold inline-flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Return to Login</span>
                </Link>
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-white/5 flex items-center justify-center gap-1.5 text-[11px] text-gray-500 font-mono">
            <Terminal className="w-3 h-3 text-emerald-400" />
            <span>APIShield OAuth 2.0 Security Flow</span>
          </div>
        </div>
      </main>

      <footer className="border-t border-white/10 bg-[#0d1117] py-4 px-6 text-center text-[11px] text-gray-500 font-mono">
        APIShield · Developer API Credential Management & Governance
      </footer>
    </div>
  );
}
