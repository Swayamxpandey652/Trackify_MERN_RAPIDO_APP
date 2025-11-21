import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes.js";
import driverRoutes from "./routes/driverRoutes.js";
import rideRoutes from "./routes/rideRoutes.js";



dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);

app.use("/api/driver", driverRoutes);

app.use("/api/ride", rideRoutes);



app.get("/", (req, res) => {
  res.send("Trackify Backend Running 🚀");
});

export default app;
app.post("/api/driver/test", (req, res) => {
  res.send("Driver route works!");
});
