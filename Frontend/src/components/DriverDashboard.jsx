"use client";
import { useSocket } from "../context/SocketContext";
import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const DriverDashboard = () => {
  const { socket } = useSocket();
  const { user } = useAuth();
  const driverId = user?._id;

  // ------------------ STATE ------------------
  const [driver, setDriver] = useState(null);
  const [driverLat, setDriverLat] = useState(null);
  const [driverLng, setDriverLng] = useState(null);
  const [availableRides, setAvailableRides] = useState([]);
  const [currentRideId, setCurrentRideId] = useState(null);

  // ------------------ GET DRIVER FROM LOCAL STORAGE ------------------
  useEffect(() => {
    try {
      const raw = localStorage.getItem("driver");

      if (!raw || raw === "undefined" || raw === "null") return;

      const parsed = JSON.parse(raw);
      setDriver(parsed);
    } catch (e) {
      console.error("Invalid driver JSON → clearing localStorage", e);
      localStorage.removeItem("driver");
    }
  }, []);

  // ------------------ SOCKET JOIN ROOM ------------------
  useEffect(() => {
    if (!socket || !driverId) return;

    socket.emit("join-driver", driverId);
    socket.emit("join-driver-room");

    socket.on("new-ride-request", (ride) => {
      setAvailableRides((prev) => [...prev, ride]);
    });

    return () => {
      socket.off("new-ride-request");
    };
  }, [socket, driverId]);

  // ------------------ FETCH DRIVER RIDES ------------------
  useEffect(() => {
    const fetchData = async () => {
      if (!driverId) return;

      try {
        const res = await axios.get(`/api/driver/${driverId}/rides`);
        setAvailableRides(res.data.availableRides || []);
        setCurrentRideId(res.data.currentRide || null);
      } catch (err) {
        console.error(err);
      }
    };

    fetchData();
  }, [driverId]);

  // ------------------ REMOVE RIDE WHEN TAKEN BY OTHERS ------------------
  useEffect(() => {
    if (!socket) return;

    socket.on("ride-removed", (rideId) => {
      setAvailableRides((prev) => prev.filter((r) => r.rideId !== rideId));
    });

    return () => socket.off("ride-removed");
  }, [socket]);

  // ------------------ AUTO DRIVER LOCATION UPDATES ------------------
  const updateLocation = (lat, lng) => {
    if (!socket || !driverId || !currentRideId) return;

    socket.emit("driver-location-update", {
      driverId,
      rideId: currentRideId,
      lat,
      lng,
    });
  };

  useEffect(() => {
    if (!currentRideId) return;

    const interval = setInterval(() => {
      updateLocation(driverLat, driverLng);
    }, 5000);

    return () => clearInterval(interval);
  }, [driverLat, driverLng, currentRideId]);

  // ------------------ DRIVER ACCEPTS RIDE ------------------
  const acceptRide = (rideId) => {
    if (!socket || !driverId) return;

    socket.emit("accept-ride", { rideId, driverId });
    setCurrentRideId(rideId);
    setAvailableRides((prev) => prev.filter((r) => r.rideId !== rideId));
  };

  // ------------------ UPDATE RIDE STATUS ------------------
  const updateStatus = async (status) => {
    if (!currentRideId) return;

    try {
      await axios.post("/api/ride/update-status", {
        rideId: currentRideId,
        status,
      });
    } catch (err) {
      console.error("Status update error:", err);
    }
  };

  // ------------------ SAFE RENDER ------------------
  if (!driver) return <p>Loading driver data...</p>;

  return (
    <div>
      <h1>Driver Dashboard</h1>

      <h3>Driver ID: {driverId}</h3>

      <div>
        <h1>Welcome, {driver.name}</h1>
        <p>Phone: {driver.phone}</p>
        <p>
          Vehicle: {driver.vehicleType} - {driver.vehicleNumber}
        </p>
        <p>Availability: {driver.isAvailable ? "Online" : "Offline"}</p>
      </div>

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
