import Ride from "../models/Ride.js";
import Driver from "../models/Driver.js";
import { createRedisClient } from "../config/redis.js";

let redisClient;
const initRedis = async () => {
  if (!redisClient) redisClient = await createRedisClient();
};
initRedis();

// Request a ride
export const requestRide = async (req, res) => {
  try {
    const { pickupLat, pickupLng, dropoffLat, dropoffLng } = req.body;

    if (!pickupLat || !pickupLng || !dropoffLat || !dropoffLng)
      return res.status(400).json({ error: "Pickup & dropoff coordinates required" });

    // -----------------------------
    // 🔥 Find nearby drivers (5km) using GEOSEARCH (faster + latest)
    // -----------------------------
    const nearbyDrivers = await redisClient.sendCommand([
      "GEOSEARCH",
      "drivers",
      "FROMLONLAT",
      pickupLng.toString(),
      pickupLat.toString(),
      "BYRADIUS",
      "5000",
      "m",
      "ASC",        // closest first
      "COUNT",
      "5"           // only 5 nearest drivers
    ]);

    if (!nearbyDrivers.length)
      return res.status(404).json({ error: "No nearby drivers available" });

    // Assign the closest one
    const assignedDriverId = nearbyDrivers[0];


   // Notify all nearby drivers via socket
    nearbyDrivers.forEach((driverId) => {
      req.io.to(`driver_${driverId}`).emit("new-ride-request", {
        rideId: ride._id,
        pickup: { lat: pickupLat, lng: pickupLng },
        dropoff: { lat: dropoffLat, lng: dropoffLng },
        riderId: req.user.id,
      });
    });
    // -----------------------------
    // Create Ride
    // -----------------------------
    const ride = await Ride.create({
      rider: req.user.id,
      driver: assignedDriverId,
      pickup: { lat: pickupLat, lng: pickupLng },
      dropoff: { lat: dropoffLat, lng: dropoffLng },
      status: "requested",
    });

    res.json({
      success: true,
      ride,
      nearbyDrivers, // send list of all 5 nearest drivers (optional)
    });

  } catch (err) {
    console.error("RequestRide Error:", err);
    res.status(500).json({ error: "Server error" });
  }
};


// Update ride status
export const updateRideStatus = async (req, res) => {
  try {
    const { rideId, status } = req.body;

    const ride = await Ride.findByIdAndUpdate(
      rideId,
      { status },
      { new: true }
    );

    res.json({ success: true, ride });
  } catch (err) {
    console.error("UpdateRideStatus Error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// Get user rides
export const getRides = async (req, res) => {
  try {
    const rides = await Ride.find({ rider: req.user.id }).populate("driver", "name vehicleNumber vehicleType");
    res.json({ success: true, rides });
  } catch (err) {
    console.error("GetRides Error:", err);
    res.status(500).json({ error: "Server error" });
  }
};
//Accept ride 

export const acceptRide = async (req, res) => {
  try {
    const { rideId } = req.body;
    const driverId = req.user.id;

    const ride = await Ride.findById(rideId);

    if (!ride) return res.status(404).json({ error: "Ride not found" });

    // Already accepted?
    if (ride.status !== "requested") {
      return res.status(400).json({ error: "Ride already taken" });
    }

    // Lock the ride
    ride.status = "accepted";
    ride.driver = driverId;
    await ride.save();

    // Notify rider
    req.io.to(`rider_${ride.rider}`).emit("ride-accepted", {
      rideId,
      driverId,
    });

    // Notify all drivers that ride is no longer available
    req.io.emit("ride-removed", rideId);

    res.json({ success: true, ride });

  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Server error" });
  }
};


// Fetch all rides for a specific rider
export const getRiderRides = async (req, res) => {
  try {
    const riderId = req.params.id;

    const rides = await Ride.find({ rider: riderId }).sort({ createdAt: -1 });

    res.json({ success: true, rides });
  } catch (err) {
    console.error("getRiderRides Error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// Fetch all rides for a specific driver
export const getDriverRides = async (req, res) => {
  try {
    const driverId = req.params.id;

    const rides = await Ride.find({ driver: driverId }).sort({ createdAt: -1 });

    res.json({ success: true, rides });
  } catch (err) {
    console.error("getDriverRides Error:", err);
    res.status(500).json({ error: "Server error" });
  }
};