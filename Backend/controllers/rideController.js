import Ride from "../models/Ride.js";
import Driver from "../models/Driver.js";
import { createRedisClient } from "../config/redis.js";

let redisClient;

// Initialize Redis safely
const initRedis = async () => {
  if (!redisClient) redisClient = await createRedisClient();
  return redisClient;
};

// -----------------------------
// Request a ride
// -----------------------------
export const requestRide = async (req, res) => {
  try {
    const { pickupLat, pickupLng, dropoffLat, dropoffLng } = req.body;

    if (!pickupLat || !pickupLng || !dropoffLat || !dropoffLng) {
      return res.status(400).json({ error: "Pickup & dropoff coordinates required" });
    }

    const redis = await initRedis();

    // Find nearby drivers (5km radius)
    const nearbyDrivers = await redis.sendCommand([
      "GEOSEARCH",
      "drivers",
      "FROMLONLAT",
      pickupLng.toString(),
      pickupLat.toString(),
      "BYRADIUS",
      "5000",
      "m",
      "ASC",
      "COUNT",
      "5"
    ]);

    if (!nearbyDrivers.length) {
      return res.status(404).json({ error: "No nearby drivers available" });
    }

    // Assign closest driver as placeholder
    const assignedDriverId = nearbyDrivers[0];

    // Create ride
    const ride = await Ride.create({
      rider: req.user.id,
      driver: assignedDriverId,
      pickup: { lat: pickupLat, lng: pickupLng },
      dropoff: { lat: dropoffLat, lng: dropoffLng },
      status: "requested",
    });

    // Notify nearby drivers about the new ride
    nearbyDrivers.forEach(driverId => {
      req.io.to(`driver_${driverId}`).emit("new-ride-request", {
        rideId: ride._id,
        pickup: { lat: pickupLat, lng: pickupLng },
        dropoff: { lat: dropoffLat, lng: dropoffLng },
        riderId: req.user.id,
      });
    });

    res.json({ success: true, ride, nearbyDrivers });

  } catch (err) {
    console.error("RequestRide Error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// -----------------------------
// Driver responds to ride (accept/reject)
// -----------------------------
export const driverRespondRide = async (req, res) => {
  try {
    const { rideId, response } = req.body; // 'accept' | 'reject'
    const driverId = req.user.id;

    const ride = await Ride.findById(rideId);
    if (!ride) return res.status(404).json({ error: "Ride not found" });

    if (response === "accept") {
      // Atomic update to prevent race conditions
      const updatedRide = await Ride.findOneAndUpdate(
        { _id: rideId, status: "requested" },
        { status: "accepted", driver: driverId },
        { new: true }
      );
      if (!updatedRide) return res.status(400).json({ error: "Ride already taken" });

      // Notify rider
      req.io.to(`rider_${updatedRide.rider}`).emit("ride-accepted", {
        rideId: updatedRide._id,
        driverId
      });

      // Notify other drivers to remove ride
      req.io.emit("ride-removed", rideId);

      return res.json({ success: true, ride: updatedRide });
    }

    if (response === "reject") {
      // Optionally log rejection for analytics
      req.io.to(`rider_${ride.rider}`).emit("ride-rejected", { rideId, driverId });
      return res.json({ success: true, message: "Ride rejected" });
    }

    res.status(400).json({ error: "Invalid response" });

  } catch (err) {
    console.error("DriverRespondRide Error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

//update ride ststus

export const updateRideStatus = async (req, res) => {
  try {
    const { rideId, status } = req.body;
    const ride = await Ride.findByIdAndUpdate(rideId, { status }, { new: true });
    res.json({ success: true, ride });
  } catch (err) {
    console.error("UpdateRideStatus Error:", err);
    res.status(500).json({ error: "Server error" });
  }
};


// -----------------------------
// Rider cancels ride
// -----------------------------
export const cancelRide = async (req, res) => {
  try {
    const { rideId } = req.body;
    const ride = await Ride.findById(rideId);
    if (!ride) return res.status(404).json({ error: "Ride not found" });

    // Only allow rider to cancel if ride is not completed or cancelled
    if (ride.status === "completed" || ride.status === "cancelled") {
      return res.status(400).json({ error: "Cannot cancel this ride" });
    }

    ride.status = "cancelled";
    await ride.save();

    // Notify driver
    req.io.to(`driver_${ride.driver}`).emit("ride-cancelled", { rideId });

    // Notify other drivers to remove ride from available list
    req.io.emit("ride-removed", rideId);

    res.json({ success: true, ride });

  } catch (err) {
    console.error("CancelRide Error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// -----------------------------
// Driver starts ride
// -----------------------------
export const startRide = async (req, res) => {
  try {
    const { rideId } = req.body;
    const ride = await Ride.findById(rideId);
    if (!ride) return res.status(404).json({ error: "Ride not found" });

    if (ride.status !== "accepted") {
      return res.status(400).json({ error: "Ride cannot be started" });
    }

    ride.status = "onTrip";
    await ride.save();

    // Notify rider
    req.io.to(`rider_${ride.rider}`).emit("ride-started", { rideId });

    res.json({ success: true, ride });

  } catch (err) {
    console.error("StartRide Error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// -----------------------------
// Driver completes ride
// -----------------------------
export const completeRide = async (req, res) => {
  try {
    const { rideId } = req.body;
    const ride = await Ride.findById(rideId);
    if (!ride) return res.status(404).json({ error: "Ride not found" });

    if (ride.status !== "onTrip") {
      return res.status(400).json({ error: "Ride cannot be completed" });
    }

    ride.status = "completed";
    await ride.save();

    // Notify rider
    req.io.to(`rider_${ride.rider}`).emit("ride-completed", { rideId });

    res.json({ success: true, ride });

  } catch (err) {
    console.error("CompleteRide Error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// -----------------------------
// Get rides for logged-in rider
// -----------------------------
export const getRides = async (req, res) => {
  try {
    const rides = await Ride.find({ rider: req.user.id })
      .populate("driver", "name vehicleNumber vehicleType");
    res.json({ success: true, rides });
  } catch (err) {
    console.error("GetRides Error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// -----------------------------
// Get all rides for a specific rider
// -----------------------------
export const getRiderRides = async (req, res) => {
  try {
    const rides = await Ride.find({ rider: req.params.id }).sort({ createdAt: -1 });
    res.json({ success: true, rides });
  } catch (err) {
    console.error("getRiderRides Error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// -----------------------------
// Get all rides for a specific driver
// -----------------------------
export const getDriverRides = async (req, res) => {
  try {
    const rides = await Ride.find({ driver: req.params.id }).sort({ createdAt: -1 });
    res.json({ success: true, rides });
  } catch (err) {
    console.error("getDriverRides Error:", err);
    res.status(500).json({ error: "Server error" });
  }
};
