import { Link } from "react-router-dom";
import "./PublicNavbar.css";
import dogIcon from "./assets/icon.png";

export default function PublicNavbar() {
    return (
        <nav className="public-navbar">
            <div className="public-navbar-brand">
                <img src={dogIcon} alt="Pupperazzi Logo" className="public-logo" />
                <Link to="/" className="brand-name">Pupperazzi</Link>
            </div>

            <div className="public-navbar-links">
                <Link to="/login" className="nav-link">Login</Link>
                <Link to="/create-account" className="nav-link">Sign Up</Link>
            </div>
        </nav>
    );
}
