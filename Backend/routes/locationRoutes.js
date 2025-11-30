import express from "express";
import { ipGeolocate } from "../controllers/locationController.js";
import { searchLocation, reverseGeocode } from "../controllers/locationController.js";

const router = express.Router();

router.get("/geolocate/ip", ipGeolocate);

router.get("/search-location", searchLocation);

router.get("/reverse-geocode", reverseGeocode);

export default router;
