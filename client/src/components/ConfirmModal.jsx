/**
 * ConfirmModal.jsx
 *
 * Reusable in-app confirmation modal component replacing browser-native window.confirm() dialogs.
 * Used for all destructive and permission-changing operations.
 */

import { useEffect } from "react";
import { AlertTriangle, Info, ShieldAlert, X } from "lucide-react";

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Action",
  description = "Are you sure you want to perform this action?",
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger", // "danger" | "warning" | "primary"
  loading = false,
}) {
  // Close on Escape key press
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape" && !loading) onClose();
    };
    if (isOpen) document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, loading, onClose]);

  if (!isOpen) return null;

  const iconVariants = {
    danger: <div className="w-10 h-10 rounded-full bg-red-950/60 border border-red-800/80 flex items-center justify-center text-red-400 shrink-0"><AlertTriangle className="w-5 h-5" /></div>,
    warning: <div className="w-10 h-10 rounded-full bg-yellow-950/60 border border-yellow-800/80 flex items-center justify-center text-yellow-400 shrink-0"><ShieldAlert className="w-5 h-5" /></div>,
    primary: <div className="w-10 h-10 rounded-full bg-blue-950/60 border border-blue-800/80 flex items-center justify-center text-blue-400 shrink-0"><Info className="w-5 h-5" /></div>,
  };

  const btnVariants = {
    danger: "bg-[#da3633] text-white hover:bg-red-600 focus:ring-red-500",
    warning: "bg-yellow-600 text-white hover:bg-yellow-500 focus:ring-yellow-500",
    primary: "bg-[#1f6feb] text-white hover:bg-blue-600 focus:ring-blue-500",
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs"
      onClick={() => !loading && onClose()}
    >
      <div
        className="w-full max-w-md bg-[#161b22] border border-[#30363d] rounded-lg shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#30363d]">
          <div className="flex items-center gap-3">
            {iconVariants[variant]}
            <h3 className="text-sm font-bold text-[#f0f6fc]">{title}</h3>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-[#8b949e] hover:text-[#f0f6fc] transition-colors"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Description Body */}
        <div className="p-5">
          <div className="text-xs text-[#c9d1d9] leading-relaxed whitespace-pre-line">
            {description}
          </div>
        </div>

        {/* Actions Footer */}
        <div className="flex items-center justify-end gap-2.5 px-5 py-3.5 bg-[#21262d]/50 border-t border-[#30363d]">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="btn-secondary text-xs"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`inline-flex items-center gap-2 rounded-md px-3.5 py-1.5 text-xs font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0d1117] transition-colors disabled:opacity-50 ${btnVariants[variant]}`}
          >
            {loading ? "Processing..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
