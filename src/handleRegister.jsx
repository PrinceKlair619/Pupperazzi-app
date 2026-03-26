import { getUserLocation } from "./getUserLocation";

async function handleRegister(e) {
    e.preventDefault();

    let geoData = {};
    try {
        geoData = await getUserLocation();
        console.log("Detected:", geoData);
    } catch (err) {
        console.warn("Could not auto-detect location:", err.message);
    }

    const payload = {
        email,
        username,
        password,
        firstName,
        lastName,
        phone,
        location: geoData.location || manualLocationInput || "",
        lat: geoData.lat || null,
        lon: geoData.lon || null,
    };

    const res = await fetch(`${API}/register.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!data.ok) alert(data.error);
    else navigate("/login");
}
