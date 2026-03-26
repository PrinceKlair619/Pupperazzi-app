import { useState } from "react";
import "./login.css";
import dogIcon from "./assets/icon.png";
import { Link, useNavigate } from "react-router-dom";

// =======================================
// CORRECT API PATH FOR LOCAL + APTITUDE
// =======================================
const API =
  import.meta.env.VITE_API_BASE ??
  (import.meta.env.DEV
    ? "http://localhost:8000"
    : "/CSE442/2025-Fall/cse-442ac/api");

export default function LoginPage({ setIsLoggedIn }) {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [remember, setRemember] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ===================================================
  // LOGIN HANDLER
  // ===================================================
  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setBusy(true);

    try {
      const res = await fetch(`${API}/login.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        },
        body: new URLSearchParams({
          email,
          password,
        }),
      });

      // Read response as text first
      let data = {};
      const text = await res.text();
      try {
        data = JSON.parse(text);
      } catch {
        data = {};
      }

      if (!res.ok || data.ok === false) {
        const msg = data.error || `Login failed (HTTP ${res.status})`;
        throw new Error(msg);
      }

      // Successful login
      const user = data.user || {};
      const uid = String(user.id || "");

      // Persist user session
      const storage = remember ? localStorage : sessionStorage;
      storage.setItem("user", JSON.stringify(user));

      // ALWAYS set these keys for consistency
      localStorage.setItem("loggedIn", "true");
      localStorage.setItem("userId", uid);
      localStorage.setItem("user_id", uid);

      // Cache useful info
      localStorage.setItem(
        "displayName",
        user.username || user.email || "Your Profile"
      );
      localStorage.setItem("bio", user.bio || "");

      if (user.avatar_url) {
        localStorage.setItem("userAvatar", user.avatar_url);
      }

      // Notify navbar to refresh
      window.dispatchEvent(
        new CustomEvent("profile:updated", {
          detail: { userId: uid },
        })
      );

      setSuccess(`Welcome back!`);
      setIsLoggedIn(true);

      navigate("/home");
    } catch (err) {
      console.error("Login Error:", err);
      setError(err.message || "Login failed");
    } finally {
      setBusy(false);
    }
  }

  // go to reset password page
  function handleForgotPassword() {
    navigate("/reset-password");
  }

  return (
    <div className="container">
      <main className="content">
        <form className="Cards" onSubmit={handleSubmit}>
          <div className="logo-badge">
            <img src={dogIcon} alt="Pupperazzi Logo" className="icon" />
          </div>

          <h1 className="Cards-title">Pupperazzi</h1>
          <p className="Cards-sub">Find perfect playmates for your furry friend</p>

          <label className="field">
            <span className="field-label">Email</span>
            <div className="input">
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
          </label>

          <label className="field">
            <span className="field-label">Password</span>
            <div className="input">
              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
          </label>

          <div className="helpers">
            <label className="remember">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              <span>Remember me</span>
            </label>
            <a
              className="muted small"
              onClick={handleForgotPassword}
              style={{ cursor: "pointer" }}
            >
              Forgot password?
            </a>
          </div>

          {error && <p style={{ color: "crimson" }}>{error}</p>}
          {success && <p style={{ color: "green" }}>{success}</p>}

          <button className="button" type="submit" disabled={busy}>
            {busy ? "Signing in..." : "Sign In"}
          </button>

          <p className="signin-text">
            Don’t have an account? <Link to="/create-account">Sign Up</Link>
          </p>
        </form>
      </main>
    </div>
  );
}
