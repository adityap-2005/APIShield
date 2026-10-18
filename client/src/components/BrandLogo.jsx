import { Link } from "react-router-dom";

export function BrandSymbol({ className = "w-7 h-7" }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
      aria-hidden="true"
    >
      {/* Outer Shield Crest */}
      <path
        d="M16 2.75L27 7V15.5C27 22.3 22.2 27.1 16 29.5C9.8 27.1 5 22.3 5 15.5V7L16 2.75Z"
        fill="#0b101b"
        stroke="#10b981"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* Gateway Data Flow Ingress & Egress */}
      <path
        d="M3.75 16H10.5M21.5 16H28.25"
        stroke="#34d399"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Central Protected Gateway Core */}
      <path
        d="M16 10L21.5 16L16 22L10.5 16Z"
        fill="#10b981"
        fillOpacity="0.22"
        stroke="#10b981"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      {/* Central Security Key Nexus Node */}
      <circle cx="16" cy="16" r="2.25" fill="#34d399" />
      {/* Vertical Security Verification Spine */}
      <path
        d="M16 5.2V10M16 22V26.8"
        stroke="#10b981"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function BrandLogo({
  variant = "full", // "full" | "symbol" | "wordmark"
  size = "md", // "sm" | "md" | "lg" | "xl"
  badge = null,
  to = "/",
  className = "",
  onClick = undefined,
}) {
  const sizeConfig = {
    sm: { symbol: "w-5 h-5", text: "text-sm", badge: "text-[9px]" },
    md: { symbol: "w-7 h-7", text: "text-base", badge: "text-[10px]" },
    lg: { symbol: "w-8 h-8", text: "text-lg", badge: "text-[11px]" },
    xl: { symbol: "w-10 h-10", text: "text-xl", badge: "text-xs" },
  };

  const currentSize = sizeConfig[size] || sizeConfig.md;

  const content = (
    <div className={`inline-flex items-center gap-2.5 select-none group ${className}`}>
      {variant !== "wordmark" && (
        <div className="relative flex items-center justify-center transition-transform duration-200 group-hover:scale-105">
          <BrandSymbol className={currentSize.symbol} />
        </div>
      )}

      {variant !== "symbol" && (
        <div className="flex items-baseline gap-2">
          <span
            className={`font-extrabold tracking-tight text-white leading-none ${currentSize.text}`}
          >
            API
            <span className="text-emerald-400 font-semibold">Shield</span>
          </span>
          {badge && (
            <span
              className={`font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-1.5 py-0.5 rounded leading-none uppercase tracking-wider ${currentSize.badge}`}
            >
              {badge}
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (to) {
    return (
      <Link to={to} onClick={onClick} aria-label="APIShield Home">
        {content}
      </Link>
    );
  }

  return content;
}
