// src/components/RiderDashboard.jsx
"use client";

import React, { useEffect, useState } from "react";
import { useSocket } from "../context/SocketContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useNavigate } from "react-router-dom";
import MyRides from "./MyRides.jsx";
import Profile from "./Profile.jsx";

export default function RiderDashboard() {
  const { socket } = useSocket();
  const { user } = useAuth();
  const riderId = user?._id;
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("bookRide");
  const [driverLocations, setDriverLocations] = useState([]);

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

  // navigate to /rider/map when Book Ride is clicked
  const handleBookRideClick = () => {
    navigate("/rider/map", { state: { driverLocations } });
  };

  return (
    <div className="h-screen w-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-yellow-100">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Good Morning,</h2>
          <h1 className="text-2xl font-bold text-yellow-600">
            {user?.name || "Rider"}
          </h1>
        </div>

        <img className="w-12 h-12 rounded-full border-2 border-yellow-400" />
      </div>

      {/* Tabs */}
      <div className="flex justify-around bg-white shadow-md">
        <button
          className={`flex-1 p-3 font-semibold ${
            activeTab === "bookRide"
              ? "text-yellow-600 border-b-2 border-yellow-500"
              : "text-gray-500"
          }`}
          onClick={handleBookRideClick}
        >
          Book Ride
        </button>

        <button
          className={`flex-1 p-3 font-semibold ${
            activeTab === "myRides"
              ? "text-yellow-600 border-b-2 border-yellow-500"
              : "text-gray-500"
          }`}
          onClick={() => setActiveTab("myRides")}
        >
          My Rides
        </button>

        <button
          className={`flex-1 p-3 font-semibold ${
            activeTab === "profile"
              ? "text-yellow-600 border-b-2 border-yellow-500"
              : "text-gray-500"
          }`}
          onClick={() => setActiveTab("profile")}
        >
          Profile
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-auto">
        {activeTab === "myRides" && <MyRides />}
        {activeTab === "profile" && <Profile />}
        {/* NOTE: Book Ride is now handled via navigation */}
      </div>
    </div>
  );
}
