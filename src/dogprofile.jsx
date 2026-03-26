// DogProfilePage.jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "./dogprofile.css";

import defaultAvatar from "./assets/profile.png";
import forestBanner from "./assets/banner.jpeg";
import EditDogProfile from "./EditDogProfile";

const API = import.meta.env.DEV
  ? "http://localhost:8000"
  : "/CSE442/2025-Fall/cse-442ac/api";

const UPLOADS = import.meta.env.DEV
  ? "http://localhost:8000/uploads"
  : "/CSE442/2025-Fall/cse-442ac/api/uploads";

function safePhoto(rawUrl) {
  if (!rawUrl) return defaultAvatar;
  const clean = rawUrl.split("/").pop();
  return `${UPLOADS}/${clean}`;
}

export default function DogProfilePage() {
  const { dogId } = useParams();

  const [dog, setDog] = useState(null);
  const [photoSrc, setPhotoSrc] = useState(defaultAvatar);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    async function loadDog() {
      try {
        const r = await fetch(`${API}/get_dog.php?id=${dogId}`);
        const d = await r.json();

        if (d.ok) {
          const raw = d.dog;
          const photoUrl = raw.photo_url ? safePhoto(raw.photo_url) : defaultAvatar;

          setPhotoSrc(photoUrl);

          setDog({
            name: raw.name || "Dog",
            breed: raw.breed || "Unknown",
            location: raw.location || "Buffalo",
            age: raw.age_years || "—",
            size: raw.size || "—",
            energy: raw.energy_level || "—",
            gender: raw.gender || "—",
            about: raw.bio || "No bio yet.",
            personality: Array.isArray(raw.personalities) ? raw.personalities : [],
            photo: photoUrl,
          });
        }
      } catch (err) {
        console.error("Dog fetch failed:", err);
      }
    }

    loadDog();
  }, [dogId]);

  if (!dog) return <p style={{ padding: 20 }}>Loading...</p>;

  // ⭐ If editing → show edit UI instead of profile
  if (isEditing) {
    return (
      <div className="profile-wrapper" style={{ paddingTop: "20px" }}>
        <EditDogProfile
          dogProfile={dog}
          setDogProfile={(updated) => setDog(updated)}
          setIsEditing={setIsEditing}
        />
      </div>
    );
  }

  return (
    <div className="profile-wrapper">

      {/* BANNER */}
      <div
        className="banner"
        style={{ backgroundImage: `url(${forestBanner})` }}
      >
        <div className="avatar-wrapper">
          <img
            src={photoSrc}
            onError={() => setPhotoSrc(defaultAvatar)}
            className="avatar-img"
            alt={dog.name}
          />
        </div>
      </div>

      {/* CONTENT WRAPPER */}
      <div className="profile-content">

        {/* LEFT COLUMN */}
        <div className="left-column">
          <div className="profile-header-row">
            <div>
              <h1 className="profile-name">{dog.name}</h1>
              <p className="profile-location">{dog.breed}</p>
              <p className="profile-location">📍 {dog.location}</p>

              <div className="meta-chips">
                <div className="chip">Age: {dog.age}</div>
                <div className="chip">Size: {dog.size}</div>
                <div className="chip">Energy: {dog.energy}</div>
                <div className="chip">Gender: {dog.gender}</div>
              </div>
            </div>

            <button className="profile-edit-btn" onClick={() => setIsEditing(true)}>
              Edit Profile
            </button>
          </div>

          {/* ABOUT */}
          <div className="box">
            <h2>About</h2>
            <p>{dog.about}</p>
          </div>
        </div>

        {/* RIGHT SIDEBAR */}
        <div className="right-sidebar">

          <div className="side-card">
            <h3>Personality</h3>
            {dog.personality.length ? (
              <ul>
                {dog.personality.map((p, i) => (
                  <li key={i}>{p}</li>
                ))}
              </ul>
            ) : (
              <p>No personality traits yet.</p>
            )}
          </div>

          <div className="side-card">
            <h3>Photos</h3>
            <img
              src={photoSrc}
              onError={() => setPhotoSrc(defaultAvatar)}
              alt="Dog"
            />
          </div>

        </div>
      </div>
    </div>
  );
}
