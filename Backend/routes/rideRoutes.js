import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { requestRide, updateRideStatus, getRides, getRiderRides, getDriverRides } from "../controllers/rideController.js";

const router = express.Router();

router.post("/request", protect, requestRide);
router.post("/update-status", protect, updateRideStatus);
router.get("/", protect, getRides);
router.get("/rider/:id/rides", getRiderRides);

// Fetch rides for a driver
router.get("/driver/:id/rides", getDriverRides);
export default router;
