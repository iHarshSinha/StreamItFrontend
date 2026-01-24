import { useCallback, useEffect, useState } from "react";
import {
  createChannel,
  getChannels,
  joinChannel,
  leaveChannel,
  openChannel,
  testSendMessage,
} from "../api/channel.api";
import "./ChannelsPanel.css";

export default function ChannelsPanel() {
  const [channels, setChannels] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [channelDetails, setChannelDetails] = useState(null);
  const [messages, setMessages] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState({
    channelName: "",
    channelDescription: "",
    type: "PUBLIC",
  });
  
  const [messageText, setMessageText] = useState("");
  
  const [loading, setLoading] = useState({
    channels: false,
    details: false,
    create: false,
    join: false,
    leave: false,
    send: false,
    loadMore: false,
  });
  
  const [error, setError] = useState(null);

  // Load all channels
  const loadChannels = useCallback(async () => {
    setLoading((prev) => ({ ...prev, channels: true }));
    setError(null);
    try {
      const res = await getChannels();
      setChannels(res.data || []);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to load channels");
    } finally {
      setLoading((prev) => ({ ...prev, channels: false }));
    }
  }, []);

  useEffect(() => {
    loadChannels();
  }, [loadChannels]);

  // Open a channel (load details + messages)
  const handleOpenChannel = useCallback(async (channelId, append = false, cursor = null) => {
    setLoading((prev) => ({ ...prev, details: !append, loadMore: append }));
    setError(null);
    try {
      const res = await openChannel(channelId, { limit: 30, cursor });
      const data = res.data;
      
      console.log('Channel opened:', data); // Debug log
      
      if (!append) {
        setSelectedChannel(channelId);
        setChannelDetails(data);
        setMessages(data.messages || []);
        setNextCursor(data.nextCursor);
      } else {
        setMessages((prev) => [...prev, ...(data.messages || [])]);
        setNextCursor(data.nextCursor);
      }
    } catch (err) {
      console.error('Failed to open channel:', err);
      setError(err?.response?.data?.message || err.message || "Failed to open channel");
    } finally {
      setLoading((prev) => ({ ...prev, details: false, loadMore: false }));
    }
  }, []);

  // Create channel
  const handleCreateChannel = async (e) => {
    e.preventDefault();
    setLoading((prev) => ({ ...prev, create: true }));
    setError(null);
    try {
      await createChannel(createForm);
      setCreateForm({ channelName: "", channelDescription: "", type: "PUBLIC" });
      setShowCreateForm(false);
      await loadChannels();
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to create channel");
    } finally {
      setLoading((prev) => ({ ...prev, create: false }));
    }
  };

  // Join channel
  const handleJoinChannel = async (channelId) => {
    setLoading((prev) => ({ ...prev, join: true }));
    setError(null);
    try {
      await joinChannel(channelId);
      await handleOpenChannel(channelId);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to join channel");
    } finally {
      setLoading((prev) => ({ ...prev, join: false }));
    }
  };

  // Leave channel
  const handleLeaveChannel = async (channelId) => {
    setLoading((prev) => ({ ...prev, leave: true }));
    setError(null);
    try {
      await leaveChannel(channelId);
      setSelectedChannel(null);
      setChannelDetails(null);
      setMessages([]);
      await loadChannels();
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to leave channel");
    } finally {
      setLoading((prev) => ({ ...prev, leave: false }));
    }
  };

  // Send test message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedChannel) return;
    
    setLoading((prev) => ({ ...prev, send: true }));
    setError(null);
    try {
      await testSendMessage(selectedChannel, messageText);
      setMessageText("");
      await handleOpenChannel(selectedChannel);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to send message");
    } finally {
      setLoading((prev) => ({ ...prev, send: false }));
    }
  };

  // Load more messages
  const handleLoadMore = () => {
    if (nextCursor && selectedChannel) {
      handleOpenChannel(selectedChannel, true, nextCursor);
    }
  };

  return (
    <div className="channels-panel">
      {error && (
        <div className="channels-error">
          ⚠️ {error}
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      <div className="channels-layout">
        {/* Sidebar: Channel List */}
        <div className="channels-sidebar">
          <div className="channels-sidebar-header">
            <h2>Channels</h2>
            <button
              className="btn-create-toggle"
              onClick={() => setShowCreateForm(!showCreateForm)}
            >
              {showCreateForm ? "✕" : "+"}
            </button>
          </div>

          {showCreateForm && (
            <form className="create-channel-form" onSubmit={handleCreateChannel}>
              <input
                type="text"
                placeholder="Channel name"
                value={createForm.channelName}
                onChange={(e) =>
                  setCreateForm({ ...createForm, channelName: e.target.value })
                }
                required
              />
              <input
                type="text"
                placeholder="Description"
                value={createForm.channelDescription}
                onChange={(e) =>
                  setCreateForm({ ...createForm, channelDescription: e.target.value })
                }
              />
              <select
                value={createForm.type}
                onChange={(e) =>
                  setCreateForm({ ...createForm, type: e.target.value })
                }
              >
                <option value="PUBLIC">Public</option>
                <option value="PRIVATE">Private</option>
              </select>
              <button type="submit" disabled={loading.create}>
                {loading.create ? "Creating..." : "Create Channel"}
              </button>
            </form>
          )}

          <div className="channels-list">
            {loading.channels && <p className="loading-text">Loading channels...</p>}
            {!loading.channels && channels.length === 0 && (
              <p className="empty-text">No channels yet</p>
            )}
            {channels.map((channel) => (
              <div
                key={channel.id}
                className={`channel-item ${
                  selectedChannel === channel.id ? "active" : ""
                }`}
                onClick={() => handleOpenChannel(channel.id)}
              >
                <div className="channel-item-header">
                  <span className="channel-name">{channel.channelName}</span>
                  <span className="channel-type">{channel.type}</span>
                </div>
                {channel.channelDescription && (
                  <p className="channel-desc">{channel.channelDescription}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Main: Channel Details & Messages */}
        <div className="channels-main">
          {!selectedChannel && (
            <div className="channels-empty-state">
              <p>👈 Select a channel to view messages</p>
            </div>
          )}

          {selectedChannel && channelDetails && (
            <>
              <div className="channel-header">
                <div className="channel-info">
                  <h3>{channelDetails.channelName}</h3>
                  <p>{channelDetails.channelDescription}</p>
                </div>
                <div className="channel-actions">
                  {channelDetails.viewer?.member ? (
                    <>
                      <span className="member-badge">
                        {channelDetails.viewer.role} · {channelDetails.viewer.status}
                      </span>
                      <button
                        className="btn-leave"
                        onClick={() => handleLeaveChannel(selectedChannel)}
                        disabled={loading.leave}
                      >
                        {loading.leave ? "Leaving..." : "Leave"}
                      </button>
                    </>
                  ) : (
                    <button
                      className="btn-join"
                      onClick={() => handleJoinChannel(selectedChannel)}
                      disabled={loading.join}
                    >
                      {loading.join ? "Joining..." : "Join Channel"}
                    </button>
                  )}
                </div>
              </div>

              {channelDetails.viewer?.member && (
                <>
                  <div className="messages-container">
                    {loading.details && <p className="loading-text">Loading messages...</p>}
                    {!loading.details && messages.length === 0 && (
                      <p className="empty-text">No messages yet. Start the conversation!</p>
                    )}
                    {messages.map((msg) => (
                      <div key={msg.id} className="message-item">
                        <div className="message-sender">
                          {msg.sender?.profileImageUrl && (
                            <img
                              src={msg.sender.profileImageUrl}
                              alt={msg.sender.name}
                              className="sender-avatar"
                            />
                          )}
                          <span className="sender-name">{msg.sender?.name || "Unknown"}</span>
                          <span className="message-time">
                            {new Date(msg.sentAt).toLocaleString()}
                          </span>
                        </div>
                        <div className="message-content">{msg.content}</div>
                      </div>
                    ))}
                    {nextCursor && (
                      <button
                        className="btn-load-more"
                        onClick={handleLoadMore}
                        disabled={loading.loadMore}
                      >
                        {loading.loadMore ? "Loading..." : "Load More"}
                      </button>
                    )}
                  </div>

                  <form className="message-form" onSubmit={handleSendMessage}>
                    <input
                      type="text"
                      placeholder="Type a message..."
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      disabled={loading.send}
                    />
                    <button type="submit" disabled={loading.send || !messageText.trim()}>
                      {loading.send ? "📤" : "Send"}
                    </button>
                  </form>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
