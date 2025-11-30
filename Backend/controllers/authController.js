import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { createRedisClient } from "../config/redis.js";
import Driver from "../models/Driver.js"; // <-- import your driver model



let redisClient;
const initRedis = async () => {
  if (!redisClient) redisClient = await createRedisClient();
  return redisClient;
};


// Helper: generate JWT
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};



export const register = async (req, res) => {
  try {
    const { name, email, phone, password, role, vehicleNumber, vehicleType } = req.body;

    if (!name || !email || !phone || !password || !role) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Check if user exists
    const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
    if (existingUser) return res.status(400).json({ error: "User already exists" });

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      name,
      email,
      phone,
      password: hashedPassword,
      role
    });

    // If the user is a driver, create driver document as well
    if (role === "driver") {
      if (!vehicleNumber || !vehicleType) {
        return res.status(400).json({ error: "Vehicle number and type are required for drivers" });
      }

      const driver = await Driver.create({
        name,
        phone,
        password: hashedPassword,
        vehicleNumber,
        vehicleType
      });
    // Generate token
    const token = generateToken(user._id, user.role);

    res.status(201).json({
      success: true,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      token
    });
  }
}catch (err) {
    console.error("Register Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ------------------- LOGIN -------------------
export const login = async (req, res) => {
  try {
    const { phone, password } = req.body;

    const user = await User.findOne({ phone });
    if (!user) return res.status(404).json({ message: "User not found" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: "Invalid password" });

    const token = generateToken(user);

    res.json({
      message: "Login successful",
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        role: user.role,
      },
      token,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};


// ----------------------
// Request OTP
// ----------------------
export const requestOtp = async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ error: "Phone required" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
    const redis = await initRedis();

    await redis.setEx(`otp_${phone}`, 300, otp); // OTP valid 5 min

    // TODO: Send OTP via SMS service like Twilio
    console.log(`OTP for ${phone}: ${otp}`);

    res.json({ success: true, message: "OTP sent" });
  } catch (err) {
    console.error("requestOtp Error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// ----------------------
// Verify OTP
// ----------------------
export const verifyOtp = async (req, res) => {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp) return res.status(400).json({ error: "Phone and OTP required" });

    const redis = await initRedis();
    const storedOtp = await redis.get(`otp_${phone}`);

    if (!storedOtp || storedOtp !== otp) return res.status(400).json({ error: "Invalid or expired OTP" });

    // Find or create user
    let user = await User.findOne({ phone });
    if (!user) {
      user = await User.create({ phone, role: "rider", name: "New User" });
    }

    // Generate JWT
    const token = generateToken(user._id, user.role);

    res.json({ success: true, user: { id: user._id, role: user.role, phone: user.phone }, token });
  } catch (err) {
    console.error("verifyOtp Error:", err);
    res.status(500).json({ error: "Server error" });
  }
};


// ------------------- LOGOUT -------------------
export const logout = async (req, res) => {
  // With JWT stateless auth, logout is handled on client side (remove token)
  // Optionally, you can implement token blacklisting in Redis
  res.json({ message: "Logout successful, remove token from client" });
};

// ------------------- GET ME -------------------
export const getMe = async (req, res) => {
  try {
    // req.user is added by authMiddleware
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
