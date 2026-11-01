import { useEffect } from "react";
import { X } from "lucide-react";

export default function Modal({ isOpen, onClose, title, children, size = "md" }) {
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClass = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-3xl",
  }[size] || "max-w-lg";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <div
        className={`w-full ${sizeClass} max-h-[calc(100vh-2rem)] flex flex-col bg-[#161b22] border border-white/10 rounded-xl shadow-2xl shadow-black/60 overflow-hidden text-left my-auto animate-in fade-in zoom-in-95 duration-100`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 sm:py-4 border-b border-white/10 bg-[#1c2128] shrink-0">
          <h2 className="text-sm font-bold text-white tracking-tight">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-1 rounded-md hover:bg-white/5"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="px-5 sm:px-6 py-4 sm:py-5 overflow-y-auto flex-1">
          {children}
        </div>
      </div>
    </div>
  );
}
