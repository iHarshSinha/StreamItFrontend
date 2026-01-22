import { useState } from "react";
import { getMe, getPrivate, getPublic } from "../api/test.api";
import "./TestController.css";

function formatAxiosError(error) {
  const status = error?.response?.status;
  const data = error?.response?.data;
  const message = error?.message;

  if (status) {
    return {
      status,
      body: typeof data === "string" ? data : JSON.stringify(data, null, 2),
      message: message ?? "Request failed",
    };
  }

  return {
    status: null,
    body: message ?? "Unknown error",
    message: message ?? "Unknown error",
  };
}

export default function TestController() {
  const [publicRes, setPublicRes] = useState(null);
  const [privateRes, setPrivateRes] = useState(null);
  const [meRes, setMeRes] = useState(null);

  const [loading, setLoading] = useState({
    public: false,
    private: false,
    me: false,
  });

  const run = async (key, fn, setter) => {
    setLoading((p) => ({ ...p, [key]: true }));
    try {
      const res = await fn();
      setter({ ok: true, status: res.status, body: res.data });
    } catch (e) {
      const err = formatAxiosError(e);
      setter({ ok: false, status: err.status, body: err.body, message: err.message });
    } finally {
      setLoading((p) => ({ ...p, [key]: false }));
    }
  };

  return (
    <div className="test-page">
      <div className="test-header">
        <div>
          <h1 className="test-title">Test Controller</h1>
          <p className="test-subtitle">Calls: /public, /private, /me</p>
        </div>
      </div>

      <div className="test-grid">
        <section className="test-card">
          <div className="test-card-top">
            <h2 className="test-card-title">GET /public</h2>
            <button
              className="test-btn"
              onClick={() => run("public", getPublic, setPublicRes)}
              disabled={loading.public}
            >
              {loading.public ? "Loading…" : "Run"}
            </button>
          </div>
          <pre className="test-output">
            {publicRes
              ? JSON.stringify(publicRes, null, 2)
              : "Click Run to call /public"}
          </pre>
        </section>

        <section className="test-card">
          <div className="test-card-top">
            <h2 className="test-card-title">GET /private</h2>
            <button
              className="test-btn"
              onClick={() => run("private", getPrivate, setPrivateRes)}
              disabled={loading.private}
            >
              {loading.private ? "Loading…" : "Run"}
            </button>
          </div>
          <pre className="test-output">
            {privateRes
              ? JSON.stringify(privateRes, null, 2)
              : "Click Run to call /private (requires auth)"}
          </pre>
        </section>

        <section className="test-card">
          <div className="test-card-top">
            <h2 className="test-card-title">GET /me</h2>
            <button
              className="test-btn"
              onClick={() => run("me", getMe, setMeRes)}
              disabled={loading.me}
            >
              {loading.me ? "Loading…" : "Run"}
            </button>
          </div>

          <div className="me-wrap">
            <pre className="test-output">
              {meRes
                ? JSON.stringify(meRes, null, 2)
                : "Click Run to call /me (requires auth)"}
            </pre>

            {meRes?.ok && meRes?.body?.profileImageUrl ? (
              <img
                className="me-avatar"
                src={meRes.body.profileImageUrl}
                alt="Profile"
                referrerPolicy="no-referrer"
              />
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}
