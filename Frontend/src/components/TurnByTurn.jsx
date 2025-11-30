// src/components/TurnByTurn.jsx
import React from "react";

export default function TurnByTurn({ steps = [], currentIndex = 0, onStepClick = () => {} }) {
  if (!steps || steps.length === 0) {
    return <div className="text-sm text-gray-500">No steps yet</div>;
  }

  return (
    <div className="space-y-2">
      {steps.map((s, i) => {
        // step structure (MapTiler) often has: { maneuver: { instruction }, distance, duration }
        const instruction = s?.instruction || s?.maneuver?.instruction || (s?.name ? `Turn on ${s.name}` : "Proceed");
        const dist = s?.distance ? `${Math.round(s.distance)} m` : "";
        return (
          <div
            key={i}
            onClick={() => onStepClick(i)}
            className={`p-2 rounded ${i === currentIndex ? "bg-indigo-50 ring-1 ring-indigo-200" : "bg-white"} cursor-pointer`}
          >
            <div className="text-sm font-medium">{instruction}</div>
            <div className="text-xs text-gray-500">{dist}</div>
          </div>
        );
      })}
    </div>
  );
}


// -------------------------------------------
// Adds polyline route layer to map
// -------------------------------------------
export function addRouteLayer(map, routeCoords) {
  if (map.getSource("route")) {
    map.getSource("route").setData({
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: routeCoords,
      },
    });
    return;
  }

  map.addSource("route", {
    type: "geojson",
    data: {
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: routeCoords,
      },
    },
  });

  map.addLayer({
    id: "route-line",
    type: "line",
    source: "route",
    paint: {
      "line-color": "#000000",
      "line-width": 4,
    },
  });
}

// -------------------------------------------
// Fit map view to route
// -------------------------------------------
export function fitRouteBounds(map, routeCoords) {
  const bounds = new maplibregl.LngLatBounds();
  routeCoords.forEach((coord) => bounds.extend(coord));
  map.fitBounds(bounds, { padding: 60 });
}