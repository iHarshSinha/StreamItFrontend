import { useCallback, useEffect, useState } from "react";
import {
  acceptInvite,
  getMyInvites,
  rejectInvite,
  sendInvite,
} from "../api/invites.api";
import "./InvitesPanel.css";

export default function InvitesPanel() {
  const [invites, setInvites] = useState([]);
  const [pendingOnly, setPendingOnly] = useState(true);
  const [showSendForm, setShowSendForm] = useState(false);
  
  const [sendForm, setSendForm] = useState({
    channelId: "",
    invitedUserId: "",
  });
  
  const [loading, setLoading] = useState({
    list: false,
    send: false,
    action: null,
  });
  
  const [error, setError] = useState(null);

  // Load invites
  const loadInvites = useCallback(async () => {
    setLoading((prev) => ({ ...prev, list: true }));
    setError(null);
    try {
      const res = await getMyInvites({ pendingOnly });
      setInvites(res.data || []);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to load invites");
    } finally {
      setLoading((prev) => ({ ...prev, list: false }));
    }
  }, [pendingOnly]);

  useEffect(() => {
    loadInvites();
  }, [loadInvites]);

  // Send invite
  const handleSendInvite = async (e) => {
    e.preventDefault();
    setError(null);
    
    const channelId = Number(sendForm.channelId);
    const invitedUserId = Number(sendForm.invitedUserId);
    
    if (!channelId || channelId <= 0) {
      setError("Please enter a valid Channel ID");
      return;
    }
    
    if (!invitedUserId || invitedUserId <= 0) {
      setError("Please enter a valid User ID");
      return;
    }
    
    setLoading((prev) => ({ ...prev, send: true }));
    try {
      await sendInvite({ channelId, invitedUserId });
      setSendForm({ channelId: "", invitedUserId: "" });
      setShowSendForm(false);
      await loadInvites();
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to send invite");
    } finally {
      setLoading((prev) => ({ ...prev, send: false }));
    }
  };

  // Accept invite
  const handleAccept = async (inviteId) => {
    setLoading((prev) => ({ ...prev, action: inviteId }));
    setError(null);
    try {
      await acceptInvite(inviteId);
      await loadInvites();
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to accept invite");
    } finally {
      setLoading((prev) => ({ ...prev, action: null }));
    }
  };

  // Reject invite
  const handleReject = async (inviteId) => {
    setLoading((prev) => ({ ...prev, action: inviteId }));
    setError(null);
    try {
      await rejectInvite(inviteId);
      await loadInvites();
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to reject invite");
    } finally {
      setLoading((prev) => ({ ...prev, action: null }));
    }
  };

  return (
    <div className="invites-panel">
      {error && (
        <div className="invites-error">
          ⚠️ {error}
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      <div className="invites-header">
        <div className="invites-header-left">
          <h2>Channel Invites</h2>
          <label className="pending-toggle">
            <input
              type="checkbox"
              checked={pendingOnly}
              onChange={(e) => setPendingOnly(e.target.checked)}
            />
            <span>Pending only</span>
          </label>
        </div>
        <button
          className="btn-send-toggle"
          onClick={() => setShowSendForm(!showSendForm)}
        >
          {showSendForm ? "✕ Cancel" : "📨 Send Invite"}
        </button>
      </div>

      {showSendForm && (
        <form className="send-invite-form" onSubmit={handleSendInvite}>
          <h3>Send Invite</h3>
          <div className="form-row">
            <div className="form-field">
              <label>Channel ID</label>
              <input
                type="number"
                placeholder="e.g., 1"
                value={sendForm.channelId}
                onChange={(e) =>
                  setSendForm({ ...sendForm, channelId: e.target.value })
                }
                required
              />
            </div>
            <div className="form-field">
              <label>User ID to Invite</label>
              <input
                type="number"
                placeholder="e.g., 5"
                value={sendForm.invitedUserId}
                onChange={(e) =>
                  setSendForm({ ...sendForm, invitedUserId: e.target.value })
                }
                required
              />
            </div>
          </div>
          <button type="submit" disabled={loading.send} className="btn-submit">
            {loading.send ? "Sending..." : "Send Invite"}
          </button>
        </form>
      )}

      <div className="invites-list">
        {loading.list && <p className="loading-text">Loading invites...</p>}
        {!loading.list && invites.length === 0 && (
          <div className="empty-state">
            <p>📭 No invites {pendingOnly ? "pending" : "found"}</p>
          </div>
        )}
        {invites.map((invite) => (
          <div key={invite.inviteId} className="invite-card">
            <div className="invite-header">
              <div className="invite-title">
                <span className="channel-name">{invite.channelName}</span>
                <span className={`status-badge status-${invite.status.toLowerCase()}`}>
                  {invite.status}
                </span>
              </div>
              <div className="invite-meta">
                Invited by: <strong>{invite.invitedByName}</strong>
              </div>
            </div>

            <div className="invite-body">
              <div className="invite-info">
                <div className="info-item">
                  <span className="info-label">Channel ID:</span>
                  <span className="info-value">{invite.channelId}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Invited By ID:</span>
                  <span className="info-value">{invite.invitedById}</span>
                </div>
              </div>

              <div className="invite-dates">
                <div className="date-item">
                  📅 Created: {new Date(invite.createdAt).toLocaleString()}
                </div>
                {invite.expiresAt && (
                  <div className="date-item">
                    ⏰ Expires: {new Date(invite.expiresAt).toLocaleString()}
                  </div>
                )}
              </div>
            </div>

            {invite.status === "PENDING" && (
              <div className="invite-actions">
                <button
                  className="btn-accept"
                  onClick={() => handleAccept(invite.inviteId)}
                  disabled={loading.action === invite.inviteId}
                >
                  {loading.action === invite.inviteId ? "⏳" : "✓ Accept"}
                </button>
                <button
                  className="btn-reject"
                  onClick={() => handleReject(invite.inviteId)}
                  disabled={loading.action === invite.inviteId}
                >
                  {loading.action === invite.inviteId ? "⏳" : "✕ Reject"}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
