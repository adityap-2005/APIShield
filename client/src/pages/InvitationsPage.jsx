/**
 * InvitationsPage.jsx
 *
 * Page for viewing organization invitations and personal invitations.
 * Uses ConfirmModal for cancellation confirmations.
 */

import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
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

  const targetOrgId = organizationId || activeOrg?._id;

  const [orgInvitations, setOrgInvitations] = useState([]);
  const [myInvitations, setMyInvitations] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Confirm Modal state
  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    invitationId: null,
    loading: false,
  });

  const loadAllInvitations = async () => {
    try {
      setLoading(true);
      setError("");

      const [myRes, orgRes] = await Promise.all([
        invitationsApi.getMyInvitations().catch(() => ({ data: { data: [] } })),
        targetOrgId
          ? invitationsApi.getOrganizationInvitations(targetOrgId).catch(() => ({ data: { data: [] } }))
          : Promise.resolve({ data: { data: [] } }),
      ]);

      setMyInvitations(myRes.data?.data || []);
      setOrgInvitations(orgRes.data?.data || []);
    } catch (err) {
      setError("Failed to load invitations.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllInvitations();
  }, [targetOrgId]);

  const handleAcceptMyInvitation = async (invitationId) => {
    try {
      await invitationsApi.accept(invitationId);
      loadAllInvitations();
      fetchOrganizations();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to accept invitation.");
    }
  };

  const handleRejectMyInvitation = async (invitationId) => {
    try {
      await invitationsApi.reject(invitationId);
      loadAllInvitations();
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
      loadAllInvitations();
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
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Mail className="w-5 h-5 text-[#58a6ff]" />
            Invitations
          </h1>
          <p className="page-description">Manage organization invites sent and received</p>
        </div>
      </div>

      {error && <ErrorMessage message={error} onRetry={loadAllInvitations} />}

      {/* SECTION 1: My Pending Invitations */}
      <div className="space-y-4">
        <h2 className="text-xs font-bold text-[#8b949e] uppercase tracking-wider flex items-center gap-2">
          <Building2 className="w-4 h-4 text-[#58a6ff]" />
          Pending Invitations Sent to You ({myInvitations.length})
        </h2>

        {myInvitations.length === 0 ? (
          <EmptyState message="You have no pending organization invitations." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myInvitations.map((inv) => (
              <div key={inv._id} className="card flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-[#f0f6fc] text-sm">
                    {inv.organizationId?.name || "Organization"}
                  </h3>
                  <p className="text-xs text-[#8b949e] mt-0.5">
                    Invited by <span className="text-[#c9d1d9] font-medium">{inv.invitedBy?.name || inv.invitedBy?.email}</span> as{" "}
                    <Badge variant="info">{inv.role}</Badge>
                  </p>
                  <p className="text-[11px] text-[#8b949e] font-mono mt-1">
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
                    className="btn-secondary text-xs px-3 py-1.5 text-red-400 border-red-900/50 hover:bg-red-950/30"
                  >
                    <X className="w-3.5 h-3.5" /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 2: Organization Invitations */}
      {targetOrgId && (
        <div className="space-y-4 pt-4 border-t border-[#30363d]">
          <h2 className="text-xs font-bold text-[#8b949e] uppercase tracking-wider">
            Invitations Sent by Organization ({orgInvitations.length})
          </h2>

          {orgInvitations.length === 0 ? (
            <EmptyState message="No invitations sent for this organization." />
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
                  {orgInvitations.map((inv) => (
                    <tr key={inv._id}>
                      <td className="font-medium text-[#f0f6fc] font-mono text-xs">{inv.email}</td>
                      <td>
                        <Badge variant="info">{inv.role}</Badge>
                      </td>
                      <td>
                        <Badge variant={getInvitationStatusVariant(inv.status)}>{inv.status}</Badge>
                      </td>
                      <td className="text-xs text-[#8b949e]">
                        {inv.invitedBy?.name || inv.invitedBy?.email}
                      </td>
                      <td className="text-xs text-[#8b949e] font-mono">
                        {new Date(inv.expiresAt).toLocaleDateString()}
                      </td>
                      <td>
                        {inv.status === "PENDING" && (
                          <button
                            onClick={() => openCancelConfirm(inv._id)}
                            className="p-1.5 text-[#8b949e] hover:text-red-400 rounded transition-colors"
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

      {/* Confirm Modal */}
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
