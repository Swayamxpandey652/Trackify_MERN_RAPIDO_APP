import express from "express";
import {
  updateLocation,
  toggleAvailability,
  getNearbyDrivers,
} from "../controllers/driverController.js";

import {
  driverRespondRide
} from "../controllers/rideController.js";  // (new)

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// ----------------------------
// Driver updates live location
// ----------------------------
router.post("/update-location", protect, updateLocation);

// ----------------------------
// Driver goes online/offline
// ----------------------------
router.post("/toggle-availability", protect, toggleAvailability);

// ----------------------------
// Rider requests nearby drivers
// ----------------------------
router.get("/nearby", getNearbyDrivers);

// ----------------------------
// Driver responds to a ride request (ACCEPT / REJECT)
// ----------------------------
router.post("/respond", protect, driverRespondRide);

export default router;
