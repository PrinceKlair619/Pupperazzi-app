import React, { useState } from "react";
import "./reset.css";
import dogIcon from "./assets/icon.png";
import { Link } from "react-router-dom";

const API = import.meta.env.DEV
  ? "https://aptitude.cse.buffalo.edu/CSE442/2025-Fall/cse-442ac/app/api"
  : "/CSE442/2025-Fall/cse-442ac/app/api";

export default function ResetPasswordConfirm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChangePassword = async (e) => {
    e.preventDefault();
    console.log("➡️ handleChangePassword triggered"); // visual confirmation
    setError("");
    setSuccess("");

    if (password !== confirm) {
      setError("❌ Passwords do not match!");
      return;
    }
    if (password.length < 8) {
      setError("❌ Password must be at least 8 characters.");
      return;
    }

    setBusy(true);
    try {
      const endpoint = `${API}/reset_password.php`;
      console.log("Sending request to:", endpoint);

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ email, password }),
      });

      console.log("Response status:", res.status);
      const text = await res.text();
      console.log("Raw response:", text);

      const data = JSON.parse(text || "{}");
      if (!res.ok || !data.ok) throw new Error(data.error || "Password reset failed");

      setSuccess("✅ Password changed successfully! You can now sign in.");
      setEmail("");
      setPassword("");
      setConfirm("");
    } catch (err) {
      console.error("Reset error:", err);
      setError(err.message || "Error resetting password");
    } finally {
      setBusy(false);
    }
  };

  const getPasswordStrength = (pass) => {
    const length = pass.length >= 8;
    const hasNumber = /\d/.test(pass);
    const hasSpecial = /[^A-Za-z0-9]/.test(pass);
    return [length, hasNumber, hasSpecial].filter(Boolean).length;
  };

  const passwordStrength = getPasswordStrength(password);
  const meetsLength = password.length >= 8;
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  return (
    <div className="container">


      <div className="content">
        <div className="Card1">
          <img src={dogIcon} alt="Dog icon" className="icon" />
          <h2 className="Card1-title">Pupperazzi</h2>
          <p className="Card1-sub">Find perfect playmates for your furry friend</p>

          {/* ✅ The form and button are connected */}
          <form className="form" onSubmit={handleChangePassword}>
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

            <label className="input">
              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={busy}
              />
            </label>

            <label className="input">
              <input
                type="password"
                placeholder="Confirm your password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                disabled={busy}
              />
            </label>

            {password && (
              <div className="strength-section">
                <div className="strength-wrapper">
                  <div
                    className="strength-bar"
                    style={{
                      backgroundColor: passwordStrength >= 1 ? "#e74c3c" : "#ccc",
                    }}
                  />
                  <div
                    className="strength-bar"
                    style={{
                      backgroundColor: passwordStrength >= 2 ? "#f1c40f" : "#ccc",
                    }}
                  />
                  <div
                    className="strength-bar"
                    style={{
                      backgroundColor: passwordStrength === 3 ? "#2ecc71" : "#ccc",
                    }}
                  />
                </div>

                <ul className="rules">
                  <li style={{ color: meetsLength ? "#2ecc71" : "#999" }}>
                    At least 8 characters
                  </li>
                  <li style={{ color: hasNumber ? "#2ecc71" : "#999" }}>
                    Contains a number
                  </li>
                  <li style={{ color: hasSpecial ? "#2ecc71" : "#999" }}>
                    Contains a special character
                  </li>
                </ul>
              </div>
            )}

            {error && <p style={{ color: "crimson" }}>{error}</p>}
            {success && <p style={{ color: "green" }}>{success}</p>}

            {/* ✅ Button inside the form, triggers onSubmit */}
            <button type="submit" className="button" disabled={busy}>
              {busy ? "Updating..." : "Change Password"}
            </button>
          </form>

          <p className="signin-text">
            Don’t have an account? <Link to="/login">Sign up</Link>
          </p>
        </div>
      </div>

    </div>
  );
}
