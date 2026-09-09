import { useState, useEffect, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import authApi from "../api/auth";
import { ShieldCheck, CheckCircle2, XCircle, AlertCircle, ArrowRight } from "lucide-react";

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState("loading"); // "loading" | "success" | "invalid" | "expired" | "missing" | "error"
  const [message, setMessage] = useState("");
  const effectRan = useRef(false);

  useEffect(() => {
    if (!token) {
      setStatus("missing");
      setMessage("Verification token is missing.");
      return;
    }

    // Prevent duplicate verification requests in React StrictMode
    if (effectRan.current) return;
    effectRan.current = true;

    const performVerification = async () => {
      try {
        setStatus("loading");
        const response = await authApi.verifyEmail(token);
        setStatus("success");
        setMessage(response.data?.message || "Email verified successfully!");
      } catch (err) {
        const errorMsg = err.response?.data?.message || "";
        const lowerMsg = errorMsg.toLowerCase();

        if (lowerMsg.includes("expired")) {
          setStatus("expired");
          setMessage("This verification link has expired.");
        } else if (lowerMsg.includes("invalid")) {
          setStatus("invalid");
          setMessage("Invalid verification link.");
        } else if (errorMsg) {
          setStatus("error");
          setMessage(errorMsg);
        } else {
          setStatus("error");
          setMessage("Verification failed. Please check your link or network connection.");
        }
      }
    };

    performVerification();
  }, [token]);

  return (
    <div className="min-h-screen bg-[#0d1117] text-white font-sans flex flex-col justify-center items-center p-4 selection:bg-[#2f81f7]/30 selection:text-blue-300">
      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-950/60 border border-blue-800/40 text-white mb-3 shadow-sm shadow-blue-500/20">
          <ShieldCheck className="w-6 h-6 text-blue-400" />
        </div>
        <h2 className="text-2xl font-bold text-white tracking-tight">APIShield</h2>
        <p className="text-xs text-gray-500 font-mono mt-1">Email Verification</p>
      </div>

      {/* Card Content */}
      <div className="w-full sm:max-w-md card bg-[#161b22] border border-white/10 p-8 shadow-2xl shadow-blue-950/20 text-center space-y-5 rounded-xl">
        {/* Loading State */}
        {status === "loading" && (
          <div className="space-y-4 py-4">
            <div className="w-8 h-8 border-2 border-white/10 border-t-blue-500 rounded-full animate-spin mx-auto" />
            <h3 className="text-base font-semibold text-white">Verifying your email...</h3>
            <p className="text-xs text-gray-400">Please wait while we validate your verification token.</p>
          </div>
        )}

        {/* Success State */}
        {status === "success" && (
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-xl bg-green-950/60 border border-green-800/60 text-green-400 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white">Email verified successfully!</h3>
              <p className="text-xs text-gray-400">
                Your email has been verified. You can now log in.
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
        )}

        {/* Invalid Token State */}
        {status === "invalid" && (
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-xl bg-red-950/60 border border-red-800/60 text-red-400 mx-auto flex items-center justify-center">
              <XCircle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white">Invalid verification link.</h3>
              <p className="text-xs text-gray-400">
                The verification token provided is invalid or corrupted.
              </p>
            </div>
            <div className="pt-2">
              <Link
                to="/login"
                className="btn-secondary w-full justify-center text-sm py-2.5 flex items-center gap-2"
              >
                Go to Login
              </Link>
            </div>
          </div>
        )}

        {/* Expired Token State */}
        {status === "expired" && (
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-xl bg-yellow-950/60 border border-yellow-800/60 text-yellow-400 mx-auto flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white">This verification link has expired.</h3>
              <p className="text-xs text-gray-400">
                Your email verification token has passed its expiration time.
              </p>
            </div>
            <div className="pt-2">
              <Link
                to="/login"
                className="btn-secondary w-full justify-center text-sm py-2.5 flex items-center gap-2"
              >
                Go to Login
              </Link>
            </div>
          </div>
        )}

        {/* Missing Token State */}
        {status === "missing" && (
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-xl bg-yellow-950/60 border border-yellow-800/60 text-yellow-400 mx-auto flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white">Verification token is missing.</h3>
              <p className="text-xs text-gray-400">
                No verification token was found in the URL. Please check your verification email.
              </p>
            </div>
            <div className="pt-2">
              <Link
                to="/login"
                className="btn-secondary w-full justify-center text-sm py-2.5 flex items-center gap-2"
              >
                Go to Login
              </Link>
            </div>
          </div>
        )}

        {/* Generic Error State */}
        {status === "error" && (
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-xl bg-red-950/60 border border-red-800/60 text-red-400 mx-auto flex items-center justify-center">
              <XCircle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white">Verification Failed</h3>
              <p className="text-xs text-red-300 font-medium">{message}</p>
            </div>
            <div className="pt-2">
              <Link
                to="/login"
                className="btn-secondary w-full justify-center text-sm py-2.5 flex items-center gap-2"
              >
                Go to Login
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
