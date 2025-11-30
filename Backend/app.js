import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes.js";
import driverRoutes from "./routes/driverRoutes.js";
import rideRoutes from "./routes/rideRoutes.js";
import locationRoutes from "./routes/locationRoutes.js";

dotenv.config();

const app = express();

// Middleware
app.use(cors({ origin: "*" })); // Allow requests from any origin
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/driver", driverRoutes);
app.use("/api/ride", rideRoutes);
app.use("/api", locationRoutes);

// Test route
app.post("/api/driver/test", (req, res) => {
  res.send("Driver route works!");
});

// Root route
app.get("/", (req, res) => {
  res.send("Trackify Backend Running 🚀");
});

// Export the app
export default app;
