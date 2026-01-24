import useAuth from "../auth/useAuth";
import { parseJwt } from "../utils/token";
import { logoutApi } from "../api/auth.api";
import "./Dashboard.css";

export default function Dashboard() {
  const { token, clearAuth } = useAuth();

  const payload = token ? parseJwt(token) : null;

  const email = payload?.sub;
  const role = payload?.role;
  const name = payload?.name;
  const userId = payload?.userId;
  const expiresAt = payload?.exp
    ? new Date(payload.exp * 1000).toLocaleTimeString()
    : "N/A";

  const handleLogout = async () => {
    try {
      await logoutApi();
    } catch {
      // ignore
    } finally {
      clearAuth();
      window.location.href = "/login";
    }
  };

  return (
    <div className="dashboard-page">
      {/* Header */}
      <div className="dashboard-header">
        <h1 className="dashboard-title">Dashboard</h1>
        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>

      {/* Main Card */}
      <div className="dashboard-card">
        <div className="user-name">{name}</div>
        <div className="user-role">{role}</div>

        <div className="details-grid">
          <div className="detail-item">
            <div className="detail-label">Email</div>
            {email}
          </div>

          <div className="detail-item">
            <div className="detail-label">User ID</div>
            {userId}
          </div>

          <div className="detail-item">
            <div className="detail-label">Token Expiry</div>
            {expiresAt}
          </div>
        </div>
      </div>
    </div>
  );
}