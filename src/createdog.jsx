// src/createdog.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./createdog.css"; // must include .create-dog + .energy-range styles

const API = "/CSE442/2025-Fall/cse-442ac/api";

/* fetch helper */
async function apiFetch(url, opts = {}) {
  try {
    const res = await fetch(url, { ...opts, mode: "cors", credentials: "omit" });
    let data = null;
    try {
      data = await res.json();
    } catch {}
    if (!res.ok || (data && (data.ok === false || data.success === false))) {
      const msg = data?.error || data?.message || `Request failed (HTTP ${res.status})`;
      throw new Error(msg);
    }
    return data ?? { ok: true };
  } catch (err) {
    const m = String(err?.message || err);
    if (m.includes("Failed to fetch") || m.includes("NetworkError")) {
      throw new Error("Network/CORS error talking to API. Check API base and PHP endpoint.");
    }
    throw err;
  }
}

const PERSONALITIES = [
  "Playful",
  "Calm",
  "Social",
  "Shy",
  "Protective",
  "Curious",
  "Gentle",
  "Goofy",
  "Independent",
  "Affectionate",
];

export default function Createdog() {
  const navigate = useNavigate();

  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [userId, setUserId] = useState(0);

  const [form, setForm] = useState({
    name: "",
    breed: "",
    ageYears: "", // label that goes into age_years column
    size: "",
    gender: "",
    energy: 50, // 1..100 (mapped to 1..5 for DB)
    personalities: [],
    notes: "",
  });

  const allowedMimes = useMemo(
    () => new Set(["image/jpeg", "image/png", "image/webp"]),
    []
  );
  const MAX_BYTES = 5 * 1024 * 1024;

  useEffect(() => {
    const uid = Number(
      localStorage.getItem("user_id") ||
        localStorage.getItem("userId") ||
        0
    );
    setUserId(uid);
    if (!uid) navigate("/login", { replace: true });
  }, [navigate]);

  useEffect(
    () => () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview);
    },
    [photoPreview]
  );

  const update = (k) => (e) =>
    setForm((f) => ({
      ...f,
      [k]: e.target.value,
    }));

  const updateEnergy = (e) =>
    setForm((f) => ({
      ...f,
      energy: Number(e.target.value),
    }));

  const togglePersonality = (p) =>
    setForm((f) => ({
      ...f,
      personalities: f.personalities.includes(p)
        ? f.personalities.filter((x) => x !== p)
        : [...f.personalities, p],
    }));

  const setFileWithValidation = (f) => {
    if (!f) return;
    if (!allowedMimes.has(f.type))
      return setError("Only JPG, PNG, or WEBP images are allowed.");
    if (f.size > MAX_BYTES)
      return setError("Image is too large (max 5MB).");
    setError("");
    if (photoPreview) {
      try {
        URL.revokeObjectURL(photoPreview);
      } catch {}
    }
    setPhotoFile(f);
    setPhotoPreview(URL.createObjectURL(f));
  };

  const onPickFile = (e) =>
    setFileWithValidation(e.target.files?.[0] || null);
  const onDrop = (e) => {
    e.preventDefault();
    setFileWithValidation(e.dataTransfer.files?.[0] || null);
  };

  const validate = () => {
    if (!form.name.trim()) return "Dog name is required.";
    if (!form.breed.trim()) return "Breed is required.";
    if (!form.ageYears) return "Age range is required.";
    if (!form.size) return "Size is required.";
    if (!form.gender) return "Gender is required.";
    return null;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const v = validate();
    if (v) return setError(v);
    if (!userId) return setError("Session expired. Please log in again.");

    setBusy(true);
    try {
      // 1) optional upload
      let photoUrl = "";
      if (photoFile) {
        const fd = new FormData();
        fd.append("photo", photoFile);
        const up = await apiFetch(`${API}/upload_photo.php`, {
          method: "POST",
          body: fd,
        });
        photoUrl =
          up?.url ||
          up?.photo_url ||
          up?.photoUrl ||
          up?.uploaded_path ||
          "";
      }

      // 2) create dog — send age_years label and energy bucketed as 1..5
      const rawEnergy = Number(form.energy) || 1; // 1..100 from slider
      const energyBucket = Math.min(
        5,
        Math.max(1, Math.ceil(rawEnergy / 20)) // 1–20 -> 1, 21–40 -> 2, ..., 81–100 -> 5
      );

      const payload = {
        userId,
        name: form.name.trim(),
        breed: form.breed.trim(),
        age_years: form.ageYears, // label goes to DB column
        size: form.size,
        gender: form.gender,
        energy: energyBucket, // 1..5 bucket from 1..100 slider
        personalities: form.personalities, // array
        notes: form.notes.trim(),
        photoUrl,
      };

      const result = await apiFetch(`${API}/dog_create.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (result?.dogId) {
        try {
          localStorage.setItem("dogId", String(result.dogId));
        } catch {}
      }
      navigate("/dogprofile", { replace: true });
    } catch (err) {
      setError(String(err?.message || err || "Something went wrong"));
    } finally {
      setBusy(false);
    }
  };

  const submitDisabled =
    busy ||
    !form.name.trim() ||
    !form.breed.trim() ||
    !form.ageYears ||
    !form.size ||
    !form.gender;

  return (
    <div className="create-dog">
      <div className="Container">
        <div className="hero-wrapper">
          <div className="page hero-center">
            <h1 className="hero-title">Create Your Dog Profile</h1>
            <p className="hero-subtitle">
              Add your pup’s basics so others know who they’ll meet.
            </p>
          </div>
        </div>

        <div className="Card">
          <form className="form" onSubmit={onSubmit} noValidate>
            <h2>Dog Details</h2>
            {error && (
              <p
                role="alert"
                aria-live="assertive"
                style={{ color: "crimson" }}
              >
                {error}
              </p>
            )}

            <div
              className="uploader roomier upload-row"
              onDragOver={(e) => e.preventDefault()}
              onDrop={onDrop}
            >
              <div className="avatar-wrap xl upload">
                <img
                  className="avatar"
                  src={
                    photoPreview ||
                    "https://via.placeholder.com/160?text=Dog"
                  }
                  alt={
                    photoPreview
                      ? "Selected dog photo preview"
                      : "Dog photo placeholder"
                  }
                />
                <span className="plus">+</span>
              </div>
              <div
                className="uploader-text"
                style={{ marginLeft: 16 }}
              >
                <p>
                  <strong>Dog Photo</strong>
                </p>
                <p>
                  Drag & drop or choose an image (JPG/PNG/WEBP, ≤ 5MB).
                  Square works best.
                </p>
                <label
                  className="Button ghost"
                  style={{ cursor: "pointer" }}
                >
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

            <div className="row">
              <div className="field grow input">
                <label
                  htmlFor="dogName"
                  className="field-label"
                >
                  Name
                </label>
                <input
                  id="dogName"
                  className="Input"
                  placeholder="e.g., Luna"
                  value={form.name}
                  onChange={update("name")}
                  required
                  disabled={busy}
                  maxLength={80}
                />
              </div>
              <div className="field grow input">
                <label htmlFor="breed" className="field-label">
                  Breed
                </label>
                <input
                  id="breed"
                  className="Input"
                  placeholder="e.g., Border Collie mix"
                  value={form.breed}
                  onChange={update("breed")}
                  required
                  disabled={busy}
                  maxLength={120}
                />
              </div>
            </div>

            <div className="row">
              {/* Age as label dropdown */}
              <div className="field select">
                <label
                  htmlFor="ageYears"
                  className="field-label"
                >
                  Age
                </label>
                <select
                  id="ageYears"
                  className="Input"
                  value={form.ageYears}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      ageYears: e.target.value,
                    }))
                  }
                  required
                  disabled={busy}
                >
                  <option value="">Select…</option>
                  <option value="Puppy (0–1)">Puppy (0–1)</option>
                  <option value="Young (1–3)">Young (1–3)</option>
                  <option value="Adult (3–7)">Adult (3–7)</option>
                  <option value="Senior (7+)">Senior (7+)</option>
                </select>
              </div>

              <div className="field select">
                <label htmlFor="size" className="field-label">
                  Size
                </label>
                <select
                  id="size"
                  className="Input"
                  value={form.size}
                  onChange={update("size")}
                  required
                  disabled={busy}
                >
                  <option value="">Select…</option>
                  <option value="Small">Small</option>
                  <option value="Medium">Medium</option>
                  <option value="Large">Large</option>
                </select>
              </div>

              <div className="field">
                <label className="field-label">Gender</label>
                <div
                  className="radio-group"
                  style={{
                    display: "flex",
                    gap: 12,
                    alignItems: "center",
                  }}
                >
                  <label>
                    <input
                      type="radio"
                      name="gender"
                      checked={form.gender === "Male"}
                      onChange={() =>
                        setForm((f) => ({
                          ...f,
                          gender: "Male",
                        }))
                      }
                      disabled={busy}
                    />{" "}
                    Male
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="gender"
                      checked={form.gender === "Female"}
                      onChange={() =>
                        setForm((f) => ({
                          ...f,
                          gender: "Female",
                        }))
                      }
                      disabled={busy}
                    />{" "}
                    Female
                  </label>
                </div>
              </div>
            </div>

            <div className="field column">
              <label className="field-label">Personalities</label>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(3, minmax(0, 1fr))",
                  gap: 8,
                }}
              >
                {PERSONALITIES.map((p) => {
                  const on = form.personalities.includes(p);
                  return (
                    <button
                      key={p}
                      type="button"
                      className={`Button ${
                        on ? "" : "ghost"
                      }`}
                      onClick={() => togglePersonality(p)}
                      aria-pressed={on}
                      disabled={busy}
                      style={{
                        padding: "6px 10px",
                        fontSize: 13,
                        lineHeight: 1.2,
                        borderRadius: 10,
                        width: "100%",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                      title={p}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>
              <small style={{ color: "#6b7280" }}>
                Pick a few that fit. You can update these anytime.
              </small>
            </div>
            
            
            
            <div className="field column">
              <label htmlFor="energy" className="field-label">
                Energy: {Math.min(5, Math.max(1, Math.ceil(form.energy / 20)))} / 5
              </label>
            
              <div className="range-wrap" style={{ marginTop: 8 }}>
                <input
                  id="energy"
                  type="range"
                  min="1"
                  max="100"
                  step="1"
                  value={form.energy}
                  onChange={updateEnergy}
                  disabled={busy}
                  className="energy-range"
                  data-value={form.energy}
                  aria-valuemin={1}
                  aria-valuemax={100}
                  aria-valuenow={form.energy}
                />
              </div>
              
              <div style={{ display: "flex", justifyContent: "space-between", color: "#6b7280", fontSize: 12 }}>
                <span>Chill</span><span>Zoomies</span>
              </div>
            </div>


            <div className="field column input">
              <label
                htmlFor="notes"
                className="field-label"
              >
                Notes
              </label>
              <textarea
                id="notes"
                className="Input"
                rows={4}
                placeholder="Favorite toys, training cues, quirks…"
                value={form.notes}
                onChange={update("notes")}
                disabled={busy}
                maxLength={600}
              />
            </div>

            <div className="actions">
              <button
                className="Button wide"
                disabled={submitDisabled}
              >
                {busy ? "Saving..." : "Save Dog Profile"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
