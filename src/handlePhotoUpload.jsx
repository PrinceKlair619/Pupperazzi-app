const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files);

    for (const file of files) {
        const formData = new FormData();
        formData.append("photo", file);

        try {
            const res = await fetch(`${API}/upload_photo.php`, {
                method: "POST",
                credentials: "include", // ✅ send session cookie
                body: formData,
            });

            const data = await res.json();
            if (data.ok) {
                setFormData((prev) => ({
                    ...prev,
                    photos: [...prev.photos, data.url],
                }));
            } else {
                console.error("Upload failed:", data.error);
            }
        } catch (err) {
            console.error("Network error:", err);
        }
    }
};
