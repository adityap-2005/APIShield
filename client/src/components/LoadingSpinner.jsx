/**
 * LoadingSpinner.jsx
 * Centered spinner using APIShield emerald accent theme.
 */
export default function LoadingSpinner({ message = "Loading...", size = "md", className = "" }) {
  const sizeClasses = {
    sm: "w-5 h-5 border-2",
    md: "w-7 h-7 border-2",
    lg: "w-10 h-10 border-2",
  }[size] || "w-7 h-7 border-2";

  return (
    <div className={`flex flex-col items-center justify-center py-16 gap-3 ${className}`}>
      <div
        className={`${sizeClasses} border-white/10 border-t-emerald-500 rounded-full animate-spin`}
        role="status"
        aria-label="Loading"
      />
      {message && <p className="text-xs text-gray-500 font-mono">{message}</p>}
    </div>
  );
}
