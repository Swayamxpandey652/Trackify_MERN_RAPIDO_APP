import React, { useEffect, useRef, useState } from "react";
import MapComponent from "../components/MapComponent";
import { createSmoothMarker, addRouteLayer, fitRouteBounds } from "../components/routeHelper.jsx";
import { getMapTilerDirectionsUrl } from "../utils/maptiler";
import TurnByTurn from "../components/TurnByTurn";
import { useSocket } from "../context/SocketContext";
import { startCheckout } from "../utils/payments";
import * as turf from "@turf/turf";

export default function DriverMap() {
  const socket = useSocket();
  const userId = socket?._id || "driver-demo";

  const [map, setMap] = useState(null);
  const [pos, setPos] = useState(null);
  const [online, setOnline] = useState(false);
  const [incoming, setIncoming] = useState(null);
  const [routeGeo, setRouteGeo] = useState(null);
  const [steps, setSteps] = useState([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [etaText, setEtaText] = useState(null);
  const [distanceText, setDistanceText] = useState(null);

  const markerRef = useRef(null);

  // ---------------------- SOCKET ----------------------
  useEffect(() => {
    if (!socket) return;

    socket.on("connect", () => {
      console.log("Driver socket connected:", socket.id);
      socket.emit("join-driver", userId);
    });

    socket.on("new-ride-request", setIncoming);
    socket.on("ride-removed", (rideId) => {
      if (incoming?.rideId === rideId) setIncoming(null);
    });

    return () => {
      socket.off("new-ride-request");
      socket.off("ride-removed");
    };
  }, [socket, userId, incoming]);

  // ---------------------- GPS LIVE ----------------------
  useEffect(() => {
    let watchId = null;
    if (navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        (p) => {
          const coords = { lat: p.coords.latitude, lng: p.coords.longitude };
          setPos(coords);
          if (online && socket?.connected) {
            socket.emit("driver-location-update", { driverId: userId, ...coords });
          }
        },
        (err) => console.warn("GPS error:", err),
        { enableHighAccuracy: true, maximumAge: 1000 }
      );
    }

    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, [online, socket, userId]);

  // ---------------------- MARKER ANIMATION ----------------------
  useEffect(() => {
    if (!map || !pos) return;
    const lngLat = [pos.lng, pos.lat];

    if (!markerRef.current) {
      const el = document.createElement("div");
      el.style.width = "36px";
      el.style.height = "36px";
      el.style.borderRadius = "50%";
      el.style.background = "#2563eb";
      el.style.display = "flex";
      el.style.alignItems = "center";
      el.style.justifyContent = "center";
      el.style.color = "white";
      el.style.fontWeight = "600";
      el.innerText = "D";
      const { moveTo } = createSmoothMarker(map, el, lngLat);
      markerRef.current = { moveTo };
      moveTo(lngLat, 700);
    } else {
      markerRef.current.moveTo(lngLat, 700);
    }

    if (routeGeo) updateEtaDistance(pos, routeGeo);
  }, [map, pos]);

  // ---------------------- ETA & DISTANCE ----------------------
  const updateEtaDistance = (currentPos, geojson) => {
    try {
      const line = turf.lineString(geojson.features[0].geometry.coordinates);
      const pt = turf.point([currentPos.lng, currentPos.lat]);
      const snapped = turf.nearestPointOnLine(line, pt, { units: "meters" });
      const coords = line.geometry.coordinates;
      let remainingMeters = 0;
      const startIndex = snapped.properties.index;

      if (startIndex < coords.length - 1) {
        remainingMeters += turf.distance(turf.point(snapped.geometry.coordinates), turf.point(coords[startIndex + 1]), { units: "meters" });
        for (let i = startIndex + 1; i < coords.length - 1; i++) {
          remainingMeters += turf.distance(turf.point(coords[i]), turf.point(coords[i + 1]), { units: "meters" });
        }
      }

      const avgSpeedMps = 30 * 1000 / 3600;
      const etaMinutes = Math.max(1, Math.round(remainingMeters / avgSpeedMps / 60));

      setDistanceText(`${Math.round(remainingMeters)} m`);
      setEtaText(`${etaMinutes} min`);
    } catch (e) {
      console.warn("ETA/DISTANCE calculation failed", e);
    }
  };

  // ---------------------- ROUTE TO PICKUP ----------------------
  async function drawRouteToPickup(pickup) {
    if (!pos || !map) return;
    try {
      const url = getMapTilerDirectionsUrl([{ lat: pos.lat, lng: pos.lng }, pickup], "driving");
      const res = await fetch(url);
      const geo = await res.json();
      setRouteGeo(geo);
      const stepsList = geo.features[0].properties?.legs?.[0]?.steps || [];
      setSteps(stepsList);
      setCurrentStepIndex(0);

      addRouteLayer(map, geo, "route-driver-pickup");
      fitRouteBounds(map, geo, 80);
      updateEtaDistance(pos, geo);
    } catch (e) {
      console.warn("drawRouteToPickup failed", e);
    }
  }

  // ---------------------- ACCEPT / REJECT ----------------------
  const acceptRide = async () => {
    if (!incoming) return;
    await fetch("/ride/respond", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rideId: incoming.rideId, response: "accept" }),
    });
    await drawRouteToPickup(incoming.pickup);
    setIncoming(null);
  };

  const rejectRide = async () => {
    if (!incoming) return;
    await fetch("/ride/respond", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rideId: incoming.rideId, response: "reject" }),
    });
    setIncoming(null);
  };

  // ---------------------- PAYMENT ----------------------
  const handlePayment = async (amountCents) => {
    try {
      await startCheckout({ amount: amountCents, currency: "INR" });
    } catch (e) {
      console.error("Payment failed", e);
      alert("Payment initiation failed");
    }
  };

  return (
    <div style={{ display: "flex", height: "100vh", width: "100%" }}>
      {/* Left Panel */}
      <div style={{ width: "30%", padding: "20px", borderRight: "1px solid #ccc", overflowY: "auto" }}>
        <h2>Driver Dashboard</h2>
        <div>Status: {online ? "Online" : "Offline"}</div>
        <div className="flex gap-2 mt-2">
          <button onClick={() => setOnline(true)} style={{ flex: 1, padding: "10px", background: "#22c55e", color: "#fff", border: "none" }}>Go Online</button>
          <button onClick={() => setOnline(false)} style={{ flex: 1, padding: "10px", background: "#9ca3af", border: "none" }}>Go Offline</button>
        </div>

        <div style={{ marginTop: "20px" }}>
          <h3>Incoming Ride</h3>
          {incoming ? (
            <div>
              <p>Pickup: {incoming.pickup.lat.toFixed(4)}, {incoming.pickup.lng.toFixed(4)}</p>
              <p>Drop: {incoming.dropoff?.lat?.toFixed(4) || "--"}</p>
              <div className="flex gap-2">
                <button onClick={acceptRide} style={{ flex: 1, background: "#2563eb", color: "#fff", padding: "8px" }}>Accept</button>
                <button onClick={rejectRide} style={{ flex: 1, background: "#dc2626", color: "#fff", padding: "8px" }}>Reject</button>
              </div>
            </div>
          ) : <p>No incoming ride</p>}
        </div>

        <div style={{ marginTop: "20px" }}>
          <p>ETA: {etaText || "--"}</p>
          <p>Distance: {distanceText || "--"}</p>
        </div>

        <div style={{ marginTop: "20px" }}>
          <button onClick={() => handlePayment(50000)} style={{ width: "100%", padding: "10px", background: "#4f46e5", color: "#fff", border: "none" }}>
            Collect Payment (₹500)
          </button>
        </div>

        <div style={{ marginTop: "20px" }}>
          <h3>Turn-by-Turn</h3>
          <TurnByTurn steps={steps} currentIndex={currentStepIndex} onStepClick={setCurrentStepIndex} />
        </div>
      </div>

      {/* Right Panel (Map) */}
      <div style={{ width: "70%" }}>
        <MapComponent
          containerId="driver-dashboard-map"
          center={[pos?.lat || 20.5937, pos?.lng || 78.9629]}
          zoom={14}
          onMapLoad={setMap}
        />
      </div>
    </div>
  );
}
