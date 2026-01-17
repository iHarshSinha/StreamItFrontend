import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { exchangeToken } from "../api/auth.api";
import { useAuth } from "../auth/AuthContext";

export default function AuthCallback() {
  const [params] = useSearchParams();
  const code = params.get("code");
  const navigate = useNavigate();
  const { setAuthToken } = useAuth();

  useEffect(() => {
    if (!code) return;

    exchangeToken(code)
      .then((res) => {
        setAuthToken(res.data.token);
        navigate("/dashboard", { replace: true });
      })
      .catch(() => navigate("/login"));
  }, [code]);

  return <p>Authenticating...</p>;
}