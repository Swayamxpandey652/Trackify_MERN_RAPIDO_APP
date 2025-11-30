// src/components/routeHelpers.js
import maplibregl from "maplibre-gl";

/**
 * Add a geojson route to the map (removes existing route layer with same id)
 * geojson must be a FeatureCollection / Feature (LineString)
 */
export function addRouteLayer(map, geojson, layerId = "route-layer") {
  if (!map || !geojson) return;
  if (map.getLayer(layerId)) map.removeLayer(layerId);
  if (map.getSource(layerId)) map.removeSource(layerId);

  map.addSource(layerId, { type: "geojson", data: geojson });

  map.addLayer({
    id: layerId,
    type: "line",
    source: layerId,
    layout: { "line-join": "round", "line-cap": "round" },
    paint: { "line-color": "#2563eb", "line-width": 5, "line-opacity": 0.9 },
  });
}

/**
 * Create a smooth animated marker on map.
 * - el: DOM element (styled) OR null (uses default)
 * - initialLngLat: [lng, lat]
 * Returns { marker, moveTo } where moveTo([lng,lat], durationMs)
 */
export function createSmoothMarker(map, el = null, initialLngLat = [0, 0]) {
  const markerEl = el || document.createElement("div");
  if (!el) {
    markerEl.style.width = "28px";
    markerEl.style.height = "28px";
    markerEl.style.borderRadius = "14px";
    markerEl.style.background = "#f59e0b";
    markerEl.style.boxShadow = "0 2px 8px rgba(0,0,0,0.3)";
    markerEl.style.display = "flex";
    markerEl.style.alignItems = "center";
    markerEl.style.justifyContent = "center";
    markerEl.style.color = "white";
    markerEl.innerText = "D";
  }

  const marker = new maplibregl.Marker(markerEl).setLngLat(initialLngLat).addTo(map);

  let current = initialLngLat.slice();
  let frame = null;

  const lerp = (a, b, t) => a + (b - a) * t;

  function moveTo(targetLngLat, duration = 800) {
    if (!targetLngLat) return;
    cancelAnimationFrame(frame);
    const start = performance.now();
    const [startLng, startLat] = current;
    const [targetLng, targetLat] = targetLngLat;

    function animate(now) {
      const t = Math.min(1, (now - start) / duration);
      const lng = lerp(startLng, targetLng, t);
      const lat = lerp(startLat, targetLat, t);
      marker.setLngLat([lng, lat]);
      current = [lng, lat];
      if (t < 1) frame = requestAnimationFrame(animate);
    }
    frame = requestAnimationFrame(animate);
  }

  return { marker, moveTo };
}

/**
 * Helper: fit map to geojson coordinates (feature LineString)
 */
export function fitRouteBounds(map, geojson, padding = 80) {
  if (!map || !geojson) return;
  let coords = null;
  if (geojson.type === "FeatureCollection") coords = geojson.features[0].geometry.coordinates;
  else if (geojson.type === "Feature") coords = geojson.geometry.coordinates;
  else coords = geojson.coordinates; // fallback

  const bounds = coords.reduce((b, c) => {
    if (!b) return new maplibregl.LngLatBounds(c, c);
    return b.extend(c);
  }, null);

  if (bounds) map.fitBounds(bounds, { padding });
}
