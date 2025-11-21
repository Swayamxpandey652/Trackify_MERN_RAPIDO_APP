// src/components/RiderDashboard.jsx
"use client";
import { useSocket } from "../context/SocketContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";  // ⭐ NEW
import { useEffect, useState } from "react";

const RiderDashboard = () => {
  const socket = useSocket();
  const { user } = useAuth();       // ⭐ NEW
  const riderId = user?._id;        // ⭐ NEW (replace prop)

  const [driverLocations, setDriverLocations] = useState([]);
  const [rideStatus, setRideStatus] = useState("");

  // -------------------------------
  // EXISTING Effect → Join rider room
  // -------------------------------
  useEffect(() => {
    if (!socket || !riderId) return;

    socket.emit("join-rider", riderId);

    socket.on("driver-location", ({ driverId, lat, lng }) => {
      setDriverLocations((prev) => {
        const others = prev.filter((d) => d.driverId !== driverId);
        return [...others, { driverId, lat, lng }];
      });
    });

    return () => {
      socket.off("driver-location");
    };
  }, [socket, riderId]);

  // Example in useEffect in RiderDashboard.jsx
useEffect(() => {
  const fetchRiderData = async () => {
    if (!riderId) return;
    try {
      const res = await axios.get(`/api/rider/${riderId}/rides`);
      setRides(res.data.rides); // existing rides for the rider
    } catch (err) {
      console.error(err);
    }
  };
  fetchRiderData();
}, [riderId]);


  // -------------------------------
  // EXISTING Effect → Ride accepted
  // -------------------------------
  useEffect(() => {
    if (!socket) return;

    socket.on("ride-accepted", ({ rideId, driverId }) => {
      console.log("Your ride was accepted by driver:", driverId);
    });

    return () => socket.off("ride-accepted");
  }, [socket]);

  // --------------------------------------------------------
  // ⭐ NEW EFFECT (Step 7) → Real-Time Driver Location + Status
  // --------------------------------------------------------
  useEffect(() => {
    if (!socket) return;

    socket.on("driver-live-location", ({ driverId, lat, lng }) => {
      console.log("Live driver movement:", driverId, lat, lng);

      setDriverLocations((prev) => {
        const others = prev.filter((d) => d.driverId !== driverId);
        return [...others, { driverId, lat, lng }];
      });
    });

    socket.on("ride-status-updated", ({ rideId, status }) => {
      console.log("Ride status changed:", status);
      setRideStatus(status);
    });

    return () => {
      socket.off("driver-live-location");
      socket.off("ride-status-updated");
    };
  }, [socket]);

  // -------------------------------
  // Request Ride (as before)
  // -------------------------------
  const requestRide = async (pickup) => {
    const rideId = await axios.post("/api/ride/request", {
    riderId: user._id,
    pickup,
  });
    socket.emit("ride-request", { rideId, riderId, pickup });
  };

  return (
    <div>
      <h1>Rider Dashboard</h1>

      <h3>Rider ID: {riderId}</h3> {/* Optional: show logged-in rider */}

      <button onClick={() => requestRide({ lat: 26.9124, lng: 75.7873 })}>
        Request Ride
      </button>

      <h3>Ride Status: {rideStatus}</h3>

      <ul>
        {driverLocations.map((d) => (
          <li key={d.driverId}>
            Driver {d.driverId}: ({d.lat}, {d.lng})
          </li>
        ))}
      </ul>
    </div>
  );
};

export default RiderDashboard;
