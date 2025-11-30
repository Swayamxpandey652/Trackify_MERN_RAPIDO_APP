import Driver from "../models/Driver.js";
import { createRedisClient } from "../config/redis.js";

let redisClient;

// --------------------------
// Initialize Redis client
// --------------------------
const initRedis = async () => {
  if (!redisClient) {
    redisClient = await createRedisClient();
  }
};
initRedis();

/* ============================================================
   UPDATE DRIVER LIVE LOCATION
   ============================================================ */
export const updateLocation = async (req, res) => {
  try {
    const { lat, lng } = req.body;
    const driverId = req.user.id;

    if (!lat || !lng) {
      return res.status(400).json({ error: "Latitude & Longitude are required" });
    }

    // Save live location in Redis
    await redisClient.sendCommand([
      "GEOADD",
      "drivers",
      lng.toString(),
      lat.toString(),
      driverId
    ]);

    // Also update location inside MongoDB (optional)
    await Driver.findByIdAndUpdate(driverId, {
      lastLocation: { lat, lng },
    });

    res.json({ success: true, message: "Driver location updated 👍" });
  } catch (err) {
    console.error("Driver Location Error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

/* ============================================================
   TOGGLE DRIVER AVAILABILITY
   ============================================================ */
export const toggleAvailability = async (req, res) => {
  try {
    const driverId = req.user.id;
    const { isAvailable } = req.body;

    const driver = await Driver.findByIdAndUpdate(
      driverId,
      { isAvailable },
      { new: true }
    );

    if (!driver) {
      return res.status(404).json({ error: "Driver not found" });
    }

    // Remove from Redis list if offline
    if (!isAvailable) {
      await redisClient.sendCommand(["ZREM", "drivers", driverId]);
    }

    res.json({
      success: true,
      driver,
      message: `Driver is now ${isAvailable ? "Online" : "Offline"}`,
    });
  } catch (err) {
    console.error("Availability Error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

/* ============================================================
   GET NEARBY DRIVERS (for rider search)
   ============================================================ */
export const getNearbyDrivers = async (req, res) => {
  try {
    const { lat, lng, radius = 3000 } = req.query; // default 3km radius

    if (!lat || !lng) {
      return res.status(400).json({ error: "Latitude & Longitude required" });
    }

    // GEORADIUS is deprecated → use GEOSEARCH instead
    const nearby = await redisClient.sendCommand([
      "GEOSEARCH",
      "drivers",
      "FROMLONLAT",
      lng.toString(),
      lat.toString(),
      "BYRADIUS",
      radius.toString(),
      "m",
      "WITHDIST"
    ]);

    // nearby = [["driverId", "distance"], ...]
    const formattedDrivers = [];

    for (let i = 0; i < nearby.length; i++) {
      const driverId = nearby[i][0];
      const distance = parseFloat(nearby[i][1]);

      const driver = await Driver.findById(driverId).select("name isAvailable lastLocation");

      if (driver && driver.isAvailable) {
        formattedDrivers.push({
          driverId,
          distance,
          info: driver,
        });
      }
    }

    res.json({
      success: true,
      count: formattedDrivers.length,
      drivers: formattedDrivers
    });
  } catch (err) {
    console.error("Nearby Drivers Error:", err);
    res.status(500).json({ error: "Server error" });
  }
};
