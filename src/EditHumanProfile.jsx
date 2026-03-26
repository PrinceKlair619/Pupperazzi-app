import React, { useState } from "react";
import "./editdogprofile.css"; // Reuse the same styling for consistency

export default function EditHumanProfile({ humanProfile, setHumanProfile, setIsEditing }) {
    const [formData, setFormData] = useState(humanProfile);

    const handleChange = (field, value) => {
        setFormData({ ...formData, [field]: value });
    };

    // 📸 Upload profile photo
    const handlePhotoUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const imgURL = URL.createObjectURL(file);
            setFormData(prev => ({ ...prev, photo: imgURL }));
        }
    };

    const handleArrayChange = (field, value) => {
        setFormData({
            ...formData,
            [field]: value.split(",").map((v) => v.trim()),
        });
    };

    const handleSave = () => {
        setHumanProfile(formData);
        setIsEditing(false);
    };

    return (
        <div className="edit-container">
            <h2 className="edit-title">Edit {formData.name}'s Profile</h2>

            <div className="edit-form">
                <label>Name</label>
                <input
                    className="edit-input"
                    value={formData.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                />

                <label>About</label>
                <textarea
                    className="edit-textarea"
                    value={formData.about}
                    onChange={(e) => handleChange("about", e.target.value)}
                />

                <label>Experience</label>
                <select
                    className="edit-input"
                    value={formData.experience}
                    onChange={(e) => handleChange("experience", e.target.value)}
                >
                    <option value="1-2 years">1–2 years</option>
                    <option value="3-5 years">3–5 years</option>
                    <option value="5-8 years">5–8 years</option>
                    <option value="8+ years">8+ years</option>
                </select>

                <label>Preferred Time</label>
                <select
                    className="edit-input"
                    value={formData.preferredTime}
                    onChange={(e) => handleChange("preferredTime", e.target.value)}
                >
                    <option value="Morning">Morning</option>
                    <option value="Afternoon">Afternoon</option>
                    <option value="Evening">Evening</option>
                </select>

                <label>Preferences (comma separated)</label>
                <input
                    className="edit-input"
                    value={formData.preferences.join(", ")}
                    onChange={(e) => handleArrayChange("preferences", e.target.value)}
                />

                <label>Profile Photo</label>
                <div className="photo-edit-gallery">
                    <img src={formData.photo} alt="Profile Preview" style={{width: "100px", borderRadius: "8px"}}/>
                </div>
                <input type="file" accept="image/*" onChange={handlePhotoUpload}/>

                <div className="edit-actions">
                    <button className="cta-btn save-btn" type="submit" onClick={handleSave}>Save</button>
                    <button className="cta-btn cancel-btn" type="button"  onClick={() => setIsEditing(false)}>Cancel</button>
                </div>
            </div>
            </div>
            );
            }
