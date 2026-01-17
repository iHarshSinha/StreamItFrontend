import axios from "axios";
import { API_BASE_URL } from "../config/env";
import { refreshToken } from "./auth.api";

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
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
            originalRequest.headers["Authorization"] =
              "Bearer " + token;
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
      processQueue(null, newToken);

      originalRequest.headers["Authorization"] =
        "Bearer " + newToken;

      return api(originalRequest);
    } catch (refreshError) {
      // 🔥 Refresh token expired or invalid
      processQueue(refreshError, null);
      setAuthHeader(null);

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