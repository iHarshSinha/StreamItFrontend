import api from "./axios";

export const sendInvite = (payload) => api.post("/api/invites/send", payload);

export const getMyInvites = ({ pendingOnly = true } = {}) =>
  api.get("/api/invites/my", {
    params: { pendingOnly },
  });

export const acceptInvite = (inviteId) =>
  api.post(`/api/invites/${inviteId}/accept`);

export const rejectInvite = (inviteId) =>
  api.post(`/api/invites/${inviteId}/reject`);
