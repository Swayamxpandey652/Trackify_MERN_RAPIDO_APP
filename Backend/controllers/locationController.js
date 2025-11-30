import fetch from "node-fetch"; // ES Module import

export const ipGeolocate = async (req, res) => {
  try {
    console.log("IP Geolocation request received");

    const response = await fetch("https://ipwho.is/");
    if (!response.ok) throw new Error(`IP lookup failed: ${response.status}`);

    const data = await response.json();
    console.log("IP data received:", data);

    res.json(data);
  } catch (error) {
    console.error("Error in ipGeolocate:", error);
    res.status(500).json({
      message: "Failed to fetch IP location",
      error: error.message,
    });
  }
};

export const searchLocation = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.status(400).json({ message: "Query missing" });

    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(q)}`,
      {
        headers: {
          "User-Agent": "TrackifyApp/1.0", // Nominatim requires User-Agent
        },
      }
    );

    if (!response.ok) throw new Error(`HTTP error ${response.status}`);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("Error fetching Nominatim:", error);
    res.status(500).json({ message: "Failed to fetch location", error: error.message });
  }
};

export const reverseGeocode = async (req, res) => {
  try {
    const { lat, lon } = req.query;
    if (!lat || !lon) return res.status(400).json({ message: "Coordinates missing" });

    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`,
      { headers: { "User-Agent": "TrackifyApp/1.0" } }
    );

    if (!response.ok) throw new Error(`Reverse geocode failed: ${response.status}`);
    const data = await response.json();

    res.json({
      latitude: lat,
      longitude: lon,
      display_name: data.display_name,
      address: data.address,
    });
  } catch (error) {
    console.error("Reverse geocode error:", error);
    res.status(500).json({ message: "Failed to fetch location", error: error.message });
  }
};