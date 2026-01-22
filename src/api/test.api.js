import api from "./axios";

export const getPublic = () => api.get("/public");
export const getPrivate = () => api.get("/private");
export const getMe = () => api.get("/me");
