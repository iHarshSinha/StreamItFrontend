import { motion as Motion } from "framer-motion";
import useAuth from "../auth/useAuth";
import { logoutApi } from "../api/auth.api";
import { parseJwt } from "../utils/token";
import GroupsBar from "../components/GroupsBar";
import ChannelsPanel from "../components/ChannelsPanel";
import "./Home.css";

export default function Home() {
  const { token, clearAuth } = useAuth();

  const payload = token ? parseJwt(token) : null;
  const name = payload?.name ?? payload?.sub ?? "";

  const groups = [
    { id: "g1", name: "StreamIt Fans" },
    { id: "g2", name: "Movie Nights" },
    { id: "g3", name: "Anime Club" },
    { id: "g4", name: "Docs & True Crime" },
    { id: "g5", name: "Indie Picks" },
    { id: "g6", name: "Comedy" },
  ];

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
      <div className="home-topbar">
        <div className="home-brand" aria-label="StreamIt">
          Stream<span>It</span>
        </div>

        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>

      <GroupsBar groups={groups} />

      <ChannelsPanel />

      <Motion.div
        className="home-card"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div className="home-welcome">Welcome{ name ? `, ${name}` : "" }.</div>
        <div className="home-subtitle">Pick a group or join a channel.</div>
      </Motion.div>
    </div>
  );
}
