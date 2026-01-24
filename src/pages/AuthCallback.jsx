import { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { exchangeToken } from "../api/auth.api";
import useAuth from "../auth/useAuth";

export default function AuthCallback() {
  const [params] = useSearchParams();
  const code = params.get("code");
  const error = params.get("error");
  const navigate = useNavigate();
  const { setAuthToken } = useAuth();
  const [authError, setAuthError] = useState(null);
  const hasExchanged = useRef(false); // Prevent double execution in StrictMode

  useEffect(() => {
    if (hasExchanged.current) return; // Already attempted exchange

    if (error) {
      console.error("OAuth error:", error);
      setAuthError(`OAuth error: ${error}`);
      setTimeout(() => navigate("/login"), 3000);
      return;
    }

    if (!code) {
      console.error("No authorization code received");
      setAuthError("No authorization code received");
      setTimeout(() => navigate("/login"), 3000);
      return;
    }

    hasExchanged.current = true; // Mark as attempted
    console.log("Exchanging code for token...");
    
    exchangeToken(code)
      .then((res) => {
        console.log("Token exchange successful");
        setAuthToken(res.data.token);
        navigate("/", { replace: true });
      })
      .catch((err) => {
        console.error("Token exchange failed:", err?.response?.data || err.message);
        setAuthError(err?.response?.data?.error || err?.response?.data?.message || err.message || "Authentication failed");
        setTimeout(() => navigate("/login"), 3000);
      });
  }, [code, error, navigate, setAuthToken]);

  if (authError) {
    return (
      <div style={{ padding: "2rem", textAlign: "center", color: "white" }}>
        <h2>⚠️ Authentication Error</h2>
        <p>{authError}</p>
        <p>Redirecting to login...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem", textAlign: "center", color: "white" }}>
      <h2>🔄 Authenticating...</h2>
      <p>Please wait while we verify your credentials.</p>
    </div>
  );
}