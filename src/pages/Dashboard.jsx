import { useAuth } from "../auth/AuthContext";
import { parseJwt } from "../utils/token";
import { logoutApi } from "../api/auth.api";
import { motion } from "framer-motion";
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
      <motion.div
        className="dashboard-card"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
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
      </motion.div>
    </div>
  );
}