import React from "react";
import "./Footer.css";

export default function GlobalFooter() {
    return (
        <footer className="footer">
            <p>© {new Date().getFullYear()} Pupperazzi. All Rights Reserved 🐾</p>
        </footer>
    );
}
