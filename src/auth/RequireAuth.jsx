import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function RequireAuth({ children }) {
  const { token, initializing } = useAuth();

  // ⏳ Still determining auth state
  if (initializing) {
    return <p>Loading...</p>;
  }

  // ❌ Not authenticated
  if (!token) {
    return <Navigate to="/login" />;
  }

  // ✅ Authenticated
  return children;
}