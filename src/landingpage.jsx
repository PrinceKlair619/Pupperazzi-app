import React from "react";
import { Link, useNavigate } from "react-router-dom";
import "./landingpage.css";
import PupperIcon from "./assets/pupper-icon.png"; // <-- make sure this path exists

export default function Landingpage({ isLoggedIn = false }) {
  const navigate = useNavigate();

  return (
    <div className="landing-page">
      <section className="hero-section">
        <div className="hero-text">
          <h1>
            Meet Your Dog’s <br />
            Next Best Friend
          </h1>
          <p>From first sniff to fetch, find play pals your pup will love.</p>
          <button
            className="cta-button"
            type="button"
            onClick={() => navigate("/create-account")}
          >
            Get Started
          </button>
        </div>

        <div className="hero-image">
          <img src={PupperIcon} alt="Pupperazzi Icon" />
        </div>
      </section>

      <section className="features">
        <h2>Why Dogs Love Pupperazzi</h2>
        <p className="subheading">Everything your furry friend needs for the perfect play date</p>

        <div className="feature-cards">
          <div className="card pink">
            <h3>📍 Local Matches</h3>
            <p>Find dogs nearby based on size, energy level, and play style preferences.</p>
          </div>
          <div className="card blue">
            <h3>🔐 Safe & Verified</h3>
            <p>All owners are verified with vaccination records and safety protocols.</p>
          </div>
          <div className="card yellow">
            <h3>🗓️ Easy Scheduling</h3>
            <p>Schedule play dates with built-in calendar and location sharing.</p>
          </div>
        </div>
      </section>

    </div>
  );
}
