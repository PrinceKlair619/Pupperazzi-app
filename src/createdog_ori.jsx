import { useState } from "react";
import "./createdog.css";
import dogIcon from "./assets/logo.png";

export default function CreateDog() {
  const [activeStep] = useState(2);

  // Single source of truth for the whole form
  const [form, setForm] = useState({
    name: "",
    breed: "",
    age: "",
    gender: "",
    personalities: [],
    activity: "",
    energy: 3,       // moved energy here
  });

  // Optional: hold the "saved" profile after submit (simulates DB save)
  const [savedProfile, setSavedProfile] = useState(null);

  const update = (key) => (e) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const updateEnergy = (e) =>
    setForm((f) => ({ ...f, energy: Number(e.target.value) }));

  const togglePersonality = (p) =>
    setForm((f) => ({
      ...f,
      personalities: f.personalities.includes(p)
        ? f.personalities.filter((x) => x !== p)
        : [...f.personalities, p],
    }));

  const onSubmit = (e) => {
    e.preventDefault();
    // Here is where you'd POST to your backend
    // fetch("/api/dogs", { method:"POST", body: JSON.stringify(form) })
    setSavedProfile(form); // demo: show a preview below
  };

  const P = (p) => (
    <label className="pill">
      <input
        type="checkbox"
        checked={form.personalities.includes(p)}
        onChange={() => togglePersonality(p)}
      />
      {p}
    </label>
  );

  return (
    <div className="create-dog">
      <div className="container">
        {/* Top hero: big logo on the left + centered header */}
        <div className="hero">
          <div className="hero-brand">Pupperazzi</div>
          <img src={dogIcon} alt="Pupperazzi Logo" className="hero-logo-left" />

          <div className="header">
            <h1>Join the Pack!</h1>
            <p>Create your account and find the perfect playmate for your furry friend</p>

            <div className="stepper">
              <div className={`step ${activeStep === 1 ? "active" : ""}`}>
                <div className="circle">1</div>
                <span>Your Profile</span>
              </div>
              <div className="line"></div>
              <div className={`step ${activeStep === 2 ? "active" : ""}`}>
                <div className="circle">2</div>
                <span>Dog Profile</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main card */}
        <main className="card" role="form" aria-labelledby="createDogTitle">
          <h2 id="createDogTitle" className="card-title">Create Your Dog’s Profile</h2>
          <p className="card-sub">Tell us a little about your furry friend</p>

          {/* Upload */}
          <div className="upload-row">
            <div className="upload">
              <span>Upload Photo</span>
              <span className="plus">+</span>
            </div>
          </div>

          {/* Form – controlled inputs */}
          <form className="form" onSubmit={onSubmit}>
            {/* Row 1: Name + Breed */}
            <div className="row align-controls">
              <div className="col">
                <label className="field narrow">
                  <span className="field-label">Dog’s Name</span>
                  <div className="input">
                    <input
                      type="text"
                      placeholder="Enter your dog's name"
                      aria-label="Dog’s Name"
                      value={form.name}
                      onChange={update("name")}
                    />
                  </div>
                </label>
              </div>
              <div className="col">
                <label className="field narrow">
                  <span className="field-label">Breed</span>
                  <div className="input">
                    <input
                      type="text"
                      placeholder="Enter your dog's breed"
                      aria-label="Breed"
                      value={form.breed}
                      onChange={update("breed")}
                    />
                  </div>
                </label>
              </div>
            </div>

            {/* Row 2: Age + Gender */}
            <div className="row">
              <div className="col">
                <label className="field narrow">
                  <span className="field-label">Age</span>
                  <div className="select">
                    <select
                      aria-label="Age"
                      value={form.age}
                      onChange={update("age")}
                    >
                      <option value="" disabled>Select age</option>
                      <option value="Puppy (0–1)">Puppy (0–1)</option>
                      <option value="Young (1–3)">Young (1–3)</option>
                      <option value="Adult (3–7)">Adult (3–7)</option>
                      <option value="Senior (7+)">Senior (7+)</option>
                    </select>
                  </div>
                </label>
              </div>
              <div className="col">
                <div className="field">
                  <span className="field-label">Gender</span>
                  <div className="radio-group">
                    <label>
                      <input
                        type="radio"
                        name="gender"
                        value="Male"
                        checked={form.gender === "Male"}
                        onChange={update("gender")}
                      />{" "}
                      Male
                    </label>
                    <label>
                      <input
                        type="radio"
                        name="gender"
                        value="Female"
                        checked={form.gender === "Female"}
                        onChange={update("gender")}
                      />{" "}
                      Female
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Row 3: Personality */}
            <div className="row">
              <div className="col">
                <div className="field">
                  <span className="field-label">Personality</span>
                  <div className="pills">
                    {P("Friendly")}
                    {P("Shy")}
                    {P("Calm")}
                    {P("Energetic")}
                    {P("Curious")}
                    {P("Scared")}
                    {P("Vocal")}
                    {P("Social")}
                  </div>
                </div>
              </div>
            </div>

            {/* Row 4: Energy (full width) */}
            <div className="row">
              <div className="col">
                <div className="field">
                  <span className="field-label">Energy Level</span>
                  <div className="range-meta">
                    <span>Low</span>
                    <span>High</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="1000"
                    step="1"
                    value={form.energy}
                    onChange={updateEnergy}
                  />
                </div>
              </div>
            </div>

            {/* Row 5: Favorite Activity */}
            <div className="row">
              <div className="col">
                <label className="field">
                  <span className="field-label">Favorite Activity</span>
                  <div className="select">
                    <select
                      aria-label="Favorite Activity"
                      value={form.activity}
                      onChange={update("activity")}
                    >
                      <option value="" disabled>Select favorite activity</option>
                      <option value="Tug of War">Tug of War</option>
                      <option value="Running">Running</option>
                      <option value="Swimming">Swimming</option>
                      <option value="Fetch">Fetch</option>
                      <option value="Chase">Chase</option>
                    </select>
                  </div>
                </label>
              </div>
            </div>

            {/* Row 6: Submit */}
            <div className="row">
              <div className="col">
                <div className="actions">
                  <button className="button" type="submit">Create Profile</button>
                </div>
              </div>
            </div>
          </form>
        </main>

        {/* Simple live preview after "saving" */}
        {savedProfile && (
          <section className="card" aria-live="polite">
            <h3>Profile Preview</h3>
            <p><strong>{savedProfile.name || "Unnamed Pup"}</strong> • {savedProfile.breed || "Breed N/A"}</p>
            <p>{savedProfile.age || "Age N/A"} • {savedProfile.gender || "Gender N/A"}</p>
            <p>Favorite: {savedProfile.activity || "N/A"}</p>
            <p>Energy: {savedProfile.energy}</p>
            <p>Personality: {savedProfile.personalities.join(", ") || "N/A"}</p>
          </section>
        )}

        <footer className="footer">
          <p>© 2025 Pupperazzi. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}