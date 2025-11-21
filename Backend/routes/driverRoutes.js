import express from "express";
import {
  updateLocation,
  toggleAvailability,
  getNearbyDrivers,
} from "../controllers/driverController.js";
import {protect} from "../middleware/authMiddleware.js";

const router = express.Router();

// Driver updates their location
router.post("/update-location", protect, updateLocation);

// Driver goes online/offline
router.post("/toggle-availability", protect, toggleAvailability);

// Rider fetches nearby drivers
router.get("/nearby", getNearbyDrivers);

export default router;
