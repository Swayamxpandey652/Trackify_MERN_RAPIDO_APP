import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  requestRide,
  updateRideStatus,
  getRides,
  getRiderRides,
  getDriverRides,
  driverRespondRide,
  cancelRide,
  startRide,
  completeRide
} from "../controllers/rideController.js";

const router = express.Router();

// Rider requests a ride
router.post("/request", protect, requestRide);

// Update ride status manually
router.post("/update-status", protect, updateRideStatus);

// Rider cancels a ride
router.post("/cancel", protect, cancelRide);

// Driver starts a ride
router.post("/start", protect, startRide);

// Driver completes a ride
router.post("/complete", protect, completeRide);

// Get rides for logged-in rider
router.get("/", protect, getRides);

// Get all rides for a specific rider
router.get("/rider/:id/rides", getRiderRides);

// Get all rides for a specific driver
router.get("/driver/:id/rides", getDriverRides);

// Driver responds to a ride (accept/reject)
router.post("/respond", protect, driverRespondRide);

export default router;
