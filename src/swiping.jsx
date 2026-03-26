// src/SwipingPage.jsx
import React, { useEffect, useRef, useState, useCallback } from "react";
import "./swiping.css";
import mini_profile_pic from "./assets/miniperson.png";
import dog_photo from "./assets/profile_2.png";

// Works in dev (localhost) and on Aptitude
const API =
  import.meta.env?.DEV
    ? "https://aptitude.cse.buffalo.edu/CSE442/2025-Fall/cse-442ac/api"
    : "/CSE442/2025-Fall/cse-442ac/api";

/* ---------------- helpers ---------------- */
const traitIcon = (label) =>
  ({
    "High Energy": "⚡",
    "Very Friendly": "🤝",
    Social: "🫶",
    "Well Trained": "⭐",
    Friendly: "🤝",
    Calm: "🧘",
    Curious: "👀",
    Shy: "😶",
    Vocal: "🗣️",
    Territorial: "🛡️",
    "Barks a lot": "🔔",
    "Not good with strangers": "🚫",
    "Likes to cuddle": "🫂",
    Aggressive: "⚠️",
  }[label] || "🐶");

const resolvePhoto = (u) => {
  if (!u) return dog_photo;
  if (/^https?:\/\//i.test(u)) return u;
  const rel = u.startsWith("/") ? u : `/${u}`;
  return `https://aptitude.cse.buffalo.edu${rel}`;
};

const pickAgeRange = (ageGroup) =>
  ({ puppy: [0, 1], young: [1, 3], adult: [3, 7], senior: [7, 30] }[ageGroup] || [0, 30]);

function parsePersonalities(val) {
  if (Array.isArray(val)) return val;
  if (typeof val === "string") {
    try {
      const j = JSON.parse(val);
      if (Array.isArray(j)) return j;
    } catch {}
    return val
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

function timeAgo(iso) {
  if (!iso) return "just now";
  const then = new Date(iso.replace(" ", "T")).getTime(); // tolerate "YYYY-MM-DD HH:mm:ss"
  const now = Date.now();
  const s = Math.max(1, Math.floor((now - then) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

async function fetchDogs({ viewerId, cursor, filters }) {
  const params = new URLSearchParams({
    feed: "1",
    viewer_id: String(viewerId),
    exclude_swiped: "1",
    limit: "10",
    _: String(Date.now()), // cache-bust
  });

  if (cursor) params.set("after_id", String(cursor));
  if (filters?.ageGroup) {
    const [min, max] = pickAgeRange(filters.ageGroup);
    params.set("min_age", String(min));
    params.set("max_age", String(max));
  }
  if (filters?.size && filters.size !== "Any") {
    params.set("sizes", String(filters.size).toLowerCase());
  }
  if (typeof filters?.energy === "number") {
    // filters.energy is 1..1000 from the slider – map to 1..5 bucket
    const bucket = Math.min(
      5,
      Math.max(1, Math.ceil(filters.energy / 200)) // 1–200 -> 1, 201–400 -> 2, ..., 801–1000 -> 5
    );
    params.set("energy_min", String(bucket));
  }

  const res = await fetch(`${API}/get_dogs.php?${params.toString()}`, {
    credentials: "omit",
    cache: "no-store",
  });
  const text = await res.text();
  let data = null;
  try {
    data = JSON.parse(text);
  } catch {}
  if (!res.ok || !data?.ok) {
    const msg = data && data.error ? data.error : `HTTP ${res.status} – ${text.slice(0, 200)}`;
    throw new Error(msg);
  }
  return data; // { ok:true, dogs:[...], next_cursor }
}

async function sendSwipe({ userId, dogId, action }) {
  try {
    const res = await fetch(`${API}/swipe.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "omit",
      cache: "no-store",
      body: JSON.stringify({ user_id: userId, dog_id: dogId, action }),
    });
    const text = await res.text();
    let data = null;
    try {
      data = JSON.parse(text);
    } catch {}
    if (!res.ok || !data?.ok) {
      const msg = data && data.error ? data.error : `HTTP ${res.status} – ${text.slice(0, 200)}`;
      return { ok: false, error: msg };
    }
    return data;
  } catch (e) {
    return { ok: false, error: String(e?.message || "Network error") };
  }
}

async function fetchRecentMatches(userId, limit = 10) {
  const res = await fetch(
    `${API}/recent_matches.php?user_id=${encodeURIComponent(
      userId
    )}&limit=${limit}&_=${Date.now()}`,
    { credentials: "omit", cache: "no-store" }
  );
  const text = await res.text();
  let data = null;
  try {
    data = JSON.parse(text);
  } catch {}
  if (!res.ok || !data?.ok) {
    throw new Error(data?.error || `HTTP ${res.status} – ${text.slice(0, 200)}`);
  }
  return (data.matches || []).map((m) => ({
    id: m.id,
    name: m.dog_name || "Dog",
    photo_url: m.dog_photo || "",
    when: m.when,
  }));
}

/* ---------------- component ---------------- */
export default function SwipingPage() {
  // favor user_id; fall back to userId; else 0
  const userId = (() => {
    const raw =
      (typeof localStorage !== "undefined" &&
        (localStorage.getItem("user_id") || localStorage.getItem("userId"))) ||
      (typeof sessionStorage !== "undefined" &&
        (sessionStorage.getItem("user_id") || sessionStorage.getItem("userId"))) ||
      "0";
    const n = Number.parseInt(raw, 10);
    return Number.isFinite(n) && n > 0 ? n : 0;
  })();

  const defaultFilters = {
    ageGroup: "adult",
    size: "Large",
    energy: 500, // 1..1000 UI scale (mapped to 1..5 for API)
    distance: "Within 5 miles", // not used on BE yet
  };

  const [filters, setFilters] = useState(defaultFilters);
  const resetFilters = () => setFilters(defaultFilters);

  const [queue, setQueue] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const loadingMore = useRef(false);

  const [anim, setAnim] = useState(null);
  const [pendingAction, setPendingAction] = useState(null);
  const animDoneRef = useRef(false);

  const [recentMatches, setRecentMatches] = useState([]);
  const [matchBanner, setMatchBanner] = useState(null); // {name, photo_url} | null

  const loadRecent = useCallback(async () => {
    if (!userId) return;
    try {
      const list = await fetchRecentMatches(userId, 10);
      setRecentMatches(list);
    } catch {
      /* ignore non-fatal */
    }
  }, [userId]);

  // Poll recent matches + refresh on focus
  useEffect(() => {
    if (!userId) return;
    let stop = false;

    const load = async () => {
      try {
        const list = await fetchRecentMatches(userId, 10);
        if (!stop) setRecentMatches(list);
      } catch {}
    };

    load(); // initial
    const id = setInterval(load, 8000);

    const onFocus = () => load();
    window.addEventListener("visibilitychange", onFocus);
    window.addEventListener("focus", onFocus);

    return () => {
      stop = true;
      clearInterval(id);
      window.removeEventListener("visibilitychange", onFocus);
      window.removeEventListener("focus", onFocus);
    };
  }, [userId]);

  const loadMore = useCallback(
    async () => {
      if (loadingMore.current || !userId) return;
      loadingMore.current = true;
      try {
        const { dogs, next_cursor } = await fetchDogs({ viewerId: userId, cursor, filters });
        setQueue((q) => [...q, ...dogs]);
        setCursor(next_cursor ?? null);
      } catch (e) {
        setErrorMsg(String(e?.message || "Failed to load more"));
      } finally {
        loadingMore.current = false;
      }
    },
    [userId, cursor, filters]
  );

  // initial + on filters change
  useEffect(() => {
    if (!userId) return;
    let ignore = false;

    setCursor(null);
    (async () => {
      setLoading(true);
      setErrorMsg("");
      try {
        const { dogs, next_cursor } = await fetchDogs({ viewerId: userId, cursor: null, filters });
        if (!ignore) {
          setQueue(dogs);
          setCursor(next_cursor ?? null);
        }
      } catch (e) {
        if (!ignore) {
          setQueue([]);
          setCursor(null);
          setErrorMsg(String(e?.message || "Failed to load"));
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    })();

    return () => {
      ignore = true;
    };
  }, [userId, filters]);

  const current = queue[0];

  const handleAction = useCallback(
    async (action) => {
      if (!queue.length || !userId) return;
      const [top, ...rest] = queue;

      // optimistic remove
      setQueue(rest);

      const resp = await sendSwipe({ userId, dogId: top.id, action });
      if (!resp.ok) {
        // roll back and surface reason
        setQueue((q) => [top, ...q]);
        setErrorMsg(resp.error || "Couldn’t send swipe. Try again.");
        return;
      }

      if (resp.match) {
        const matched = resp.matched_dog || top;

        // visible banner (so it feels instant)
        setMatchBanner({
          name: matched.name || "Dog",
          photo_url: matched.photo_url || "",
        });
        setTimeout(() => setMatchBanner(null), 3500);

        // update sidebar immediately for swiper
        setRecentMatches((m) => [
          {
            id: resp.match_id || Date.now(),
            name: matched.name,
            photo_url: matched.photo_url,
            when: new Date().toISOString(),
          },
          ...m.slice(0, 9),
        ]);

        // and then force a fresh pull (prevents cache / “first liker” stale state)
        loadRecent();
      }

      if (rest.length < 4) loadMore();
    },
    [queue, userId, loadMore, loadRecent]
  );

  const animateThenAct = useCallback(
    (action) => {
      if (!current || anim) return;
      const classMap = { like: "anim-like", dislike: "anim-dislike", star: "anim-maybe" };
      const cls = classMap[action] || null;

      animDoneRef.current = false;
      setPendingAction(action);
      setAnim(cls);

      // fallback if animationend doesn’t fire
      window.requestAnimationFrame(() => {
        setTimeout(() => {
          if (animDoneRef.current) return;
          animDoneRef.current = true;
          setAnim(null);
          setPendingAction(null);
          handleAction(action);
        }, 380);
      });
    },
    [current, anim, handleAction]
  );

  if (!userId) {
    return (
      <div className="swiping-page">
        <div style={{ padding: 24 }}>Please log in to start swiping.</div>
      </div>
    );
  }

  return (
    <div className="swiping-page">
      {/* Match banner */}
      {matchBanner && (
        <div
          className="match-banner"
          role="status"
          style={{
            position: "fixed",
            top: 12,
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(16,185,129,.95)",
            color: "white",
            borderRadius: 999,
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "8px 14px",
            zIndex: 50,
            boxShadow: "0 6px 16px rgba(0,0,0,.2)",
          }}
        >
          <img
            alt=""
            src={resolvePhoto(matchBanner.photo_url)}
            style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover" }}
            onError={(e) => (e.currentTarget.src = dog_photo)}
          />
          <strong style={{ fontWeight: 700 }}>It’s a match with {matchBanner.name}!</strong>
        </div>
      )}

      {/* Mobile filters */}
      <div className="mobile-filters">
        <details className="mobile-filter-sheet">
          <summary>Filters</summary>
          <div className="filters-inner">
            <div className="filter-group">
              <label>Age</label>
              <div className="select-row">
                <select
                  value={filters.ageGroup}
                  onChange={(e) =>
                    setFilters((f) => ({ ...f, ageGroup: e.target.value }))
                  }
                >
                  <option value="puppy">Puppy 0–1</option>
                  <option value="young">Young 1–3</option>
                  <option value="adult">Adult 3–7</option>
                  <option value="senior">Senior 7+</option>
                </select>
              </div>
            </div>

            <div className="filter-group">
              <label>Size</label>
              <div className="chip-row">
                {["Tiny", "Small", "Medium", "Large", "Giant"].map((s) => (
                  <button
                    key={s}
                    className={`chip ${filters.size === s ? "active" : ""}`}
                    onClick={() => setFilters((f) => ({ ...f, size: s }))}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="filter-group">
              <label>Energy</label>
              <div className="range-row">
                <input
                  type="range"
                  min="1"
                  max="1000"
                  step="1"
                  value={filters.energy}
                  onChange={(e) =>
                    setFilters((f) => ({ ...f, energy: +e.target.value }))
                  }
                />
                <span className="muted">low — high</span>
              </div>
            </div>

            <div
              className="filter-group"
              style={{ textAlign: "center", marginTop: "1rem" }}
            >
              <button className="btn" onClick={resetFilters}>
                Reset Filters
              </button>
            </div>
          </div>
        </details>
      </div>

      <div className="swipe-container">
        {/* Left filters card (desktop) */}
        <aside className="filters-card card">
          <h3>Filters</h3>

          <div className="filter-group">
            <label>Age</label>
            <div className="select-row">
              <select
                value={filters.ageGroup}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, ageGroup: e.target.value }))
                }
              >
                <option value="puppy">Puppy 0–1</option>
                <option value="young">Young 1–3</option>
                <option value="adult">Adult 3–7</option>
                <option value="senior">Senior 7+</option>
              </select>
            </div>
          </div>

          <div className="filter-group">
            <label>Size</label>
            <div className="chip-row">
              {["Tiny", "Small", "Medium", "Large", "Giant"].map((s) => (
                <button
                  key={s}
                  className={`chip ${filters.size === s ? "active" : ""}`}
                  onClick={() => setFilters((f) => ({ ...f, size: s }))}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-group">
            <label>Energy</label>
            <div className="range-row">
              <input
                type="range"
                min="1"
                max="1000"
                step="1"
                value={filters.energy}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, energy: +e.target.value }))
                }
              />
            </div>
          </div>

          <div
            className="filter-group"
            style={{ textAlign: "center", marginTop: "1rem" }}
          >
            <button className="btn" onClick={resetFilters}>
              Reset Filters
            </button>
          </div>

          <div className="recent-matches">
            <h4>Recent Matches</h4>
            {recentMatches.length === 0 ? (
              <p className="muted" style={{ marginTop: 6 }}>
                No matches yet.
              </p>
            ) : (
              <ul>
                {recentMatches.map((m) => (
                  <li key={`${m.id}-${m.when}`}>
                    <img
                      src={resolvePhoto(m.photo_url) || mini_profile_pic}
                      alt={m.name || "Dog"}
                    />
                    <div>
                      <strong>{m.name || "Dog"}</strong>
                      <span className="muted">{timeAgo(m.when)}</span>
                    </div>
                    <span className="online" />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>

        {/* Center swipe card */}
        <main className="swipe-card card">
          {!current ? (
            <div style={{ padding: 24 }}>
              {loading ? "Loading…" : errorMsg || "No more dogs. Adjust filters to see more!"}
            </div>
          ) : (
            <div
              key={current.id}
              className={`card-inner ${anim || ""}`}
              onAnimationEnd={() => {
                if (!anim || !pendingAction || animDoneRef.current) return;
                animDoneRef.current = true;
                const act = pendingAction;
                setAnim(null);
                setPendingAction(null);
                handleAction(act);
              }}
            >
              <div className="photo-wrap">
                <img
                  src={resolvePhoto(current.photo_url)}
                  alt={current.name || "Dog"}
                />
                <div className="overlay">
                  <div>
                    <h2>{current.name || "Dog"}</h2>
                    <p className="muted">
                      {current.breed || "Unknown"} • {current.age_years || "—"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="traits">
                {parsePersonalities(current.personalities)
                  .slice(0, 4)
                  .map((label) => (
                    <div key={label} className="trait">
                      <span className="circle">{traitIcon(label)}</span>
                      <small className="caption">{label}</small>
                    </div>
                  ))}
              </div>

              <p className="bio">
                {current.bio?.trim() ||
                  "Looking for friends and fetch partners!"}
              </p>

              <div className="actions">
                <button
                  className={`btn ghost ${anim ? "is-disabled" : ""}`}
                  onClick={() => animateThenAct("dislike")}
                  aria-label="Dislike"
                  disabled={!!anim}
                >
                  ✕
                </button>

                <button
                  className={`btn maybe ${anim ? "is-disabled" : ""}`}
                  onClick={() => animateThenAct("star")}
                  aria-label="Maybe"
                  disabled={!!anim}
                >
                  ☆
                </button>

                <button
                  className={`btn like ${anim ? "is-disabled" : ""}`}
                  onClick={() => animateThenAct("like")}
                  aria-label="Like"
                  disabled={!!anim}
                >
                  ❤
                </button>
              </div>
            </div>
          )}
        </main>



      </div>
    </div>
  );
}
