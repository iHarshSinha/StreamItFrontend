import { useState } from "react";
import useAuth from "../auth/useAuth";
import { logoutApi } from "../api/auth.api";
import { parseJwt } from "../utils/token";
import ChannelsPanel from "../components/ChannelsPanel";
import InvitesPanel from "../components/InvitesPanel";
import "./Home.css";

export default function Home() {
  const { token, clearAuth } = useAuth();
  const [activeTab, setActiveTab] = useState("channels");

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
      <div className="home-topbar">
        <div className="home-brand" aria-label="StreamIt">
          Stream<span>It</span>
        </div>
        <div className="home-user-info">
          {name && <span className="home-username">👋 {name}</span>}
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>

      <div className="home-tabs">
        <button
          className={`home-tab ${activeTab === "channels" ? "active" : ""}`}
          onClick={() => setActiveTab("channels")}
        >
          📺 Channels
        </button>
        <button
          className={`home-tab ${activeTab === "invites" ? "active" : ""}`}
          onClick={() => setActiveTab("invites")}
        >
          📬 Invites
        </button>
      </div>

      <div className="home-content" key={activeTab}>
        {activeTab === "channels" && <ChannelsPanel />}
        {activeTab === "invites" && <InvitesPanel />}
      </div>
    </div>
  );
}
