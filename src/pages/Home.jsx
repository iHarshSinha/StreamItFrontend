import { motion as Motion } from "framer-motion";
import useAuth from "../auth/useAuth";
import { logoutApi } from "../api/auth.api";
import { parseJwt } from "../utils/token";
import "./Home.css";

export default function Home() {
  const { token, clearAuth } = useAuth();

  const payload = token ? parseJwt(token) : null;
  const name = payload?.name ?? payload?.sub ?? "";

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
    <div className="home-page">
      <div className="home-header">
        <h1 className="home-title">Home</h1>
        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>

      <Motion.div
        className="home-card"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div className="home-welcome">Welcome{ name ? `, ${name}` : "" }.</div>
        <div className="home-subtitle">You’re logged in.</div>
      </Motion.div>
    </div>
  );
}
