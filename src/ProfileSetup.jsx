// src/ProfileSetup.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ProfileSetup.css";

const API =
  import.meta.env.VITE_API_BASE ??
  (import.meta.env.DEV
    ? "https://aptitude.cse.buffalo.edu/CSE442/2025-Fall/cse-442ac/api"
    : "/CSE442/2025-Fall/cse-442ac/api");

// Turn fetch/network/preflight issues into readable errors
async function apiFetch(url, opts = {}) {
  try {
    const res = await fetch(url, { ...opts, mode: "cors", credentials: "omit" });
    let data = null;
    try { data = await res.json(); } catch { /* non-JSON */ }
    if (!res.ok || (data && (data.ok === false || data.success === false))) {
      const msg = data?.error || data?.message || `Request failed (HTTP ${res.status})`;
      throw new Error(msg);
    }
    return data ?? { ok: true };
  } catch (err) {
    const m = err?.message || "Failed to fetch";
    if (m.includes("Failed to fetch")) {
      throw new Error(
        "Network/CORS error talking to API. Check VITE_API_BASE and CORS headers on PHP."
      );
    }
    throw err;
  }
}

export default function ProfileSetup() {
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [userId, setUserId] = useState(0);

  // match backend allow-list + size
  const allowedMimes = useMemo(
    () => new Set(["image/jpeg", "image/png", "image/webp"]),
    []
  );
  const MAX_BYTES = 5 * 1024 * 1024;

  useEffect(() => {
    const uid = Number(localStorage.getItem("userId") || 0);
    setUserId(uid);
    if (!uid) navigate("/login", { replace: true });
  }, [navigate]);

  // clean up object URL on unmount or when file changes
  useEffect(() => {
    return () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview);
    };
  }, [photoPreview]);

  const setFileWithValidation = (f) => {
    if (!f) return;
    if (!allowedMimes.has(f.type)) {
      setError("Only JPG, PNG, or WEBP images are allowed.");
      return;
    }
    if (f.size > MAX_BYTES) {
      setError("Image is too large (max 5MB).");
      return;
    }
    setError("");
    setPhotoFile(f);
    setPhotoPreview(URL.createObjectURL(f));
  };

  const onPickFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFileWithValidation(f);
  };

  const onDrop = (e) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (!f) return;
    setFileWithValidation(f);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!displayName.trim() || !bio.trim()) {
      setError("Display name and bio are required.");
      return;
    }
    if (!userId) {
      setError("Session expired. Please log in again.");
      return;
    }

    setBusy(true);
    try {
      // 1) Upload photo (optional). If it fails, continue without blocking.
      let photoUrl = "";
      if (photoFile) {
        try {
          const fd = new FormData();
          fd.append("photo", photoFile);
          const up = await fetch(`${API}/upload_photo.php`, {
            method: "POST",
            body: fd,
            mode: "cors",
            credentials: "omit",
          });
          let upData = {};
          try { upData = await up.json(); } catch { upData = {}; }
          if (!up.ok || upData?.ok === false) {
            throw new Error(upData?.error || `Upload failed (HTTP ${up.status})`);
          }
          photoUrl = upData.url || "";
        } catch (uploadErr) {
          console.warn("Photo upload failed, continuing without avatar:", uploadErr);
        }
      }

      // 2) Save profile basics to users table
      await apiFetch(`${API}/profile_update.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          displayName: displayName.trim(),
          bio: bio.trim(),
          // Only include photoUrl if we actually have one—backend tolerates empty.
          ...(photoUrl ? { photoUrl } : {}),
        }),
      });

      // 2b) Cache for navbar/fallbacks + notify listeners to refresh UI
      try {
        localStorage.setItem("displayName", displayName.trim());
        localStorage.setItem("bio", bio.trim());
        if (photoUrl) {
          localStorage.setItem("avatarUrl", photoUrl);
          localStorage.setItem("photoUrl", photoUrl); // some components read this key
          // enrich session user object if present
          const user = JSON.parse(sessionStorage.getItem("user") || "{}");
          sessionStorage.setItem("user", JSON.stringify({ ...user, avatar_url: photoUrl }));
          // notify any listeners (e.g., Navbar) to refresh
          window.dispatchEvent(new CustomEvent("profile:updated", { detail: { photoUrl } }));
        }
      } catch { /* storage may fail; ignore */ }

      // 3) Go straight to Dog Profile
      navigate("/createdog");
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  const submitDisabled = busy || !displayName.trim() || !bio.trim();

  return (
    <div className="Container">
      <div className="hero-wrapper">
        <div className="page hero-center">
          <h1 className="hero-title">Set up your Profile</h1>
          <p className="hero-subtitle">Add a photo and a short intro, then add your pup.</p>

          <div className="stepper" aria-label="Setup progress">
            <div className="step-inactive">1</div>
            <span className="step-label">Create Account</span>
            <hr className="divider" />
            <div className="step-active" aria-current="step">2</div>
            <span className="step-label">Profile Setup</span>
            <hr className="divider" />
            <div className="step-inactive">3</div>
            <span className="step-label">Dog Profile</span>
          </div>
        </div>
      </div>

      <div className="Card">
        <form className="form" onSubmit={onSubmit} noValidate>
          <h2>Profile Details</h2>
          {error && (
            <p role="alert" aria-live="assertive" style={{ color: "crimson" }}>
              {error}
            </p>
          )}

          {/* Avatar uploader — roomy */}
          <div
            className="uploader roomier"
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDrop}
          >
            <div className="avatar-wrap xl">
              <img
                className="avatar"
                src={photoPreview || "https://via.placeholder.com/160"}
                alt={photoPreview ? "Selected profile photo preview" : "Profile photo placeholder"}
              />
            </div>
            <div className="uploader-text">
              <p><strong>Profile Photo</strong></p>
              <p>Drag & drop or choose an image (JPG/PNG/WEBP, ≤ 5MB). Square works best.</p>
              <label className="Button ghost">
                Choose File
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={onPickFile}
                  hidden
                />
              </label>
            </div>
          </div>

          {/* Display name / Bio */}
          <div className="row">
            <div className="field grow">
              <label htmlFor="displayName">Display Name</label>
              <input
                id="displayName"
                className="Input"
                placeholder="e.g., Milo’s Human"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                disabled={busy}
                maxLength={80}
                autoComplete="nickname"
              />
            </div>
          </div>

          <div className="field column">
            <label htmlFor="bio">About You</label>
            <textarea
              id="bio"
              className="Input"
              rows={5}
              placeholder="Short intro: neighborhood, dog’s temperament, favorite parks…"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              required
              disabled={busy}
              maxLength={1000}
            />
            <small style={{ color: "#6b7280" }}>
              Keep it friendly and specific—what should other owners know?
            </small>
          </div>

          <div className="actions">
            <button className="Button wide" disabled={submitDisabled}>
              {busy ? "Saving..." : "Continue to Dog Profile"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
