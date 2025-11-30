// src/utils/maptiler.js
export const MAPTILER_KEY = "6ojYUoEOkynSdjqwfOmy";

// MapTiler style (you can change 'streets' to another map id in your MapTiler Cloud)
export const MAPTILER_STYLE = `https://api.maptiler.com/maps/streets/style.json?key=${MAPTILER_KEY}`;

// MapTiler Directions helper: returns a URL for route between coords
// Format: profile = driving, walking, cycling
// coords param: [{lat, lng}, {lat, lng}, ...]
export function getMapTilerDirectionsUrl(coords, profile = "driving") {
  // MapTiler supports Mapbox-compatible routing URL:
  // https://api.maptiler.com/routing/v1/{profile}/{lon1},{lat1};{lon2},{lat2}.geojson?key=KEY&overview=full&geometries=geojson
  const pairs = coords.map(c => `${c.lng},${c.lat}`).join(';');
  return `https://api.maptiler.com/routing/v1/${profile}/${pairs}.geojson?key=${MAPTILER_KEY}&overview=full&geometries=geojson`;
}

export const searchLocation = async (query) => {
  const url = `https://api.maptiler.com/geocoding/${encodeURIComponent(query)}.json?key=${MAPTILER_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch search results");
  const data = await res.json();
  return data.features.map(f => ({
    name: f.place_name,
    lat: f.geometry.coordinates[1],
    lng: f.geometry.coordinates[0],
  }));
};