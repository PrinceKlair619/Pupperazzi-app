// src/HalloweenRSVP.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./HalloweenRSVP.css";

const API = window.location.host.includes("aptitude.cse.buffalo.edu")
  ? "https://aptitude.cse.buffalo.edu/CSE442/2025-Fall/cse-442ac/api"
  : "http://localhost:8000";

/* Format a host object so we always have name/avatar */
function normalizeHost(h = {}) {
  const rawName =
    h.display_name ||
    h.name ||
    h.username ||
    (h.email ? h.email.split("@")[0] : "") ||
    "Host";

  return {
    id: h.id ?? 0,
    name: String(rawName).trim() || "Host",
    avatar_url: h.avatar_url || h.avatar || null,
    bio: h.bio || "Reach out to coordinate or ask questions.",
  };
}

function HostCard({ host = {}, onContact }) {
  const safeHost = normalizeHost(host);
  const initial = safeHost.name.charAt(0).toUpperCase() || "H";

  return (
    <div className="rsvp-card rsvp-host-card">
      <div className="rsvp-host-header">
        {safeHost.avatar_url ? (
          <img
            className="rsvp-host-avatar"
            src={safeHost.avatar_url}
            alt={safeHost.name}
          />
        ) : (
          <div className="rsvp-host-avatar rsvp-host-initial">{initial}</div>
        )}
        <div className="rsvp-host-meta">
          <span className="rsvp-label">Host</span>
          <h3 className="rsvp-host-name">{safeHost.name}</h3>
        </div>
      </div>

      <p className="rsvp-muted rsvp-host-bio">{safeHost.bio}</p>

      <button
        type="button"
        className="rsvp-btn rsvp-btn-primary rsvp-btn-sm rsvp-host-contact"
        onClick={onContact}
      >
        Contact Host
      </button>
    </div>
  );
}

export default function HalloweenRSVP() {
  const navigate = useNavigate();

  // fallback event
  const fallback = {
    id: 0,
    title: "Halloween Costume Pawty",
    dateText: "Sun, Oct 20 • 2:00 PM",
    location: "Elmwood Dog Park",
    cover:
      "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?q=80&w=1600&auto=format&fit=crop",
    description:
      "Dress your pup in their spookiest costume! Prizes for funniest, cutest, and most creative.",
    details: [
      "Bring water bowl (we’ll have refills).",
      "Keep dogs leashed on entry; off-leash inside fenced area.",
      "Be kind and step out if your pup gets overwhelmed.",
    ],
    host: { id: 0, name: "Host", avatar_url: null, bio: "" },
  };

  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState(fallback);

  useEffect(() => {
    let ignore = false;

    (async () => {
      try {
        const url = `${API}/get_event.php?slug=halloween-2025`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (!json.ok) throw new Error(json.error);

        const e = json.event;

        const dt = new Date(String(e.starts_at).replace(" ", "T"));
        const dateText =
          dt.toLocaleDateString(undefined, {
            weekday: "short",
            month: "short",
            day: "numeric",
          }) +
          " • " +
          dt.toLocaleTimeString(undefined, {
            hour: "numeric",
            minute: "2-digit",
          });

        if (!ignore) {
          setEvent({
            id: e.id,
            title: e.title,
            dateText,
            location: e.location,
            cover: e.cover_url,
            description: e.description,
            details: Array.isArray(e.details) ? e.details : [],
            host: normalizeHost(e.host),
          });
        }
      } catch {
        if (!ignore) setEvent(fallback);
      } finally {
        if (!ignore) setLoading(false);
      }
    })();

    return () => (ignore = true);
  }, []);

  const RSVP_KEY = `rsvp:${event.id || "halloween-2025"}`;
  const [going, setGoing] = useState(
    () => localStorage.getItem(RSVP_KEY) === "yes"
  );

  const handleRSVP = () => {
    setGoing(true);
    localStorage.setItem(RSVP_KEY, "yes");
  };
  const handleCancel = () => {
    setGoing(false);
    localStorage.removeItem(RSVP_KEY);
  };

  /* ⭐ CONTACT HOST → Messages.jsx  */
  const contactHost = () => {
    const host = normalizeHost(event.host);
    if (!host.id) return;

    navigate(`/messages?to=${host.id}`);
  };

  /* Comments */
  const COMMENTS_KEY = `comments:${event.id || "halloween-2025"}`;
  const [comments, setComments] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(COMMENTS_KEY) || "[]");
    } catch {
      return [];
    }
  });

  const [draft, setDraft] = useState("");
  const currentUser = useMemo(() => {
    const name =
      localStorage.getItem("username") ||
      localStorage.getItem("email") ||
      "Anonymous";
    return { name };
  }, []);

  const addComment = (e) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;

    const next = [
      ...comments,
      { by: currentUser.name, text, at: new Date().toISOString() },
    ];
    setComments(next);
    localStorage.setItem(COMMENTS_KEY, JSON.stringify(next));
    setDraft("");
  };

  if (loading) {
    return (
      <div className="rsvp-page">
        <div className="rsvp-hero">
          <div className="rsvp-hero-skeleton" />
        </div>
      </div>
    );
  }

  return (
    <div className="rsvp-page">
      <div className="rsvp-hero">
        <img className="rsvp-cover" src={event.cover} alt={event.title} />
        <div className="rsvp-hero-text">
          <h1 className="rsvp-title">{event.title}</h1>
          <p className="rsvp-muted">
            {event.dateText} • {event.location}
          </p>

          <div className="rsvp-btn-row">
            {!going ? (
              <>
                <button
                  className="rsvp-btn rsvp-btn-secondary"
                  onClick={handleCancel}
                >
                  Cancel
                </button>
                <button
                  className="rsvp-btn rsvp-btn-primary"
                  onClick={handleRSVP}
                >
                  RSVP
                </button>
              </>
            ) : (
              <>
                <span className="rsvp-pill rsvp-going">You’re going</span>
                <button
                  className="rsvp-btn rsvp-btn-secondary"
                  onClick={handleCancel}
                >
                  Cancel RSVP
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="rsvp-body">
        <section className="rsvp-card rsvp-main">
          <h2>About this event</h2>
          <p>{event.description}</p>

          <h3 className="rsvp-subhead">What to know</h3>
          <ul className="rsvp-bullets">
            {event.details.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>

          <div className="rsvp-divider" />

          <h3 className="rsvp-subhead">Comments</h3>

          <form className="rsvp-comment-form" onSubmit={addComment}>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Ask a question or share a note with the host…"
              rows={3}
            />
            <div className="rsvp-comment-actions">
              <button
                type="submit"
                className="rsvp-btn rsvp-btn-primary rsvp-btn-sm"
              >
                Post
              </button>
            </div>
          </form>

          {comments.length === 0 ? (
            <div className="rsvp-empty callout">
              No comments yet. Be the first to ask!
            </div>
          ) : (
            <ul className="rsvp-comment-list">
              {comments.map((c, i) => (
                <li key={i} className="rsvp-comment">
                  <div className="rsvp-comment-by">{c.by}</div>
                  <div className="rsvp-comment-text">{c.text}</div>
                  <div className="rsvp-comment-time">
                    {new Date(c.at).toLocaleString()}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <aside className="rsvp-side">
          <HostCard host={event.host} onContact={contactHost} />

          <div className="rsvp-card rsvp-info-card">
            <h3>Location</h3>
            <p className="rsvp-muted">{event.location}</p>

            <h3 style={{ marginTop: 16 }}>Time</h3>
            <p className="rsvp-muted">{event.dateText}</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
