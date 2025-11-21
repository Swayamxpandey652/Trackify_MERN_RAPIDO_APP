import "dotenv/config";
import http from "http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import app from "./app.js";
import  {createRedisClient}  from "./config/redis.js";

// Environment
const PORT = process.env.PORT || 5000;

// Connect MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log("MongoDB Error:", err));

// Connect Redis
let redisClient;
const initRedis = async () => {
  redisClient = await createRedisClient(process.env.REDIS_URL || "redis://127.0.0.1:6379");
};
initRedis();
// Create HTTP server + Socket.IO
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "http://localhost:5173", methods: ["GET", "POST"] },
});

app.use((req, res, next) => {
  req.io = io;   // attach io globally
  next();
});


// -----------------------------
// Socket.IO Events
// -----------------------------
io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  // --- Driver joins ---
  socket.on("join-driver", (driverId) => {
    socket.join(`driver-${driverId}`);
    console.log(`Driver ${driverId} joined room driver-${driverId}`);
  });

 // Optional: common driver room
  socket.on("join-driver-room", () => {
    socket.join("driver-room");
    console.log(`Driver ${socket.id} joined driver-room`);
  });


  // --- Rider joins ---
  socket.on("join-rider", (riderId) => {
    socket.join(`rider-${riderId}`);
    console.log(`Rider ${riderId} joined room rider-${riderId}`);
  });

  // --- Driver location update ---
  socket.on("driver-location-update", async ({ driverId, rideId, lat, lng }) => {
    console.log("Live location:", driverId, lat, lng);

    // 1️⃣ Update ride document with driver location
    if (rideId) {
      await Ride.findByIdAndUpdate(rideId, { driverLocation: { lat, lng } });
    }
    
    if (!redisClient) return;

    // Save location to Redis GEO
    await redisClient.sendCommand([
      "GEOADD",
      "drivers",
      lng.toString(),
      lat.toString(),
      driverId
    ]);


    
      // 2️⃣ Emit location to rider (if tracking this ride)
    io.to(`rider_${rideId}`).emit("driver-live-location", { driverId, lat, lng });
  });

  

  // --- Rider requests ride ---
  socket.on("ride-request", async ({ rideId, riderId, pickup }) => {
    if (!redisClient) return;

    // Find nearby drivers within 5km
    const nearbyDrivers = await redisClient.sendCommand([
      "GEORADIUS",
      "drivers",
      pickup.lng.toString(),
      pickup.lat.toString(),
      "5000",
      "m"
    ]);

    // Notify all nearby drivers
    nearbyDrivers.forEach((driverId) => {
      io.to(`driver-${driverId}`).emit("new-ride-request", { rideId, riderId, pickup });
    });
  });

  // ⭐ Broadcast ride request to all drivers in driver-room
  socket.on("ride-request", (data) => {
    io.to("driver-room").emit("new-ride-request", data);
  });

  // --- Ride status update ---
  socket.on("ride-status-update", ({ rideId, status, riderId, driverId }) => {
    // Notify both rider and driver
    io.to(`rider-${riderId}`).emit("ride-status", { rideId, status });
    io.to(`driver-${driverId}`).emit("ride-status", { rideId, status });
  });

  // Disconnect
  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
  });
});

// -----------------------------
// Start Server
// -----------------------------
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});