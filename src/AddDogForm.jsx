import { useState } from "react";
import "./AddDogForm.css";

export default function AddDogForm({ onClose }) {
    const [form, setForm] = useState({
        name: "",
        breed: "",
        age: "",
        size: "",
        gender: "",
        personalities: [],
        energy: 3,
    });

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
        console.log("Dog profile saved:", form);
        onClose(); // ✅ close popup after saving
    };

    const P = (p) => (
        <label className="pill" key={p}>
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
                {/* ✕ Close Button */}
                <button
                    type="button"
                    className="close-x"
                    onClick={onClose}
                    aria-label="Close"
                >
                    ✕
                </button>

                <div className="header">
                    <h1>Add Dog Profile</h1>
                    <p>Tell us about your furry friend</p>
                </div>

                <main className="card">
                    <p className="card-sub">
                        Provide details so others can get to know your pup
                    </p>

                    <form className="form" onSubmit={onSubmit}>
                        {/* Row 1: Name + Breed */}
                        <div className="row align-controls">
                            <div className="col">
                                <label className="field narrow">
                                    <span className="field-label">Dog’s Name *</span>
                                    <div className="input">
                                        <input
                                            type="text"
                                            placeholder="e.g. Bella"
                                            value={form.name}
                                            onChange={update("name")}
                                            required
                                        />
                                    </div>
                                </label>
                            </div>
                            <div className="col">
                                <label className="field narrow">
                                    <span className="field-label">Breed *</span>
                                    <div className="input">
                                        <input
                                            type="text"
                                            placeholder="e.g. Golden Retriever"
                                            value={form.breed}
                                            onChange={update("breed")}
                                            required
                                        />
                                    </div>
                                </label>
                            </div>
                        </div>

                        {/* Row 2: Age + Size + Gender */}
                        <div className="row align-controls">
                            <div className="col">
                                <label className="field narrow">
                                    <span className="field-label">Age *</span>
                                    <div className="select">
                                        <select
                                            value={form.age}
                                            onChange={update("age")}
                                            required
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
                                <label className="field narrow">
                                    <span className="field-label">Size *</span>
                                    <div className="select">
                                        <select
                                            value={form.size}
                                            onChange={update("size")}
                                            required
                                        >
                                            <option value="" disabled>Select size</option>
                                            <option value="Tiny">Tiny</option>
                                            <option value="Small">Small</option>
                                            <option value="Medium">Medium</option>
                                            <option value="Large">Large</option>
                                            <option value="Giant">Giant</option>
                                        </select>
                                    </div>
                                </label>
                            </div>

                            <div className="col">
                                <div className="field">
                                    <span className="field-label">Gender *</span>
                                    <div className="radio-group">
                                        <label>
                                            <input
                                                type="radio"
                                                name="gender"
                                                value="Male"
                                                checked={form.gender === "Male"}
                                                onChange={update("gender")}
                                                required
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
                                                required
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
                                        {P("Vocal")}
                                        {P("Social")}
                                        {P("Likes to cuddle")}
                                        {P("Territorial")}
                                        {P("Aggressive")}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Row 4: Energy Level */}
                        <div className="row">
                            <div className="col">
                                <div className="field">
                                    <span className="field-label">Energy Level *</span>
                                    <div className="range-meta">
                                        <span>Low</span><span>High</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="1"
                                        max="10"
                                        step="1"
                                        value={form.energy}
                                        onChange={updateEnergy}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Row 5: Submit Buttons */}
                        <div className="row">
                            <div className="col">
                                <div className="actions">
                                    <button className="button" type="submit">
                                        Save Profile
                                    </button>
                                    <button
                                        type="button"
                                        className="button"
                                        style={{ background: "#ccc" }}
                                        onClick={onClose}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    </form>
                </main>
            </div>
        </div>
    );
}
