/**
 * LoadingSpinner.jsx
 * A centered spinner used when fetching data matching landing page animations.
 */
export default function LoadingSpinner({ message = "Loading..." }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <div className="w-7 h-7 border-2 border-white/10 border-t-blue-500 rounded-full animate-spin" />
      <p className="text-xs text-gray-500 font-mono">{message}</p>
    </div>
  );
}
