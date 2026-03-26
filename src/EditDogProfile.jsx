// src/EditDogProfile.jsx
import React, { useEffect, useMemo, useState } from "react";
import "./editdogprofile.css";

export default function EditDogProfile({ dogProfile = {}, setDogProfile, setIsEditing }) {
  const defaults = useMemo(
    () => ({
      name: "",
      age: "Adult:3-7",
      size: "Medium",
      energy: "Medium",
      about: "",
      personality: [],
      preferences: [],
      photos: [],
    }),
    []
  );

  const initial = { ...defaults, ...dogProfile };
  if (!Array.isArray(initial.personality)) initial.personality = [];
  if (!Array.isArray(initial.preferences)) initial.preferences = [];
  if (!Array.isArray(initial.photos)) initial.photos = [];

  const storageKey = `dogProfile_${initial.name || "default"}`;

  const [formData, setFormData] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const [personalityInput, setPersonalityInput] = useState("");
  const [preferencesInput, setPreferencesInput] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        const next = { ...defaults, ...parsed };
        next.personality = Array.isArray(next.personality) ? next.personality : [];
        next.preferences = Array.isArray(next.preferences) ? next.preferences : [];
        next.photos = Array.isArray(next.photos) ? next.photos : [];
        setFormData(next);
      }
    } catch {}
  }, []);

  const persist = (updated) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch {}
  };

  const handleChange = (field, value) => {
    setFormData((prev) => {
      const updated = {
        ...prev,
        [field]: field === "about" ? String(value).slice(0, 300) : value,
      };
      persist(updated);
      return updated;
    });
  };

  const addChip = (field, value) => {
    const val = String(value).trim();
    if (!val) return;

    setFormData((prev) => {
      const current = Array.isArray(prev[field]) ? prev[field] : [];
      const exists = new Set(current.map((x) => x.toLowerCase()));

      if (current.length >= 10 || exists.has(val.toLowerCase())) return prev;

      const updated = { ...prev, [field]: [...current, val] };
      persist(updated);
      return updated;
    });
  };

  const removeChip = (field, idx) => {
    setFormData((prev) => {
      const list = Array.isArray(prev[field]) ? prev[field] : [];
      const updated = { ...prev, [field]: list.filter((_, i) => i !== idx) };
      persist(updated);
      return updated;
    });
  };

  const onListKeyDown = (field, buffer, setBuffer) => (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addChip(field, buffer);
      setBuffer("");
    }

    if (e.key === "Backspace" && !buffer) {
      setFormData((prev) => {
        const list = Array.isArray(prev[field]) ? prev[field] : [];
        if (!list.length) return prev;
        const last = list[list.length - 1];
        setBuffer(last);
        const updated = { ...prev, [field]: list.slice(0, -1) };
        persist(updated);
        return updated;
      });
    }
  };

  const onListBlur = (field, buffer, setBuffer) => () => {
    if (buffer.trim()) addChip(field, buffer);
    setBuffer("");
  };

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setBusy(true);
    setError("");

    for (const file of files) {
      const form = new FormData();
      form.append("file", file);
      form.append("upload_preset", "Pupperazzi");

      try {
        const res = await fetch("https://api.cloudinary.com/v1_1/ddntn2eix/image/upload", {
          method: "POST",
          body: form,
        });

        const data = await res.json();
        if (!res.ok || !data?.secure_url) throw new Error("Upload failed");

        setFormData((prev) => {
          const updated = { ...prev, photos: [...prev.photos, data.secure_url] };
          persist(updated);
          return updated;
        });
      } catch (err) {
        setError(err?.message || "Upload failed");
      }
    }

    setBusy(false);
    e.target.value = "";
  };

  const handleDeletePhoto = (index) => {
    setFormData((prev) => {
      const updated = {
        ...prev,
        photos: prev.photos.filter((_, i) => i !== index),
      };
      persist(updated);
      return updated;
    });
  };

  const handleSave = () => {
    const clamp10 = (arr) =>
      Array.from(
        new Map(
          (Array.isArray(arr) ? arr : [])
            .map((x) => String(x).trim())
            .filter(Boolean)
            .slice(0, 10)
            .map((x) => [x.toLowerCase(), x])
        ).values()
      );

    const updated = {
      ...formData,
      about: String(formData.about || "").slice(0, 300),
      personality: clamp10(formData.personality),
      preferences: clamp10(formData.preferences),
    };

    persist(updated);
    setDogProfile?.(updated);
    setIsEditing?.(false);
  };

  return (
    <div className="edit-container">
      <h2 className="edit-title">
        Edit {formData.name ? `${formData.name}'s` : "Dog"} Profile
      </h2>

      {error && <p style={{ color: "crimson" }}>⚠️ {error}</p>}

      <div className="edit-form">
        <label>Name</label>
        <input
          className="edit-input"
          value={formData.name}
          onChange={(e) => handleChange("name", e.target.value)}
          placeholder="e.g., Milo"
          maxLength={80}
        />

        <label>Age</label>
        <select
          className="edit-input"
          value={formData.age}
          onChange={(e) => handleChange("age", e.target.value)}
        >
          <option value="Puppy:0-1">Puppy: 0–1</option>
          <option value="Young Adult:2-3">Young Adult: 2–3</option>
          <option value="Adult:3-7">Adult: 3–7</option>
          <option value="Senior:8+">Senior: 8+</option>
        </select>

        <label>Size</label>
        <select
          className="edit-input"
          value={formData.size}
          onChange={(e) => handleChange("size", e.target.value)}
        >
          <option value="Small">Small</option>
          <option value="Medium">Medium</option>
          <option value="Large">Large</option>
        </select>

        <label>Energy</label>
        <select
          className="edit-input"
          value={formData.energy}
          onChange={(e) => handleChange("energy", e.target.value)}
        >
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
        </select>

        <label>
          About{" "}
          <span style={{ color: "#6b7280", fontSize: 12 }}>
            ({(formData.about || "").length}/300)
          </span>
        </label>
        <textarea
          className="edit-textarea"
          value={formData.about}
          maxLength={300}
          onChange={(e) => handleChange("about", e.target.value)}
          placeholder="Short bio, temperament, favorite parks…"
        />

        {/* Personality */}
        <label>
          Personality (comma or Enter to add){" "}
          <span style={{ color: "#6b7280", fontSize: 12 }}>
            {(formData.personality || []).length}/10
          </span>
        </label>

        <div className="chip-wrap">
          {(formData.personality || []).map((p, i) => (
            <span className="chip" key={`${p}-${i}`}>
              {p}
              <button
                type="button"
                className="chip-x"
                onClick={() => removeChip("personality", i)}
              >
                ×
              </button>
            </span>
          ))}

          <input
            className="edit-input chip-input"
            value={personalityInput}
            onChange={(e) => setPersonalityInput(e.target.value)}
            onKeyDown={onListKeyDown("personality", personalityInput, setPersonalityInput)}
            onBlur={onListBlur("personality", personalityInput, setPersonalityInput)}
            placeholder={
              (formData.personality?.length ?? 0) >= 10
                ? "Max 10 reached"
                : "e.g., Playful"
            }
            disabled={(formData.personality?.length ?? 0) >= 10}
          />
        </div>

        {/* Preferences */}
        <label>
          Preferences (comma or Enter to add){" "}
          <span style={{ color: "#6b7280", fontSize: 12 }}>
            {(formData.preferences || []).length}/10
          </span>
        </label>

        <div className="chip-wrap">
          {(formData.preferences || []).map((p, i) => (
            <span className="chip" key={`${p}-${i}`}>
              {p}
              <button
                type="button"
                className="chip-x"
                onClick={() => removeChip("preferences", i)}
              >
                ×
              </button>
            </span>
          ))}

          <input
            className="edit-input chip-input"
            value={preferencesInput}
            onChange={(e) => setPreferencesInput(e.target.value)}
            onKeyDown={onListKeyDown("preferences", preferencesInput, setPreferencesInput)}
            onBlur={onListBlur("preferences", preferencesInput, setPreferencesInput)}
            placeholder={
              (formData.preferences?.length ?? 0) >= 10
                ? "Max 10 reached"
                : "e.g., Outdoor play"
            }
            disabled={(formData.preferences?.length ?? 0) >= 10}
          />
        </div>

        <label>Photos</label>
        <div className="photo-edit-gallery">
          {(formData.photos || []).map((src, idx) => (
            <div key={idx} className="photo-item">
              <img src={src} alt={`photo ${idx}`} />
              <button
                type="button"
                className="delete-btn"
                onClick={() => handleDeletePhoto(idx)}
                disabled={busy}
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        <input type="file" accept="image/*" multiple onChange={handlePhotoUpload} disabled={busy} />

        <div className="edit-actions">
          <button className="btn-secondary" onClick={handleSave} disabled={busy}>
            {busy ? "Uploading..." : "Save"}
          </button>

          <button className="btn-secondary" onClick={() => setIsEditing(false)} disabled={busy}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
