export async function getUserLocation() {
    if (!navigator.geolocation) throw new Error("Geolocation not supported");

    return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const { latitude, longitude } = pos.coords;
                try {
                    const res = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
                    );
                    const data = await res.json();

                    const city = data.address.city || data.address.town || data.address.village || "";
                    const state = data.address.state || "";
                    const country = data.address.country || "";
                    resolve({
                        lat: latitude,
                        lon: longitude,
                        location: [city, state, country].filter(Boolean).join(", "),
                    });
                } catch {
                    reject(new Error("Failed to reverse-geocode location"));
                }
            },
            (err) => reject(err),
            { enableHighAccuracy: true, timeout: 10000 }
        );
    });
}
