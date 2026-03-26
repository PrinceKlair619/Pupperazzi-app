import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./HomePage.css";

import dog1 from "./assets/dog1.jpeg";
import dog2 from "./assets/dog2.jpeg";
import dog3 from "./assets/dog3.jpeg";
import dog4 from "./assets/dog4.jpeg";

const API_BASE =
  window.location.host.includes("aptitude.cse.buffalo.edu")
    ? "/CSE442/2025-Fall/cse-442ac/api"
    : "http://localhost:8000";

export default function HomePage() {
  const navigate = useNavigate();

  const images = [dog1, dog2, dog3, dog4];
  const [currentIndex, setCurrentIndex] = useState(0);

  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);

  const currentUserId = Number(localStorage.getItem("user_id") || 0);

  const truncate = (t, max = 90) =>
    !t ? "" : t.length > max ? t.slice(0, max) + "…" : t;

  useEffect(() => {
    const interval = setInterval(
      () => setCurrentIndex((i) => (i + 1) % images.length),
      4000
    );
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        setLoadingEvents(true);

        const res = await fetch(
          `${API_BASE}/events_list.php?limit=3&user_id=${currentUserId}`
        );

        const data = await res.json();

        if (data.ok && Array.isArray(data.events)) {
          setEvents(data.events);
        } else {
          console.error("Bad events_list response:", data);
        }
      } catch (err) {
        console.error("Failed loading events:", err);
      } finally {
        setLoadingEvents(false);
      }
    })();
  }, [currentUserId]);

  return (
    <div className="homepage">
      <section className="hero-main">
        <div className="hero-text">
          <h1>
            Find Perfect <span>Play Dates</span> for Your Dog
          </h1>
          <p>
            Connect with local dog owners, arrange safe play dates, and let your
            furry friend make new buddies in your neighborhood.
          </p>
          <button className="cta-btn" onClick={() => navigate("/swiping")}>
            Start Matching
          </button>
        </div>

        <div className="homepage-hero-image-wrapper">
          {images.map((src, i) => (
            <img
              key={i}
              src={src}
              alt=""
              className={`homepage-hero-image ${
                i === currentIndex ? "active" : ""
              }`}
            />
          ))}
        </div>
      </section>

      <section className="upcoming-events">
        <h2 className="section-title">🐾 Upcoming Events</h2>

        {loadingEvents && <p>Loading events…</p>}

        {!loadingEvents && events.length === 0 && (
          <p>No upcoming events found.</p>
        )}

        <div className="event-card-row">
          {events.map((event) => {
            const imgSrc = event.cover_url || dog1;

            return (
              <div key={event.id} className="event-card">
                <img
                  src={imgSrc}
                  alt={event.title}
                  className="event-card-image"
                />

                <h3>{event.title}</h3>

                <p className="event-card-when">
                  {new Date(event.starts_at).toLocaleString(undefined, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </p>

                <p className="event-card-location">
                  {event.location || "Location TBA"}
                </p>

                {event.description && (
                  <p className="event-card-description">
                    {truncate(event.description)}
                  </p>
                )}

                <button
                  className="event-card-more"
                  onClick={() => navigate(`/events?id=${event.id}`)}
                >
                  More info
                </button>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
