import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import HostCard from "./HostCard";
import { fmtDT } from "./fmtDT";
import { normalizeHost } from "./normalizeHost";
import defaultEventImage from "../assets/pupper-icon.png";

const API_BASE =
  window.location.host.includes("aptitude.cse.buffalo.edu")
    ? "/CSE442/2025-Fall/cse-442ac/api"
    : "http://localhost:8000";

export default function DetailPane({
  ev,
  onRSVPChange,
  canEdit,
  onEdit,
  onDelete,
}) {
  const navigate = useNavigate();
  const [going, setGoing] = useState(false);

  // ------------------ WHEN EVENT CHANGES ------------------
  useEffect(() => {
    if (!ev) return;
    const RSVP_KEY = `rsvp:${ev.id}`;
    setGoing(localStorage.getItem(RSVP_KEY) === "yes");
  }, [ev]);

  // ------------------ EMPTY PANE ------------------
  if (!ev) {
    return (
      <div className="rsvp-page rsvp-empty-pane">
        <div className="rsvp-empty callout">
          Select an event to preview details
        </div>
      </div>
    );
  }

  // ------------------ EVENT DATA ------------------
  const RSVP_KEY = `rsvp:${ev.id}`;

  // use raw host for ID, normalized host for display
  const rawHost = ev.host || {};
  const host = normalizeHost(ev.host);

 // treat canEdit as “I own this event”
const isHost = !!canEdit;

// still need these for messaging
const meId = Number(localStorage.getItem("user_id") || 0);
const hostId = Number(ev.host?.id || ev.host?.user_id || 0);

  // ------------------ RSVP ------------------
  const rsvpYes = () => {
    localStorage.setItem(RSVP_KEY, "yes");
    setGoing(true);
    onRSVPChange?.(ev.id, true);
  };

  const rsvpNo = () => {
    localStorage.removeItem(RSVP_KEY);
    setGoing(false);
    onRSVPChange?.(ev.id, false);
  };

  // ------------------ CONTACT HOST (MESSAGES) ------------------
  const contactHost = async () => {
    if (!hostId) return;

    try {
      if (meId) {
        const res = await fetch(`${API_BASE}/messages_create_or_get.php`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: meId,
            with_user_id: hostId,
          }),
        });

        const data = await res.json();
        if (data.ok && data.conversation_id) {
          navigate(`/messages/${data.conversation_id}`);
          return;
        }
      }

      navigate("/messages");
    } catch (err) {
      console.error(err);
      navigate("/messages");
    }
  };

  // ------------------ RENDER ------------------
  return (
    <div className="rsvp-page rsvp-compact">
      {/* HERO */}
      <div className="rsvp-hero">
        <img
          className="rsvp-cover"
          src={ev.cover_url || defaultEventImage}
          alt={ev.title}
        />

        <div className="rsvp-hero-text">
          <h1 className="rsvp-title">{ev.title}</h1>
          <p className="rsvp-muted">
            {fmtDT(ev.starts_at)} • {ev.location || "TBA"}
          </p>

          {/* MAIN CTA ROW */}
          <div className="rsvp-btn-row">
            {isHost ? (
              <>
                <button
                  className="rsvp-btn rsvp-btn-ghost rsvp-btn-sm"
                  onClick={onEdit}
                >
                  Edit event
                </button>
                <button
                  className="rsvp-btn rsvp-btn-ghost-danger rsvp-btn-sm"
                  onClick={onDelete}
                >
                  Cancel / delete
                </button>
              </>
            ) : !going ? (
              <button
                className="rsvp-btn rsvp-btn-primary"
                onClick={rsvpYes}
              >
                RSVP
              </button>
            ) : (
              <>
                <span className="rsvp-pill rsvp-going">You're going</span>
                <button
                  className="rsvp-btn rsvp-btn-secondary"
                  onClick={rsvpNo}
                >
                  Cancel RSVP
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* BODY */}
      <div className="rsvp-body">
        {/* MAIN COLUMN: About + Location/Time card */}
        <section className="rsvp-main-column">
          <div className="rsvp-card rsvp-main rsvp-main-compact">
            <h2>About this event</h2>

            <p>{ev.description || "No description provided."}</p>

            {ev.details?.length > 0 && (
              <>
                <h3 className="rsvp-subhead">What to know</h3>
                <ul className="rsvp-bullets">
                  {ev.details.map((d, i) => (
                    <li key={i}>{d}</li>
                  ))}
                </ul>
              </>
            )}
          </div>

         {/* ONE card: Location + Time side-by-side INSIDE */}
<div className="rsvp-card rsvp-info-card">
  <div className="rsvp-info-row">
    <div className="rsvp-info-item">
      <h3>Location</h3>
      <p className="rsvp-muted">{ev.location || "TBA"}</p>
    </div>
    <div className="rsvp-info-item">
      <h3>Time</h3>
      <p className="rsvp-muted">{fmtDT(ev.starts_at)}</p>
    </div>
  </div>

          </div>
        </section>

        {/* SIDEBAR: Host only */}
        <aside className="rsvp-side">
          <HostCard
  host={ev.host}
  onContact={isHost ? undefined : contactHost}
/>
        </aside>
      </div>
    </div>
  );
}
