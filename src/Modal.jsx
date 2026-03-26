import React from "react";
import "./Modal.css";

export default function Modal({ show, onClose }) {
    if (!show) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-container" onClick={(e) => e.stopPropagation()}>
                <h2>🚧 Coming in Sprint 3 🚧</h2>
                <p>We’re working hard to bring this feature to life. Stay tuned! 🐶</p>
                <button className="modal-close-btn" onClick={onClose}>
                    Close
                </button>
            </div>
        </div>
    );
}
