// src/components/DriverDashboard.jsx
"use client";
import { useSocket } from "../context/SocketContext";
import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";   // ⭐ ADDED

const DriverDashboard = () => {
  const socket = useSocket();
  const { user } = useAuth();        // ⭐ ADDED 
  const driverId = user?._id;        // ⭐ ADDED

  const [rides, setRides] = useState([]);
  const [availableRides, setAvailableRides] = useState([]);
  const [currentRideId, setCurrentRideId] = useState(null);

  // JOIN DRIVER ROOM
  useEffect(() => {
    if (!socket || !driverId) return;

    socket.emit("join-driver", driverId);   // ⭐ UPDATED
    socket.emit("join-driver-room");          // common room

    socket.on("new-ride-request", (ride) => {
      setAvailableRides((prev) => [...prev, ride]);
    });

    return () => {
      socket.off("new-ride-request");
    };
  }, [socket, driverId]);

  // DriverDashboard.jsx
useEffect(() => {
  const fetchDriverData = async () => {
    if (!driverId) return;
    try {
      const res = await axios.get(`/api/driver/${driverId}/rides`);
      setAvailableRides(res.data.availableRides);
      setCurrentRide(res.data.currentRide); // ongoing ride if any
    } catch (err) {
      console.error(err);
    }
  };
  fetchDriverData();
}, [driverId]);


  // REMOVE RIDE WHEN TAKEN BY ANOTHER DRIVER
  useEffect(() => {
    if (!socket) return;

    socket.on("ride-removed", (rideId) => {
      setAvailableRides((prev) => prev.filter((r) => r.rideId !== rideId));
    });

    return () => socket.off("ride-removed");
  }, [socket]);

  // UPDATE RIDE STATUS
  const updateStatus = async (status) => {
    if (!currentRideId) return alert("No ride selected!");

    try {
      await axios.post("/api/ride/update-status", {
        rideId: currentRideId,
        status,
      });
    } catch (err) {
      console.error("Status update error:", err);
    }
  };

  // DRIVER ACCEPTS A RIDE
  const acceptRide = (rideId) => {
    if (!socket || !driverId) return;

    socket.emit("accept-ride", { rideId, driverId });

    setCurrentRideId(rideId);
    setAvailableRides((prev) => prev.filter((r) => r.rideId !== rideId));
  };

  // Live location update function
const updateLocation = (lat, lng) => {
  if (!socket || !driverId || !currentRideId) return;

  socket.emit("driver-location-update", {
    driverId,
    rideId: currentRideId, // send rideId so rider receives updates
    lat,
    lng
  });
};

// Example: update every 5 seconds (assuming driverLat and driverLng are state variables)
useEffect(() => {
  if (!currentRideId) return; // only update location when a ride is active

  const interval = setInterval(() => {
    updateLocation(driverLat, driverLng); // driverLat/driverLng from GPS or map
  }, 5000);

  return () => clearInterval(interval);
}, [driverLat, driverLng, currentRideId]);


  return (
    <div>
      <h1>Driver Dashboard</h1>

      <h3>Driver ID: {driverId}</h3> {/* Optional */}

      <button onClick={() => updateLocation(26.9124, 75.7873)}>
        Update Location
      </button>

      <h2>Available Rides</h2>
      <ul>
        {availableRides.map((ride) => (
          <li key={ride.rideId}>
            Ride from rider {ride.riderId}
            <button onClick={() => acceptRide(ride.rideId)}>Accept</button>
          </li>
        ))}
      </ul>

      {currentRideId && (
        <>
          <h2>Update Ride Status</h2>
          <button onClick={() => updateStatus("arrived")}>Arrived</button>
          <button onClick={() => updateStatus("started")}>Started</button>
          <button onClick={() => updateStatus("completed")}>Completed</button>
        </>
      )}
    </div>
  );
};

export default DriverDashboard;
