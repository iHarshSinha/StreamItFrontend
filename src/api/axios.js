import axios from "axios";
import { API_BASE_URL } from "../config/env";
import { refreshToken } from "./auth.api";

const STORAGE_KEY = "access_token";

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    Accept: "application/json",
  },
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });

  failedQueue = [];
};

export const setAuthHeader = (token) => {
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common["Authorization"];
  }
};

/**
 * REQUEST INTERCEPTOR - Inject Authorization header from localStorage
 */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(STORAGE_KEY);

    const getExistingAuth = () => {
      const headers = config?.headers;
      if (!headers) return null;
      if (typeof headers.get === "function") {
        return headers.get("Authorization") ?? headers.get("authorization");
      }
      return headers.Authorization ?? headers.authorization ?? null;
    };

    const existingAuth = getExistingAuth();

    if (!existingAuth && token) {
      const value = `Bearer ${token}`;
      if (config.headers && typeof config.headers.set === "function") {
        config.headers.set("Authorization", value);
      } else {
        config.headers = {
          ...(config.headers ?? {}),
          Authorization: value,
        };
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * RESPONSE INTERCEPTOR
 */
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // 🔴 If no response or not 401 → fail normally
    if (!error.response || error.response.status !== 401) {
      return Promise.reject(error);
    }

    // 🔴 If refresh endpoint itself failed → force login
    if (originalRequest.url.includes("/auth/refresh")) {
      setAuthHeader(null);
      localStorage.removeItem(STORAGE_KEY);

      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }

      return Promise.reject(error);
    }

    // 🔴 Prevent infinite retry loop
    if (originalRequest._retry) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    // 🧵 If refresh already running → queue request
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({
          resolve: (token) => {
            if (originalRequest.headers && typeof originalRequest.headers.set === "function") {
              originalRequest.headers.set("Authorization", `Bearer ${token}`);
            } else {
              originalRequest.headers = {
                ...(originalRequest.headers ?? {}),
                Authorization: `Bearer ${token}`,
              };
            }
            resolve(api(originalRequest));
          },
          reject,
        });
      });
    }

    isRefreshing = true;

    try {
      const res = await refreshToken();
      const newToken = res.data.token;

      setAuthHeader(newToken);
      localStorage.setItem(STORAGE_KEY, newToken);
      processQueue(null, newToken);

      if (originalRequest.headers && typeof originalRequest.headers.set === "function") {
        originalRequest.headers.set("Authorization", `Bearer ${newToken}`);
      } else {
        originalRequest.headers = {
          ...(originalRequest.headers ?? {}),
          Authorization: `Bearer ${newToken}`,
        };
      }

      return api(originalRequest);
    } catch (refreshError) {
      // 🔥 Refresh token expired or invalid
      processQueue(refreshError, null);
      setAuthHeader(null);
      localStorage.removeItem(STORAGE_KEY);

      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }

      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;