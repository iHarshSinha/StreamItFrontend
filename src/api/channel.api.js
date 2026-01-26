import api from "./axios";

export const getChannels = () => api.get("/api/channels");

export const openChannel = (channelId, { limit = 30, cursor = null } = {}) =>
  api.get(`/api/channels/${channelId}/open`, {
    params: {
      limit,
      ...(cursor != null ? { cursor } : {}),
    },
  });

export const createChannel = (payload) => api.post("/api/channels", payload);

export const joinChannel = (channelId) =>
  api.post(`/api/channels/${channelId}/join`);

export const leaveChannel = (channelId) =>
  api.post(`/api/channels/${channelId}/leave`);

export const testSendMessage = (channelId, content) =>
  api.post(`/api/channels/${channelId}/test-send`, { content });
