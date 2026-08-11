/**
 * Badge.jsx
 * Small colored pill badge for statuses and roles.
 *
 * Usage:
 *   <Badge variant="success">Active</Badge>
 *   <Badge variant="danger">Revoked</Badge>
 *   <Badge variant="warning">Pending</Badge>
 *   <Badge variant="default">Member</Badge>
 *   <Badge variant="purple">OWNER</Badge>
 */

const variants = {
  success: "bg-green-900/40 text-green-400 border border-green-800",
  danger:  "bg-red-900/40 text-red-400 border border-red-800",
  warning: "bg-yellow-900/40 text-yellow-400 border border-yellow-800",
  info:    "bg-blue-900/40 text-blue-400 border border-blue-800",
  purple:  "bg-purple-900/40 text-purple-400 border border-purple-800",
  default: "bg-gray-800 text-gray-400 border border-gray-700",
};

export default function Badge({ children, variant = "default" }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${variants[variant]}`}>
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
