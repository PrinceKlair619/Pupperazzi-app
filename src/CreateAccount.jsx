// src/CreateAccount.jsx
import { useState, useEffect } from "react";
import "./CreateAccount.css";
import dogIcon from "./assets/logo.png";
import { Link, useNavigate } from "react-router-dom";
import { getUserLocation } from "./getUserLocation";

// Use the same path in dev & prod; Vite proxy handles dev, Aptitude serves in prod.
const API = "/CSE442/2025-Fall/cse-442ac/api";

export default function CreateAccount() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    location: "", // "City, State/Region, Country"
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const getPasswordStrength = (pass) => {
    const length = pass.length >= 8;
    const hasNumber = /\d/.test(pass);
    const hasSpecial = /[^A-Za-z0-9]/.test(pass);
    return [length, hasNumber, hasSpecial].filter(Boolean).length;
  };

  useEffect(() => {
    async function detectLocation() {
      try {
        const geo = await getUserLocation();
        setForm((f) => ({
          ...f,
          location: geo.location,
          lat: geo.lat,
          lon: geo.lon,
        }));
      } catch (err) {
        console.warn("Could not auto-detect location:", err.message);
      }
    }
    detectLocation();
  }, []);

  const passwordStrength = getPasswordStrength(form.password);

  const validate = () => {
    const first = form.firstName.trim();
    const last = form.lastName.trim();
    const email = form.email.trim();
    const phone = form.phone.trim();
    const location = form.location.trim();

    if (!first || !last || !email || !phone || !location) {
      return "All fields are required.";
    }
    if (email.length > 255) {
      return "❌ Email must be 255 characters or less.";
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return "Please enter a valid email.";
    }
    // permissive international-ish phone check
    if (!/^(\+?\d{1,3}[\s.-]?)?(\(?\d{2,4}\)?[\s.-]?)?\d{3,4}[\s.-]?\d{4,6}$/.test(phone)) {
      return "Please enter a valid phone number.";
    }
    if (passwordStrength < 3) {
      return "Password must be ≥8 chars, include a number and a special character.";
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setBusy(true);
    try {
      const payload = {
        email: form.email.trim(),
        username: (form.email || "").split("@")[0],
        password: form.password,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        phone: form.phone.trim(),
        location: form.location.trim(), // "City, State/Region, Country"
      };

      const res = await fetch(`${API}/register.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Same-origin in prod; proxied in dev. No need to force mode.
        credentials: "omit",
        body: JSON.stringify(payload),
      });

      // Try JSON; if it fails, grab text to surface real server errors.
      let data;
      const text = await res.text();
      try { data = JSON.parse(text); } catch { data = null; }

      if (!res.ok || !(data?.ok)) {
        const msg =
          data?.error ||
          (res.status === 0
            ? "Network/CORS error. Check API base URL and CORS headers."
            : `Request failed (HTTP ${res.status}). Server said: ${text?.slice(0, 200)}`);
        throw new Error(msg);
      }

      // store user id for the upcoming profile update call
      if (data.user?.id) {
        localStorage.setItem("userId", String(data.user.id));
      }

      setSuccess(`Account created for ${data.user?.username ?? "your account"}`);

      // reset form
      setForm({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        password: "",
        location: "",
      });

      // go straight to profile setup
      navigate("/profile/setup");
    } catch (err) {
      setError(err.message || "Something went wrong");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="Container">
      <div className="hero-wrapper">
        <img src={dogIcon} alt="Dog" className="hero-icon-left" />
        <div className="page hero-center">
          <h1 className="hero-title">
            Join the <strong>Pack!</strong>
          </h1>
          <p className="hero-subtitle">
            Create your account and find the perfect playmate for your furry friend
          </p>
          <div className="stepper" aria-label="Signup progress">
            <div className="step-active" aria-current="step">1</div>
            <span className="step-label">Your Profile</span>
            <hr className="divider" />
            <div className="step-inactive">2</div>
            <span className="step-label">Profile Setup</span>
          </div>
        </div>
      </div>

      <div className="Card">
        <form onSubmit={handleSubmit} className="form" noValidate>
          <h2>Create Your Account</h2>

          {error && <p role="alert" style={{color: "crimson"}}>{error}</p>}
          {success && <p style={{color: "green"}}>{success}</p>}

          <div className="row">
            <div className="field">
              <label htmlFor="firstName">First Name</label>
              <input
                  id="firstName"
                  name="firstName"
                  placeholder="ex: Milo"
                  value={form.firstName}
                  onChange={handleChange}
                  className="Input"
                  required
                  disabled={busy}
                  autoComplete="given-name"
                  maxLength={60}
              />
            </div>
            <div className="field">
              <label htmlFor="lastName">Last Name</label>
              <input
                  id="lastName"
                  name="lastName"
                  placeholder="ex: Quinonez"
                  value={form.lastName}
                  onChange={handleChange}
                  className="Input"
                  required
                  disabled={busy}
                  autoComplete="family-name"
                  maxLength={60}
              />
            </div>
          </div>

          <div className="row">
            <div className="field">
              <label htmlFor="email">Email Address</label>
              <input
                  id="email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  className="Input"
                  placeholder="email@domain.com"
                  required
                  disabled={busy}
                  maxLength={255}
                  autoComplete="email"
              />
            </div>
            <div className="field">
              <label htmlFor="phone">Phone Number</label>
              <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="(123) 345-9876"
                  className="Input"
                  required
                  disabled={busy}
                  autoComplete="tel"
              />
            </div>
          </div>

          <div className="field column">
            <label htmlFor="password">Password</label>
            <input
                id="password"
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                className="Input"
                required
                disabled={busy}
                aria-describedby="pw-rules"
                autoComplete="new-password"
            />
            <div className="strength-wrapper" aria-hidden="true">
              <div className="strength-bar" style={{backgroundColor: passwordStrength >= 1 ? "#e74c3c" : "#ccc"}}/>
              <div className="strength-bar" style={{backgroundColor: passwordStrength >= 2 ? "#f1c40f" : "#ccc"}}/>
              <div className="strength-bar" style={{backgroundColor: passwordStrength === 3 ? "#2ecc71" : "#ccc"}}/>
            </div>
            <ul id="pw-rules" className="rules">
              <li>At least 8 characters</li>
              <li>Contains a number</li>
              <li>Contains a special character</li>
            </ul>
          </div>

          {/* Location (searchable Country → State/Region → City) */}
          <div className="field">
            <label htmlFor="location">Location</label>
            <input
                id="location"
                name="location"
                type="text"
                className="Input"
                value={form.location}
                placeholder="Detecting location..."
                disabled
            />
          </div>

          <button type="submit" className="Button" disabled={busy}>
            {busy ? "Creating..." : "Continue to Profile"}
          </button>

          <p className="signin-text">
            Already have an account?{" "}
            <Link to="/login" className="link">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
