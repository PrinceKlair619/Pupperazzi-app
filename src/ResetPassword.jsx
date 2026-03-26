import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./reset.css"; // reuse login page styles
import dogIcon from "./assets/icon.png";

const API = import.meta.env.DEV
  ? "https://aptitude.cse.buffalo.edu/CSE442/2025-Fall/cse-442ac/app/api"
  : "/CSE442/2025-Fall/cse-442ac/app/api";

export default function ResetPassword() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setBusy(true);

    try {
      const res = await fetch(`${API}/send_reset.php`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ email }),
      });

      const data = await res.json().catch(() => ({}));
      if (!data.ok) throw new Error(data.error || "Failed to send email");

      setSuccess("✅ Password reset email sent! Check your inbox for instructions.");
    } catch (err) {
      setError(err.message || "Error sending reset email");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container">

      <div className="content">
        <div className="Card1">
          <img src={dogIcon} alt="Dog icon" className="icon" />
          <h2 className="Card1-title">Pupperazzi</h2>
          <p className="Card1-sub">Find perfect playmates for your furry friend</p>

          <form className="form" onSubmit={handleSubmit}>
            <label className="input">
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={busy}
              />
            </label>

            {error && <p style={{ color: "crimson" }}>{error}</p>}
            {success && <p style={{ color: "green" }}>{success}</p>}

            <button type="submit" className="button" disabled={busy}>
              {busy ? "Sending..." : "Send Reset Link"}
            </button>
          </form>

          <p className="signin-text">
            Don’t have an account? <Link to="/create-account">Sign up</Link><br />
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>


    </div>
  );
}
