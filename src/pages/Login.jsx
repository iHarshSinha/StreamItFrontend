import { API_BASE_URL } from "../config/env";
import { useAuth } from "../auth/AuthContext";
import { Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FaGoogle } from "react-icons/fa";
import AnimatedContainer from "../components/AnimatedContainer";
import "./Login.css";

export default function Login() {
  const { isAuthenticated, initializing } = useAuth();

  if (initializing) {
    return <p className="login-loading">Loading...</p>;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleGoogleLogin = () => {
    window.location.href = `${API_BASE_URL}/oauth2/authorization/google`;
  };

  return (
    <div className="login-page">
      <AnimatedContainer className="login-card">
        <motion.h1
          className="login-title"
          variants={{
            hidden: { opacity: 0, y: -20 },
            visible: { opacity: 1, y: 0 },
          }}
        >
          Stream<span>It</span>
        </motion.h1>

        <motion.p
          className="login-subtitle"
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1 },
          }}
        >
          Dive into cinematic streaming
        </motion.p>

        <motion.button
          className="google-login-btn"
          onClick={handleGoogleLogin}
          variants={{
            hidden: { opacity: 0, y: 10 },
            visible: { opacity: 1, y: 0 },
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <FaGoogle className="google-icon" />
          Continue with Google
        </motion.button>
      </AnimatedContainer>
    </div>
  );
}