import Driver from "../models/Driver.js";
import { createRedisClient } from "../config/redis.js";

let redisClient;

// Initialize Redis client once
const initRedis = async () => {
  if (!redisClient) {
    redisClient = await createRedisClient();
  }
};
initRedis();

// --------------------------
// Update driver location
// --------------------------
export const updateLocation = async (req, res) => {
  try {
    const { lat, lng } = req.body;

    if (!lat || !lng) {
      return res.status(400).json({ error: "Latitude & Longitude required" });
    }

    const driverId = req.user.id;

    // GEOADD to Redis
    await redisClient.sendCommand([
      "GEOADD",
      "drivers",
      lng.toString(),
      lat.toString(),
      driverId
    ]);

    res.json({ success: true, message: "Location updated ✔" });
  } catch (err) {
    console.error("UpdateLocation Error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// --------------------------
// Toggle driver availability
// --------------------------
export const toggleAvailability = async (req, res) => {
  try {
    const driverId = req.user.id;
    const { isAvailable } = req.body;

    // Update MongoDB driver document
    const driver = await Driver.findByIdAndUpdate(
      driverId,
      { isAvailable },
      { new: true }
    );

    // Remove from Redis if offline
    if (!isAvailable) {
      await redisClient.sendCommand(["ZREM", "drivers", driverId]);
    }

    res.json({
      success: true,
      message: `Driver is now ${isAvailable ? "Online" : "Offline"}`,
      driver
    });
  } catch (err) {
    console.error("ToggleAvailability Error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// --------------------------
// Get nearby drivers
// --------------------------
export const getNearbyDrivers = async (req, res) => {
  try {
    const { lat, lng, radius = 3000 } = req.query; // radius in meters

    if (!lat || !lng) {
      return res.status(400).json({ error: "Latitude & Longitude required" });
    }

    // GEORADIUS to fetch nearby drivers
    const nearbyDrivers = await redisClient.sendCommand([
      "GEORADIUS",
      "drivers",
      lng.toString(),
      lat.toString(),
      radius.toString(),
      "m"
    ]);

    res.json({ success: true, drivers: nearbyDrivers });
  } catch (err) {
    console.error("GetNearbyDrivers Error:", err);
    res.status(500).json({ error: "Server error" });
  }
};
