/**
 * Badge.jsx
 * Small colored pill badge for statuses and roles matching the landing page theme.
 *
 * Usage:
 *   <Badge variant="success">Active</Badge>
 *   <Badge variant="danger">Revoked</Badge>
 *   <Badge variant="warning">Pending</Badge>
 *   <Badge variant="default">Member</Badge>
 *   <Badge variant="purple">OWNER</Badge>
 */

const variants = {
  success: "bg-green-950/60 text-green-400 border border-green-800/40",
  danger:  "bg-red-950/60 text-red-400 border border-red-800/40",
  warning: "bg-yellow-950/60 text-yellow-400 border border-yellow-800/40",
  info:    "bg-blue-950/60 text-blue-400 border border-blue-800/40",
  blue:    "bg-blue-950/60 text-blue-300 border border-blue-800/40",
  purple:  "bg-blue-950/60 text-blue-300 border border-blue-800/40",
  default: "bg-white/5 text-gray-400 border border-white/10",
};

export default function Badge({ children, variant = "default" }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-medium ${variants[variant]}`}>
      {children}
    </span>
  );
}

// Helper to get the right badge variant for API key status
export function getApiKeyStatusVariant(status) {
  switch (status) {
    case "ACTIVE":   return "success";
    case "REVOKED":  return "danger";
    case "EXPIRED":  return "warning";
    case "ARCHIVED": return "default";
    default:         return "default";
  }
}

// Helper to get badge variant for invitation status
export function getInvitationStatusVariant(status) {
  switch (status) {
    case "PENDING":   return "warning";
    case "ACCEPTED":  return "success";
    case "REJECTED":  return "danger";
    case "CANCELLED": return "default";
    case "EXPIRED":   return "default";
    default:          return "default";
  }
}

// Helper to get badge variant for membership role
export function getRoleVariant(role) {
  switch (role) {
    case "OWNER":      return "purple";
    case "ADMIN":      return "info";
    case "DEVELOPER":  return "default";
    case "TEAM_ADMIN": return "info";
    case "MEMBER":     return "default";
    default:           return "default";
  }
}
