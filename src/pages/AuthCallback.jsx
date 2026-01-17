import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { exchangeToken } from "../api/auth.api";
import useAuth from "../auth/useAuth";

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
        navigate("/", { replace: true });
      })
      .catch(() => navigate("/login"));
  }, [code, navigate, setAuthToken]);

  return <p>Authenticating...</p>;
}