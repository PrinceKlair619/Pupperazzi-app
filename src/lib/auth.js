// src/lib/auth.js
export function getUserId() {
  // Prefer sessionStorage "user" object if present (set on login)
  try {
    const raw = sessionStorage.getItem("user");
    if (raw) {
      const u = JSON.parse(raw);
      if (u && typeof u.id !== "undefined") return Number(u.id);
      if (u && typeof u.userId !== "undefined") return Number(u.userId);
    }
  } catch {
    // ignore JSON/Storage errors
  }
  // Fallback to localStorage
  return Number(localStorage.getItem("userId") || 0);
}
