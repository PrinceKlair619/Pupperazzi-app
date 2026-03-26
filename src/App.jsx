// App.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";

import SwipePage from "./Matches";
import CreateAccount from "./CreateAccount";
import HomePage from "./HomePage";
import Landingpage from "./landingpage";
import Login from "./login";
import Createdog from "./createdog";
import HumanProfilePage from "./HumanProfilePage";
import ResetPassword from "./ResetPassword";
import ResetPasswordConfirm from "./ResetPasswordConfirm";
import GlobalNavbar from "./Navbar";
import PublicNavbar from "./PublicNavbar";
import GlobalFooter from "./Footer";
import Dogprofile from "./dogprofile";
import MessagesPage from "./Messages";
import Swiping from "./swiping";

// ⭐⭐ UPDATED IMPORT ⭐⭐
import EventsPage from "./events/EventsPage";

import HalloweenRSVP from "./HalloweenRSVP";
import ProfileSetup from "./ProfileSetup";
import PreferencesWizard from "./PreferencesWizard";

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem("loggedIn") === "true";
    setIsLoggedIn(saved);
  }, []);

  useEffect(() => {
    if (isLoggedIn !== null) {
      localStorage.setItem("loggedIn", isLoggedIn ? "true" : "false");
    }
  }, [isLoggedIn]);

  const Navbar = isLoggedIn ? GlobalNavbar : PublicNavbar;

  if (isLoggedIn === null) return null;

  return (
    <>
      <Navbar isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} />

      <Routes>
        {/* Public */}
        <Route path="/" element={<Landingpage />} />
        <Route path="/landingpage" element={<Landingpage />} />
        <Route path="/login" element={<Login setIsLoggedIn={setIsLoggedIn} />} />
        <Route path="/create-account" element={<CreateAccount />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route
          path="/reset-password-confirmation"
          element={<ResetPasswordConfirm />}
        />

        {/* Halloween */}
        <Route path="/halloween" element={<HalloweenRSVP />} />
        <Route path="/events/halloween" element={<HalloweenRSVP />} />

        {/* Onboarding */}
        <Route path="/profile/setup" element={<ProfileSetup />} />
        <Route path="/profile/questions" element={<PreferencesWizard />} />
        <Route path="/createdog" element={<Createdog />} />

        {/* Protected pages */}
        {isLoggedIn ? (
          <>
            <Route path="/home" element={<HomePage />} />

            {/* Your profile */}
            <Route path="/me" element={<HumanProfilePage />} />

            {/* Viewing others */}
            <Route path="/profile/:id" element={<HumanProfilePage />} />

            <Route path="/dog/:dogId" element={<Dogprofile />} />
            <Route path="/matches" element={<SwipePage />} />
            <Route path="/swiping" element={<Swiping />} />

            {/* Messages */}
            <Route path="/messages" element={<MessagesPage />} />
            <Route path="/messages/:cid" element={<MessagesPage />} />

            {/* ⭐ Events Page ⭐ */}
            <Route path="/events" element={<EventsPage />} />
          </>
        ) : (
          <>
            <Route path="/home" element={<Navigate to="/login" replace />} />
            <Route path="/me" element={<Navigate to="/login" replace />} />
            <Route path="/profile/:id" element={<Navigate to="/login" replace />} />
            <Route path="/dog/:dogId" element={<Navigate to="/login" replace />} />
            <Route path="/matches" element={<Navigate to="/login" replace />} />
            <Route path="/messages" element={<Navigate to="/login" replace />} />
            <Route path="/messages/:cid" element={<Navigate to="/login" replace />} />
            <Route path="/swiping" element={<Navigate to="/login" replace />} />
            <Route path="/events" element={<Navigate to="/login" replace />} />
          </>
        )}

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <GlobalFooter />
    </>
  );
}
