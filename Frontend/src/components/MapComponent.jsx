// src/components/MapComponent.jsx
import React, { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { MAPTILER_STYLE } from "../utils/maptiler";

/**
 * Props:
 * - containerId (string) - id for map container
 * - center [lat,lng]
 * - zoom (number)
 * - onMapLoad (map) optional
 */
export default function MapComponent({ containerId = "map", center = [20.5937, 78.9629], zoom = 13, onMapLoad }) {
  const mapRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (mapRef.current) return; // already initialized

    mapRef.current = new maplibregl.Map({
      container: containerId,
      style: MAPTILER_STYLE,
      center: [center[1], center[0]], // MapLibre uses [lng, lat]
      zoom: zoom,
    });

    // Add nav controls
    mapRef.current.addControl(new maplibregl.NavigationControl(), "top-right");

    mapRef.current.on("load", () => {
      if (typeof onMapLoad === "function") onMapLoad(mapRef.current);
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Render container
  return (
    <div id={containerId} ref={containerRef} style={{ height: "100vh", width: "100%" }} />
  );
}
