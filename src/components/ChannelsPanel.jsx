import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createChannel,
  getChannels,
  joinChannel,
  leaveChannel,
  openChannel,
  testSendMessage,
} from "../api/channel.api";
import "./ChannelsPanel.css";

const INITIAL_FORM = {
  channelName: "",
  channelDescription: "",
  type: "PUBLIC",
};

export default function ChannelsPanel() {
  const [channels, setChannels] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [detailsRes, setDetailsRes] = useState(null);
  const [limit] = useState(30);

  const [messageDraft, setMessageDraft] = useState("");

  const [form, setForm] = useState(INITIAL_FORM);

  const [loading, setLoading] = useState({
    list: false,
    details: false,
    create: false,
    joinLeave: null,
    more: false,
    send: false,
  });

  const [error, setError] = useState(null);

  const selectedChannel = useMemo(
    () => channels.find((c) => String(c.id) === String(selectedId)) ?? null,
    [channels, selectedId]
  );

  const refreshList = useCallback(async () => {
    setError(null);
    setLoading((p) => ({ ...p, list: true }));
    try {
      const res = await getChannels();
      setChannels(res.data ?? []);
      if (res.data?.length && selectedId == null) {
        setSelectedId(res.data[0].id);
      }
    } catch (e) {
      setError(e?.response?.data ?? e?.message ?? "Failed to load channels");
    } finally {
      setLoading((p) => ({ ...p, list: false }));
    }
  }, [selectedId]);

  const open = useCallback(async (id, { cursor = null, append = false } = {}) => {
    setError(null);
    setLoading((p) => ({ ...p, details: true }));
    try {
      const res = await openChannel(id, { limit, cursor });

      if (!append) {
        setDetailsRes({ ok: true, status: res.status, body: res.data });
        return;
      }

      setDetailsRes((prev) => {
        const prevBody = prev?.ok ? prev.body : null;
        const nextBody = res.data;

        const prevMsgs = Array.isArray(prevBody?.messages) ? prevBody.messages : [];
        const nextMsgs = Array.isArray(nextBody?.messages) ? nextBody.messages : [];

        // De-dupe by id if present; otherwise just concat
        const hasId = (m) => m && (typeof m.id === "number" || typeof m.id === "string");
        const merged = (() => {
          if (nextMsgs.some(hasId) || prevMsgs.some(hasId)) {
            const map = new Map();
            for (const m of [...prevMsgs, ...nextMsgs]) {
              const key = hasId(m) ? String(m.id) : JSON.stringify(m);
              if (!map.has(key)) map.set(key, m);
            }
            return Array.from(map.values());
          }
          return [...prevMsgs, ...nextMsgs];
        })();

        return {
          ok: true,
          status: res.status,
          body: {
            ...nextBody,
            messages: merged,
          },
        };
      });
    } catch (e) {
      const status = e?.response?.status ?? null;
      const body = e?.response?.data ?? null;
      const message = e?.message ?? "Failed to load channel";
      setDetailsRes({ ok: false, status, body, message });
      setError(body ?? message);
    } finally {
      setLoading((p) => ({ ...p, details: false }));
    }
  }, [limit]);

  const loadMore = async () => {
    if (!selectedId) return;
    if (!detailsRes?.ok) return;

    const cursor = detailsRes?.body?.nextCursor;
    if (cursor == null) return;

    setLoading((p) => ({ ...p, more: true }));
    try {
      await open(selectedId, { cursor, append: true });
    } finally {
      setLoading((p) => ({ ...p, more: false }));
    }
  };

  const onSendMessage = async (e) => {
    e.preventDefault();
    if (!selectedId) return;

    const content = messageDraft.trim();
    if (!content) return;

    setError(null);
    setLoading((p) => ({ ...p, send: true }));
    try {
      await testSendMessage(selectedId, content);
      setMessageDraft("");
      await open(selectedId);
    } catch (e2) {
      const hasResponse = !!e2?.response;
      if (hasResponse) {
        setError(e2?.response?.data ?? e2?.message ?? "Failed to send message");
      } else {
        const method = e2?.config?.method ? String(e2.config.method).toUpperCase() : "";
        const baseURL = e2?.config?.baseURL ?? "";
        const url = e2?.config?.url ?? "";
        const fullUrl = baseURL && url ? `${baseURL}${url}` : baseURL || url;
        setError(
          `Network Error calling ${method} ${fullUrl || "(unknown url)"}. ` +
            `This usually means CORS/mixed-content/server-down or a wrong endpoint mapping.`
        );
      }
    } finally {
      setLoading((p) => ({ ...p, send: false }));
    }
  };

  const onCreate = async (e) => {
    e.preventDefault();
    setError(null);

    const payload = {
      channelName: form.channelName.trim(),
      channelDescription: form.channelDescription.trim(),
      type: form.type,
    };

    if (!payload.channelName) {
      setError("Channel name is required");
      return;
    }

    setLoading((p) => ({ ...p, create: true }));
    try {
      const res = await createChannel(payload);
      const createdId = res?.data?.id ?? null;
      setForm(INITIAL_FORM);
      await refreshList();

      // If backend returns the created channel, auto-select it to "view" details
      if (createdId != null) {
        setSelectedId(createdId);
      }
    } catch (e2) {
      setError(e2?.response?.data ?? e2?.message ?? "Failed to create channel");
    } finally {
      setLoading((p) => ({ ...p, create: false }));
    }
  };

  const onJoinLeave = async (channelId, mode) => {
    setError(null);
    setLoading((p) => ({ ...p, joinLeave: String(channelId) }));
    try {
      if (mode === "join") {
        await joinChannel(channelId);
      } else {
        await leaveChannel(channelId);
      }
      await refreshList();
      if (selectedId != null) {
        setDetailsRes(null);
        await open(selectedId);
      }
    } catch (e) {
      setError(e?.response?.data ?? e?.message ?? "Operation failed");
    } finally {
      setLoading((p) => ({ ...p, joinLeave: null }));
    }
  };

  useEffect(() => {
    refreshList();
  }, [refreshList]);

  useEffect(() => {
    if (selectedId == null) return;
    setDetailsRes(null);
    open(selectedId);
  }, [open, selectedId]);

  return (
    <section className="channels">
      <div className="channels-top">
        <div>
          <h2 className="channels-title">Channels</h2>
          <p className="channels-subtitle">
            List, create, join, leave, and view details
          </p>
        </div>

        <button
          className="channels-btn"
          type="button"
          onClick={refreshList}
          disabled={loading.list}
        >
          {loading.list ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {error ? <div className="channels-error">{String(error)}</div> : null}

      <div className="channels-grid">
        <div className="channels-card">
          <div className="channels-card-title">Create channel</div>
          <form className="channels-form" onSubmit={onCreate}>
            <label className="channels-label">
              Name
              <input
                className="channels-input"
                value={form.channelName}
                onChange={(e) =>
                  setForm((p) => ({ ...p, channelName: e.target.value }))
                }
                placeholder="e.g. Movie Nights"
              />
            </label>

            <label className="channels-label">
              Description
              <input
                className="channels-input"
                value={form.channelDescription}
                onChange={(e) =>
                  setForm((p) => ({ ...p, channelDescription: e.target.value }))
                }
                placeholder="Short description"
              />
            </label>

            <label className="channels-label">
              Type
              <select
                className="channels-input"
                value={form.type}
                onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
              >
                <option value="PUBLIC">PUBLIC</option>
                <option value="PRIVATE">PRIVATE</option>
              </select>
            </label>

            <button className="channels-btn" type="submit" disabled={loading.create}>
              {loading.create ? "Creating…" : "Create"}
            </button>
          </form>
        </div>

        <div className="channels-card">
          <div className="channels-card-title">Your channels</div>

          <div className="channels-list" role="list">
            {channels.map((c) => (
              <div
                key={c.id}
                className={`channels-row${
                  String(c.id) === String(selectedId) ? " is-active" : ""
                }`}
                role="listitem"
              >
                <button
                  type="button"
                  className="channels-row-main"
                  onClick={() => setSelectedId(c.id)}
                >
                  <div className="channels-row-name">{c.channelName}</div>
                  <div className="channels-row-meta">
                    <span className="channels-pill">{c.type}</span>
                    {c.channelDescription ? (
                      <span className="channels-desc">{c.channelDescription}</span>
                    ) : null}
                  </div>
                </button>

                <div className="channels-row-actions">
                  <button
                    type="button"
                    className="channels-btn is-small"
                    onClick={() => onJoinLeave(c.id, "join")}
                    disabled={loading.joinLeave === String(c.id)}
                  >
                    {loading.joinLeave === String(c.id) ? "…" : "Join"}
                  </button>

                  <button
                    type="button"
                    className="channels-btn is-small"
                    onClick={() => onJoinLeave(c.id, "leave")}
                    disabled={loading.joinLeave === String(c.id)}
                  >
                    {loading.joinLeave === String(c.id) ? "…" : "Leave"}
                  </button>
                </div>
              </div>
            ))}

            {channels.length === 0 ? (
              <div className="channels-empty">No channels yet.</div>
            ) : null}
          </div>
        </div>

        <div className="channels-card">
          <div className="channels-card-title">Selected channel</div>
          <div className="channels-selected-meta">
            {selectedChannel ? (
              <>
                <div className="channels-selected-name">{selectedChannel.channelName}</div>
                <div className="channels-selected-sub">
                  <span className="channels-pill">{selectedChannel.type}</span>
                  {selectedChannel.createdOn ? (
                    <span className="channels-desc">Created: {String(selectedChannel.createdOn)}</span>
                  ) : null}
                </div>
              </>
            ) : (
              <div className="channels-empty">Select a channel to view details.</div>
            )}
          </div>

          {detailsRes?.ok ? (
            <div className="channels-viewer">
              <div className="channels-card-title">Viewer</div>
              <div className="channels-viewer-grid">
                <div>
                  <div className="channels-desc">Member</div>
                  <div className="channels-viewer-value">
                    {detailsRes?.body?.viewer?.isMember ? "Yes" : "No"}
                  </div>
                </div>
                <div>
                  <div className="channels-desc">Role</div>
                  <div className="channels-viewer-value">
                    {detailsRes?.body?.viewer?.role ?? "—"}
                  </div>
                </div>
                <div>
                  <div className="channels-desc">Status</div>
                  <div className="channels-viewer-value">
                    {detailsRes?.body?.viewer?.status ?? "—"}
                  </div>
                </div>
                <div>
                  <div className="channels-desc">Joined</div>
                  <div className="channels-viewer-value">
                    {detailsRes?.body?.viewer?.joinedAt
                      ? String(detailsRes.body.viewer.joinedAt)
                      : "—"}
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {detailsRes?.ok && Array.isArray(detailsRes?.body?.messages) ? (
            <div className="channels-messages">
              <div className="channels-messages-top">
                <div className="channels-card-title">Messages</div>
                <button
                  type="button"
                  className="channels-btn is-small"
                  onClick={loadMore}
                  disabled={loading.more || detailsRes?.body?.nextCursor == null}
                >
                  {detailsRes?.body?.nextCursor == null
                    ? "No more"
                    : loading.more
                      ? "Loading…"
                      : "Load more"}
                </button>
              </div>

              <form className="channels-form" onSubmit={onSendMessage}>
                <label className="channels-label">
                  Test-send message
                  <input
                    className="channels-input"
                    value={messageDraft}
                    onChange={(e) => setMessageDraft(e.target.value)}
                    placeholder="Type a message…"
                    disabled={loading.send}
                  />
                </label>
                <button
                  className="channels-btn"
                  type="submit"
                  disabled={loading.send || !messageDraft.trim()}
                >
                  {loading.send ? "Sending…" : "Send"}
                </button>
              </form>

              <div className="channels-messages-list">
                {detailsRes.body.messages.length === 0 ? (
                  <div className="channels-empty">No messages.</div>
                ) : (
                  detailsRes.body.messages.map((m, idx) => (
                    <div className="channels-message" key={m?.id ?? idx}>
                      <div className="channels-message-meta">
                        <div className="channels-message-sender">
                          {m?.sender?.profileImageUrl ? (
                            <img
                              className="channels-message-avatar"
                              src={m.sender.profileImageUrl}
                              alt=""
                              referrerPolicy="no-referrer"
                            />
                          ) : null}

                          <span className="channels-pill">
                            {m?.sender?.name ?? (m?.sender?.id != null ? `User #${m.sender.id}` : "User")}
                          </span>
                        </div>

                        <span className="channels-desc">
                          {m?.sentAt ? String(m.sentAt) : ""}
                        </span>
                      </div>
                      <div className="channels-message-body">
                        {m?.content ?? ""}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : null}

          <pre className="channels-json">
            {detailsRes
              ? JSON.stringify(detailsRes, null, 2)
              : selectedId
                ? "Loading details…"
                : "No channel selected"}
          </pre>
        </div>
      </div>
    </section>
  );
}
