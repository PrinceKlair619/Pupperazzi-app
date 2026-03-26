export function normalizeHost(h = {}) {
  const raw =
    h.display_name ||
    h.name ||
    h.username ||
    (h.email ? String(h.email).split("@")[0] : "") ||
    "Host";

  return {
    id: h.id ?? 0,
    name: String(raw).trim() || "Host",
    avatar_url: h.avatar_url || h.avatar || null,
    bio: h.bio || "Reach out to coordinate or ask questions.",
  };
}
