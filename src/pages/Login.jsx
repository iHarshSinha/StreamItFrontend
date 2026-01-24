import { API_BASE_URL } from "../config/env";
import useAuth from "../auth/useAuth";
import { Navigate } from "react-router-dom";
import { FaGoogle } from "react-icons/fa";
import AnimatedContainer from "../components/AnimatedContainer";
import "./Login.css";

export default function Login() {
  const { isAuthenticated, initializing } = useAuth();

  if (initializing) {
    return <p className="login-loading">Loading...</p>;
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleGoogleLogin = () => {
    window.location.href = `${API_BASE_URL}/oauth2/authorization/google`;
  };

  return (
    <div className="login-page">
      <AnimatedContainer className="login-card">
        <h1 className="login-title">
          Stream<span>It</span>
        </h1>

        <p className="login-subtitle">
          Dive into cinematic streaming
        </p>

        <button
          className="google-login-btn"
          onClick={handleGoogleLogin}
        >
          <FaGoogle className="google-icon" />
          Continue with Google
        </button>
      </AnimatedContainer>
    </div>
  );
}