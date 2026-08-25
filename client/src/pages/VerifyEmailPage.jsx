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
    <div className="min-h-screen bg-[#0d1117] flex flex-col justify-center items-center p-4">
      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#238636]/20 border border-[#238636]/40 text-[#58a6ff] mb-3">
          <ShieldCheck className="w-7 h-7 text-[#238636]" />
        </div>
        <h2 className="text-2xl font-bold text-[#f0f6fc] tracking-tight">APIShield</h2>
        <p className="text-xs text-[#8b949e] mt-1">Email Verification</p>
      </div>

      {/* Card Content */}
      <div className="w-full sm:max-w-md card bg-[#161b22] border border-[#30363d] p-8 shadow-2xl text-center space-y-5">
        {/* Loading State */}
        {status === "loading" && (
          <div className="space-y-4 py-4">
            <div className="w-10 h-10 border-2 border-[#30363d] border-t-[#58a6ff] rounded-full animate-spin mx-auto" />
            <h3 className="text-base font-semibold text-[#f0f6fc]">Verifying your email...</h3>
            <p className="text-xs text-[#8b949e]">Please wait while we validate your verification token.</p>
          </div>
        )}

        {/* Success State */}
        {status === "success" && (
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-full bg-green-950/60 border border-green-800/80 text-green-400 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-[#f0f6fc]">Email verified successfully!</h3>
              <p className="text-xs text-[#c9d1d9]">
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
            <div className="w-12 h-12 rounded-full bg-red-950/60 border border-red-800/80 text-red-400 mx-auto flex items-center justify-center">
              <XCircle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-[#f0f6fc]">Invalid verification link.</h3>
              <p className="text-xs text-[#8b949e]">
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
            <div className="w-12 h-12 rounded-full bg-yellow-950/60 border border-yellow-800/80 text-yellow-400 mx-auto flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-[#f0f6fc]">This verification link has expired.</h3>
              <p className="text-xs text-[#8b949e]">
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
            <div className="w-12 h-12 rounded-full bg-yellow-950/60 border border-yellow-800/80 text-yellow-400 mx-auto flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-[#f0f6fc]">Verification token is missing.</h3>
              <p className="text-xs text-[#8b949e]">
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
            <div className="w-12 h-12 rounded-full bg-red-950/60 border border-red-800/80 text-red-400 mx-auto flex items-center justify-center">
              <XCircle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-[#f0f6fc]">Verification Failed</h3>
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
