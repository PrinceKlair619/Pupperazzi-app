import { normalizeHost } from "./normalizeHost";

export default function HostCard({ host, onContact }) {
  const safe = normalizeHost(host);
  const initial = (safe.name?.charAt(0) || "H").toUpperCase();

  // detect if we should show the contact button
  const canContact = typeof onContact === "function";

  return (
    <div className="rsvp-card rsvp-host-card">
      
      {/* HEADER */}
      <div className="rsvp-host-header">
        {safe.avatar_url ? (
          <img
            className="rsvp-host-avatar"
            src={safe.avatar_url}
            alt={safe.name}
            draggable={false}
          />
        ) : (
          <div className="rsvp-host-avatar rsvp-host-initial">
            {initial}
          </div>
        )}

        <div className="rsvp-host-meta">
          <span className="rsvp-label">Host</span>
          <h3 className="rsvp-host-name">{safe.name}</h3>
        </div>
      </div>

      {/* HOST BIO */}
      {safe.bio ? (
        <p className="rsvp-host-bio">{safe.bio}</p>
      ) : (
        <p className="rsvp-host-bio muted">
          Reach out to coordinate or ask questions.
        </p>
      )}

      {/* CONTACT BUTTON — ONLY IF NOT HOST */}
      {canContact && (
        <button
          className="rsvp-btn rsvp-btn-primary rsvp-btn-sm rsvp-host-contact"
          onClick={onContact}
        >
          Contact Host
        </button>
      )}
    </div>
  );
}
