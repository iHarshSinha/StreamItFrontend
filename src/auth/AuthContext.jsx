import { createContext, useContext, useEffect, useState } from "react";
import { refreshToken } from "../api/auth.api";
import { setAuthHeader } from "../api/axios";
import { parseJwt, isTokenExpired } from "../utils/token";

const AuthContext = createContext(null);
const STORAGE_KEY = "access_token";

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [initializing, setInitializing] = useState(true);

  const setAuthToken = (jwt) => {
    setToken(jwt);
    setAuthHeader(jwt);
    localStorage.setItem(STORAGE_KEY, jwt);
  };

  const clearAuth = () => {
    setToken(null);
    setAuthHeader(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  // 🔄 Restore token ONCE (no refresh here)
  useEffect(() => {
    const storedToken = localStorage.getItem(STORAGE_KEY);

    if (storedToken && !isTokenExpired(storedToken)) {
      setToken(storedToken);
      setAuthHeader(storedToken);
    }

    setInitializing(false);
  }, []);

  // ⏰ Refresh ONLY based on expiry
  useEffect(() => {
    if (!token || isTokenExpired(token)) return;

    const payload = parseJwt(token);
    if (!payload?.exp) return;

    const expiresAt = payload.exp * 1000;
    const refreshAt = expiresAt - 30_000;
    const timeout = refreshAt - Date.now();

    if (timeout <= 0) return;

    console.log(
      "[AUTH] Access token expires at:",
      new Date(expiresAt).toLocaleTimeString()
    );
    console.log(
      "[AUTH] Refresh will run at:",
      new Date(refreshAt).toLocaleTimeString()
    );

    const timer = setTimeout(() => {
      console.log("[AUTH] Sending refresh request");
      refreshToken()
        .then((res) => setAuthToken(res.data.token))
        .catch(clearAuth);
    }, timeout);

    return () => clearTimeout(timer);
  }, [token]);

  return (
    <AuthContext.Provider
      value={{
        token,
        setAuthToken,
        clearAuth,
        initializing,
        isAuthenticated: !!token && !isTokenExpired(token),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);