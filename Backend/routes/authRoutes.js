import express from "express";
import { register, login, logout, getMe , verifyOtp, requestOtp} from "../controllers/authController.js";
import {protect} from "../middleware/authMiddleware.js";

const router = express.Router();

// ----------------------
// Password-based auth
// ----------------------

// Register new user (rider or driver)
router.post("/register", register);

// Login with email/password
router.post("/login", login);

// Get logged-in user info
router.get("/me", protect, getMe);

// ----------------------
// OTP-based auth
// ----------------------

// Request OTP (send to phone/email)
router.post("/otp/request", requestOtp);

// Verify OTP
router.post("/otp/verify", verifyOtp);


router.post("/logout", logout);
export default router;
