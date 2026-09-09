import { useState, useEffect } from "react";
import { useParams, useLocation } from "react-router-dom";
import { useOrg } from "../context/OrgContext";
import invitationsApi from "../api/invitations";

import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";
import EmptyState from "../components/EmptyState";
import Badge, { getInvitationStatusVariant } from "../components/Badge";
import ConfirmModal from "../components/ConfirmModal";

import { Mail, Check, X, Ban, Building2 } from "lucide-react";

export default function InvitationsPage() {
  const { activeOrg, fetchOrganizations } = useOrg();
  const { organizationId } = useParams();
  const location = useLocation();

  const isOrgContext = Boolean(organizationId) || location.pathname.startsWith("/org/");
  const targetOrgId = organizationId || activeOrg?._id;

  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    invitationId: null,
    loading: false,
  });

  const loadInvitations = async () => {
    try {
      setLoading(true);
      setError("");

      if (isOrgContext) {
        if (!targetOrgId) {
          setInvitations([]);
          setLoading(false);
          return;
        }
        const response = await invitationsApi.getOrganizationInvitations(targetOrgId);
        setInvitations(response.data?.data || []);
      } else {
        const response = await invitationsApi.getMyInvitations();
        setInvitations(response.data?.data || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load invitations.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvitations();
  }, [isOrgContext, targetOrgId]);

  const handleAcceptMyInvitation = async (invitationId) => {
    try {
      await invitationsApi.accept(invitationId);
      loadInvitations();
      fetchOrganizations();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to accept invitation.");
    }
  };

  const handleRejectMyInvitation = async (invitationId) => {
    try {
      await invitationsApi.reject(invitationId);
      loadInvitations();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to reject invitation.");
    }
  };

  const openCancelConfirm = (invitationId) => {
    setConfirmState({
      isOpen: true,
      invitationId,
      loading: false,
    });
  };

  const handleConfirmCancel = async () => {
    try {
      setConfirmState((prev) => ({ ...prev, loading: true }));
      await invitationsApi.cancel(targetOrgId, confirmState.invitationId);
      setConfirmState({ isOpen: false, invitationId: null, loading: false });
      loadInvitations();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to cancel invitation.");
      setConfirmState((prev) => ({ ...prev, loading: false }));
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading invitations..." />;
  }

  return (
    <div className="space-y-8">
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Mail className="w-5 h-5 text-blue-400" />
            {isOrgContext ? "Workspace Invitations" : "My Personal Invitations"}
          </h1>
          <p className="page-description">
            {isOrgContext
              ? "Manage invitations sent to developers for this workspace"
              : "Review and respond to workspace invitations sent to you"}
          </p>
        </div>
      </div>

      {error && <ErrorMessage message={error} onRetry={loadInvitations} />}

      {/* USER PERSONAL INVITATIONS VIEW */}
      {!isOrgContext && !error && (
        <div className="space-y-4">
          <h2 className="text-xs font-mono font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-400" />
            Pending Invitations Sent to You ({invitations.length})
          </h2>

          {invitations.length === 0 ? (
            <EmptyState message="You have no pending workspace invitations." />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {invitations.map((inv) => (
                <div key={inv._id} className="card bg-[#161b22] border-white/10 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-white text-sm">
                      {inv.organizationId?.name || "Workspace"}
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Invited by <span className="text-white font-medium">{inv.invitedBy?.name || inv.invitedBy?.email}</span> as{" "}
                      <Badge variant="info">{inv.role}</Badge>
                    </p>
                    <p className="text-[11px] text-gray-500 font-mono mt-1">
                      Expires: {new Date(inv.expiresAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleAcceptMyInvitation(inv._id)}
                      className="btn-primary text-xs px-3 py-1.5"
                    >
                      <Check className="w-3.5 h-3.5" /> Accept
                    </button>
                    <button
                      onClick={() => handleRejectMyInvitation(inv._id)}
                      className="btn-secondary text-xs px-3 py-1.5 text-red-400 border-red-800/60 hover:bg-red-950/40"
                    >
                      <X className="w-3.5 h-3.5" /> Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ORGANIZATION INVITATIONS MANAGEMENT VIEW */}
      {isOrgContext && !error && (
        <div className="space-y-4">
          <h2 className="text-xs font-mono font-semibold text-gray-400 uppercase tracking-wider">
            Invitations Sent by Workspace ({invitations.length})
          </h2>

          {invitations.length === 0 ? (
            <EmptyState message="No invitations sent for this workspace." />
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Invited Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Invited By</th>
                    <th>Expires</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invitations.map((inv) => (
                    <tr key={inv._id}>
                      <td className="font-medium text-white font-mono text-xs">{inv.email}</td>
                      <td>
                        <Badge variant="info">{inv.role}</Badge>
                      </td>
                      <td>
                        <Badge variant={getInvitationStatusVariant(inv.status)}>{inv.status}</Badge>
                      </td>
                      <td className="text-xs text-gray-400">
                        {inv.invitedBy?.name || inv.invitedBy?.email}
                      </td>
                      <td className="text-xs text-gray-400 font-mono">
                        {new Date(inv.expiresAt).toLocaleDateString()}
                      </td>
                      <td>
                        {inv.status === "PENDING" && (
                          <button
                            onClick={() => openCancelConfirm(inv._id)}
                            className="p-1.5 text-gray-500 hover:text-red-400 rounded transition-colors"
                            title="Cancel Invitation"
                          >
                            <Ban className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <ConfirmModal
        isOpen={confirmState.isOpen}
        onClose={() => setConfirmState((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={handleConfirmCancel}
        title="Cancel Invitation?"
        description="Are you sure you want to cancel this pending invitation? The invitee will no longer be able to accept it."
        confirmText="Cancel Invitation"
        variant="warning"
        loading={confirmState.loading}
      />
    </div>
  );
}
