import "dotenv/config";
import http from "http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import app from "./app.js";
import { createRedisClient } from "./config/redis.js";
// NOTE: You will likely need a library like jsonwebtoken for JWT validation
// If you use JWTs, ensure you have imported or required it here.
// import jwt from 'jsonwebtoken'; 

// IMPORT MODELS
import Ride from "./models/Ride.js";

// ------------ ENV -----------
const PORT = process.env.PORT || 5000;

// ------------ DB CONNECT ----
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log("MongoDB Error:", err));

let redisClient;
const initRedis = async () => {
  redisClient = await createRedisClient(process.env.REDIS_URL || "redis://127.0.0.1:6379");
};
initRedis();

// ----------------------------------------------------
// ------------ HTTP + SOCKET SERVER + CORS FIX -------
// ----------------------------------------------------
const server = http.createServer(app);

// Use the proper Socket.IO Server setup with CORS configuration
const io = new Server(server, { // Using 'new Server' requires importing Server (already done)
    cors: {
        // FIX 1: Set the origin to allow connections from your frontend (Vite default is 5173)
        origin: "http://localhost:5173", 
        methods: ["GET", "POST"],
        credentials: true // Important for cookie/auth handling
    }
});

// Attach io globally so controllers can use it
app.use((req, res, next) => {
  req.io = io;
  next();
});

// ----------------------------------------------------
// ------------ SOCKET.IO AUTHENTICATION MIDDLEWARE ---
// ----------------------------------------------------

io.use((socket, next) => {
    // FIX 2: Handle the token sent from the client's SocketContext
    const tokenWithBearer = socket.handshake.auth.token;

    if (!tokenWithBearer) {
        console.warn("Socket connection rejected: No token provided.");
        return next(new Error("Authentication error: Token required."));
    }

    // Token is typically "Bearer XXXX", so we extract XXXX
    const token = tokenWithBearer.split(' ')[1]; 
    
    // ⚠️ IMPORTANT: Implement your actual JWT validation here!
    try {
        // --- START: Replace this placeholder validation with your real JWT logic ---
        // const decoded = jwt.verify(token, process.env.JWT_SECRET); 
        
        // Mocking validation success for demonstration:
        const decoded = { userId: '123mockUser' }; 
        // --- END: Replace this placeholder validation with your real JWT logic ---

        // Attach user info to socket
        socket.userId = decoded.userId; 
        
        next(); // Allow connection
    } catch (err) {
        console.warn("Socket connection rejected: Invalid token.", err.message);
        return next(new Error("Authentication error: Invalid token."));
    }
});


// ----------------------------------------------------
// ------------ SOCKET.IO EVENT HANDLERS --------------
// ----------------------------------------------------
io.on("connection", (socket) => {
  console.log(`🔥 Socket connected: ${socket.id} (User ID: ${socket.userId})`); // userId is now available

  // ---------------------- DRIVER JOIN ----------------------
  socket.on("join-driver", (driverId) => {
    socket.join(`driver-${driverId}`);
    console.log(`Driver Joined: Room driver-${driverId}`);
  });

  // Optional: all drivers room
  socket.on("join-driver-room", () => {
    socket.join("driver-room");
  });

  // ----------------------- RIDER JOIN ----------------------
  socket.on("join-rider", (riderId) => {
    socket.join(`rider-${riderId}`);
    console.log(`Rider Joined: Room rider-${riderId}`);
  });

  // ---------------- DRIVER LIVE LOCATION -------------------
  socket.on("driver-location-update", async ({ driverId, rideId, lat, lng }) => {
    console.log("Driver Live Location:", driverId, lat, lng);

    if (!redisClient) return;

    // Save location in Redis
    await redisClient.sendCommand([
      "GEOADD",
      "drivers",
      lng.toString(),
      lat.toString(),
      driverId,
    ]);

    // Update ride doc
    if (rideId) {
      await Ride.findByIdAndUpdate(rideId, {
        driverLocation: { lat, lng },
      });
    }

    // Emit to rider in this ride
    io.to(`rider_${rideId}`).emit("driver-live-location", {
      driverId,
      lat,
      lng,
    });
  });

  // ---------------- RIDER LIVE LOCATION --------------------
  socket.on("rider-location", (coords) => {
    socket.broadcast.emit("rider-location", coords);
  });

  // ---------------- RIDE REQUEST ---------------------------
  socket.on("ride-request", async ({ rideId, riderId, pickup }) => {
    if (!redisClient) return;

    // Find nearby 5km drivers
    const nearbyDrivers = await redisClient.sendCommand([
      "GEORADIUS",
      "drivers",
      pickup.lng.toString(),
      pickup.lat.toString(),
      "5000",
      "m",
    ]);

    console.log("Nearby drivers:", nearbyDrivers);

    nearbyDrivers.forEach((driverId) => {
      io.to(`driver-${driverId}`).emit("new-ride-request", {
        rideId,
        riderId,
        pickup,
      });
    });
  });

  // ---------------- RIDE STATUS ----------------------------
  socket.on("ride-status-update", ({ rideId, status, riderId, driverId }) => {
    io.to(`rider-${riderId}`).emit("ride-status", { rideId, status });
    io.to(`driver-${driverId}`).emit("ride-status", { rideId, status });
  });

  // ---------------- DISCONNECT -----------------------------
  socket.on("disconnect", () => {
    console.log("❌ Socket disconnected:", socket.id);
  });
});

// ----------------------------------------------------
// ------------ START SERVER -------------
// ----------------------------------------------------
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});