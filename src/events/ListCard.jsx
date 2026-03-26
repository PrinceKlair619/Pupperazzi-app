import defaultEventImage from "../assets/pupper-icon.png";
import { fmtDT } from "./fmtDT";

export default function ListCard({ ev, active, onSelect }) {
  return (
    <button
      className={`ev-list-card ${active ? "is-active" : ""}`}
      onClick={() => onSelect(ev)}
    >
      <div className="ev-list-thumb">
        <img src={ev.cover_url || defaultEventImage} alt="" />
      </div>

      <div className="ev-list-meta">
        <div className="ev-list-title">{ev.title}</div>
        <div className="ev-list-sub muted">
          {fmtDT(ev.starts_at)} • {ev.location || "TBA"}
        </div>

        <div
          className={`chip ${
            ev.category === "playdate" ? "pink" : "blue"
          }`}
        >
          {ev.category === "playdate" ? "Playdate" : "Activity"}
        </div>
      </div>
    </button>
  );
}
