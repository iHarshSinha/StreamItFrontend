import api from "./axios";

export const exchangeToken = (code) => {
  return api.post("/auth/exchange-token", { code });
};

export const refreshToken = () => {
  return api.post("/auth/refresh");
};

export const logoutApi = () => {
  return api.post("/auth/logout");
};