// src/Navbar.jsx
import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Navbar.css";

import Logo from "./assets/icon.png";
import DefaultAvatar from "./assets/profile.png";

// DEV vs PROD BASES
const API = import.meta.env.DEV
  ? "http://localhost:8000"
  : "/CSE442/2025-Fall/cse-442ac/api";

const UPLOADS = import.meta.env.DEV
  ? "http://localhost:8000/uploads"
  : "/CSE442/2025-Fall/cse-442ac/api/uploads";

function getUserId() {
  return Number(localStorage.getItem("userId") || 0);
}

export default function Navbar({ isLoggedIn, setIsLoggedIn }) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [avatar, setAvatar] = useState(DefaultAvatar);

  const [dogs, setDogs] = useState([]);
  const [dogMenuOpen, setDogMenuOpen] = useState(false);

  const menuRef = useRef(null);
  const avatarRef = useRef(null);

  const uid = getUserId();

  /* -----------------------------
     LOAD USER AVATAR
  ------------------------------ */
  useEffect(() => {
    if (!uid) return;

    (async () => {
      try {
        const r = await fetch(`${API}/profile_get.php?user_id=${uid}`);
        const d = await r.json();

        if (d.ok && d.user?.avatar_url) {
          let file = d.user.avatar_url.replace(
            "/CSE442/2025-Fall/cse-442ac/api/uploads/",
            ""
          );

          setAvatar(`${UPLOADS}/${file}`);
        }
      } catch (err) {
        console.error("Avatar fetch error:", err);
      }
    })();
  }, [uid]);

  /* -----------------------------
     LOAD ALL USER DOGS
  ------------------------------ */
  useEffect(() => {
    if (!uid) return;

    fetch(`${API}/get_dogs.php?user_id=${uid}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data?.dogs)) {
          setDogs(data.dogs);
        }
      })
      .catch(() => {});
  }, [uid]);

  /* -----------------------------
     CLOSE MENUS WHEN CLICK OUTSIDE
  ------------------------------ */
  useEffect(() => {
    const close = (e) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target) &&
        !avatarRef.current?.contains(e.target)
      ) {
        setMenuOpen(false);
        setDogMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  /* -----------------------------
     LOGOUT
  ------------------------------ */
  const logout = () => {
    localStorage.clear();
    setIsLoggedIn(false);
    navigate("/login");
  };

  return (
    <header className="global-navbar">
      <div className="navbar-left">
        <Link to="/home" className="brand">
          <img src={Logo} className="brand-logo" />
          <span className="brand-name">Pupperazzi</span>
        </Link>
      </div>

      <div className="navbar-right">
        {!isLoggedIn ? (
          <>
            <Link to="/login">Login</Link>
            <Link to="/create-account">Sign Up</Link>
          </>
        ) : (
          <>
            {/* AVATAR BUTTON */}
            <img
              ref={avatarRef}
              src={avatar}
              className="avatar"
              onClick={() => setMenuOpen((v) => !v)}
            />

            {/* MAIN DROPDOWN */}
            {menuOpen && (
              <div className="dropdown-menu" ref={menuRef}>
                <Link to="/home">Home</Link>
                <Link to="/swiping">Swiping</Link>
                <Link to="/me">My Profile</Link>

                {/* -----------------------------
                    DOG PROFILE DROPDOWN
                ------------------------------ */}
                <div className="submenu">
                  <span
                    className="submenu-title"
                    onClick={() => setDogMenuOpen((o) => !o)}
                  >
                    Dog Profiles ▾
                  </span>

                  {dogMenuOpen && (
                    <div className="submenu-items">
                      {dogs.length ? (
                        dogs.map((dog) => (
                          <Link
                            key={dog.id}
                            to={`/dog/${dog.id}`}
                            className="submenu-item"
                            onClick={() => {
                              setMenuOpen(false);
                              setDogMenuOpen(false);
                            }}
                          >
                            {dog.name}
                          </Link>
                        ))
                      ) : (
                        <div className="submenu-item disabled">
                          No dogs found
                        </div>
                      )}
                      <hr />
                    </div>
                  )}
                </div>

                <Link to="/messages">Messages</Link>
                <Link to="/events">Events</Link>

                <hr />

                <button className="logout-btn" onClick={logout}>
                  Logout
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </header>
  );
}
