import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./HumanProfilePage.css";

import defaultAvatar from "./assets/profile.png";
import forestBanner from "./assets/banner.jpeg";
import editIcon from "./assets/change-profile.png";
import noDogsImg from "./assets/no-dogs.png";

const API = import.meta.env.DEV
  ? "http://localhost:8000"
  : "/CSE442/2025-Fall/cse-442ac/api";

const UPLOADS = import.meta.env.DEV
  ? "http://localhost:8000/uploads"
  : "/CSE442/2025-Fall/cse-442ac/api/uploads";

// Safe image loader
async function safeImg(src, fallback) {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = src;
    img.onload = () => resolve(src);
    img.onerror = () => resolve(fallback);
  });
}

export default function HumanProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const myId = Number(localStorage.getItem("userId"));
  const viewingId = id ? Number(id) : myId;
  const isOwner = viewingId === myId;

  // STATE
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingDogs, setLoadingDogs] = useState(true);

  const [avatar, setAvatar] = useState(defaultAvatar);
  const [banner, setBanner] = useState(forestBanner);

  const [name, setName] = useState("Loading…");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("Unknown");
  const [dogs, setDogs] = useState([]);

  const [editingProfile, setEditingProfile] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [draftBio, setDraftBio] = useState("");
  const [draftLocation, setDraftLocation] = useState("");

  // FETCH PROFILE
  useEffect(() => {
    if (!viewingId) return;

    (async () => {
      const res = await fetch(`${API}/profile_get.php?user_id=${viewingId}`);
      const d = await res.json();

      if (d.ok) {
        setName(d.user.display_name || "No name");
        setBio(d.user.bio || "");
        setLocation(d.user.location || "Unknown");

        if (d.user.avatar_url) {
          const file = d.user.avatar_url.split("/").pop();
          setAvatar(await safeImg(`${UPLOADS}/${file}`, defaultAvatar));
        }

        if (d.user.background_path) {
          const file = d.user.background_path.split("/").pop();
          setBanner(await safeImg(`${UPLOADS}/${file}`, forestBanner));
        }
      }

      setLoadingProfile(false);
    })();
  }, [viewingId]);

  // FETCH DOGS
  useEffect(() => {
    if (!viewingId) return;

    (async () => {
      try {
        const res = await fetch(`${API}/get_dogs.php?user_id=${viewingId}`);
        const data = await res.json();
        setDogs(data.ok ? data.dogs : []);
      } catch {
        setDogs([]);
      }

      setLoadingDogs(false);
    })();
  }, [viewingId]);

  // EDIT PROFILE LOGIC
  const startEditing = () => {
    setDraftName(name);
    setDraftBio(bio);
    setDraftLocation(location);
    setEditingProfile(true);
  };

  const saveProfile = async () => {
    const body = {
      userId: myId,
      displayName: draftName.trim(),
      bio: draftBio.trim(),
      location: draftLocation.trim(),
    };

    await fetch(`${API}/profile_update.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setName(body.displayName);
    setBio(body.bio);
    setLocation(body.location);
    setEditingProfile(false);
  };

  // ⭐ OPEN CHAT — FIXED!
  function openChat() {
    navigate(`/messages?user=${viewingId}`);
  }

  return (
    <div className="profile-wrapper">
      {/* Banner */}
      <div className="banner" style={{ backgroundImage: `url(${banner})` }}>
        {isOwner && (
          <label className="banner-btn">
            Change background
            <input type="file" hidden />
          </label>
        )}

        <div className="avatar-wrapper">
          <img src={avatar} className="avatar-img" />
          {isOwner && (
            <label className="avatar-edit-btn">
              <img src={editIcon} className="avatar-edit-icon" />
              <input type="file" hidden />
            </label>
          )}
        </div>
      </div>

      {/* LEFT */}
      <div className="left-column">
        {!editingProfile ? (
          <>
            <div className="profile-header-row">
              <div>
                <h1 className="profile-name">{name}</h1>
                <p className="profile-location">{location}</p>
              </div>

              {isOwner ? (
                <button className="profile-edit-btn" onClick={startEditing}>
                  ✎ Edit Profile
                </button>
              ) : (
                <button className="profile-edit-btn" onClick={openChat}>
                  💬 Message
                </button>
              )}
            </div>

            <div className="box">
              <h2>{isOwner ? "About You" : "About Them"}</h2>
              <p>{bio.trim() ? bio : "Nothing written yet."}</p>
            </div>
          </>
        ) : (
          <>
            <h1 className="profile-name">Edit Your Profile</h1>

            <div className="edit-box">
              <label>
                Name
                <input
                  className="Input"
                  value={draftName}
                  onChange={(e) => setDraftName(e.target.value)}
                />
              </label>

              <label>
                Location
                <input
                  className="Input"
                  value={draftLocation}
                  onChange={(e) => setDraftLocation(e.target.value)}
                />
              </label>

              <label>
                Bio
                <textarea
                  className="Input"
                  rows={4}
                  value={draftBio}
                  onChange={(e) => setDraftBio(e.target.value)}
                />
              </label>

              <div className="edit-btn-row">
                <button className="save-btn" onClick={saveProfile}>
                  Save
                </button>
                <button
                  className="cancel-btn"
                  onClick={() => setEditingProfile(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </>
        )}

        {/* DOGS */}
        <div className="box">
          <h2>{isOwner ? "Your Dogs" : "Their Dogs"} ({dogs.length})</h2>

          {isOwner && <a href="#/createdog">+ Add a Dog</a>}

          {loadingDogs ? (
            <div className="dogs-grid">
              {Array.from({ length: 6 }).map((_, i) => (
                <div className="dog-skeleton" key={i}></div>
              ))}
            </div>
          ) : dogs.length === 0 ? (
            <div className="no-dogs">
              <img src={noDogsImg} />
              <p>{isOwner ? "You haven’t added any dogs yet!" : "No dogs added yet."}</p>
            </div>
          ) : (
            <div className="dogs-grid">
              {dogs.map((dog) => {
                const img = dog.photo_url
                  ? `${UPLOADS}/${dog.photo_url.split("/").pop()}`
                  : defaultAvatar;

                return (
                  <div className="dog-card" key={dog.id}>
                    <img src={img} />
                    <p>{dog.name}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT SIDEBAR */}
      <div className="right-sidebar">
        <div className="side-card">
          <h3>Activity</h3>
          <p><b>Profile Views:</b> 124</p>
          <p><b>Dog Playdate Invitations:</b> 9</p>
          <p><b>Impressions:</b> 2,487</p>
        </div>

        <div className="side-card">
          <h3>Recent Playdates</h3>
          <ul>
            <li>Bark in the Park — 2 days ago</li>
            <li>Halloween Pup Party 🎃 — 1 week ago</li>
            <li>UB Dog Mixer — 3 weeks ago</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
