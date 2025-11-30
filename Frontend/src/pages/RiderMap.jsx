import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import 'leaflet-routing-machine';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';

import icon from 'leaflet/dist/images/marker-icon.png';
import iconRetina from 'leaflet/dist/images/marker-icon-2x.png';
import shadow from 'leaflet/dist/images/marker-shadow.png';

// FIX Leaflet default icon
(function fixLeafletIcon() {
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
        iconRetinaUrl: iconRetina,
        iconUrl: icon,
        shadowUrl: shadow,
    });
})();

const INITIAL_CENTER = [28.7041, 77.1025];
const INITIAL_ZOOM = 13;

const isValidLocation = (loc) => loc && !isNaN(Number(loc.lat)) && !isNaN(Number(loc.lng));

/* --------------------------- GEOCODING --------------------------- */
const geocodeSearch = async (query) => {
    if (!query) return [];
    try {
        const res = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
                query
            )}&limit=5`
        );
        const data = await res.json();
        return data
            .map((item) => {
                const lat = Number(item.lat);
                const lng = Number(item.lon);
                return !isNaN(lat) && !isNaN(lng) ? { display_name: item.display_name, lat, lng } : null;
            })
            .filter(Boolean);
    } catch (err) {
        console.error('Geocoding error:', err);
        return [];
    }
};

/* --------------------------- ROUTING --------------------------- */
const MapFeatures = ({ pickup, drop }) => {
    const map = useMap();
    const routingRef = useRef(null);

    const osrmRouter = useMemo(() => L.Routing.osrmv1({ serviceUrl: 'https://router.project-osrm.org/route/v1' }), []);

    useEffect(() => {
        if (!isValidLocation(pickup) || !isValidLocation(drop)) return;

        const start = L.latLng(Number(pickup.lat), Number(pickup.lng));
        const end = L.latLng(Number(drop.lat), Number(drop.lng));

        routingRef.current = L.Routing.control({
            waypoints: [start, end],
            router: osrmRouter,
            routeWhileDragging: false,
            createMarker: () => null,
            show: false,
            lineOptions: { styles: [{ color: '#007bff', weight: 5, opacity: 0.8 }] },
        }).addTo(map);

        // Fit map to bounds
        const bounds = L.latLngBounds(start, end);
        map.fitBounds(bounds, { padding: [50, 50] });

        return () => {
            if (routingRef.current) {
                map.removeControl(routingRef.current);
                routingRef.current = null;
            }
        };
    }, [pickup, drop, map, osrmRouter]);

    return null;
};

/* --------------------------- LOCATION INPUT --------------------------- */
const LocationSearchInput = ({ type, value, onSelectLocation }) => {
    const [searchTerm, setSearchTerm] = useState(value || '');
    const [suggestions, setSuggestions] = useState([]);

    useEffect(() => setSearchTerm(value || ''), [value]);

    useEffect(() => {
        if (!searchTerm) return setSuggestions([]);
        const timeout = setTimeout(async () => {
            if (searchTerm === value) return;
            const results = await geocodeSearch(searchTerm);
            setSuggestions(results);
        }, 300);
        return () => clearTimeout(timeout);
    }, [searchTerm, value]);

    const handleSelect = (loc) => {
        onSelectLocation(type, loc);
        setSuggestions([]);
    };

    return (
        <div style={{ position: 'relative', marginBottom: '15px' }}>
            <label>{type === 'pickup' ? 'Pickup Location:' : 'Drop Location:'}</label>
            <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={`Search ${type}...`}
                style={{ width: '100%', padding: '8px' }}
            />
            {suggestions.length > 0 && (
                <ul
                    style={{
                        position: 'absolute',
                        zIndex: 1000,
                        listStyle: 'none',
                        padding: 0,
                        margin: 0,
                        border: '1px solid #ccc',
                        backgroundColor: 'white',
                        width: 'calc(100% - 2px)',
                        maxHeight: 200,
                        overflowY: 'auto',
                    }}
                >
                    {suggestions.map((loc, idx) => (
                        <li
                            key={idx}
                            onClick={() => handleSelect(loc)}
                            style={{ padding: 10, cursor: 'pointer', borderBottom: '1px solid #eee' }}
                        >
                            {loc.display_name}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

/* --------------------------- MAIN RIDER MAP --------------------------- */
const RiderMap = () => {
    const [pickup, setPickup] = useState(null);
    const [drop, setDrop] = useState(null);
    const [currentLocation, setCurrentLocation] = useState(null);

    // 🛰️ GPS Live Location
    useEffect(() => {
        const watchId = navigator.geolocation.watchPosition(
            (pos) => {
                setCurrentLocation([pos.coords.latitude, pos.coords.longitude]);
            },
            (err) => console.warn('GPS error:', err),
            { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
        );
        return () => navigator.geolocation.clearWatch(watchId);
    }, []);

    const pickupPos = pickup ? [Number(pickup.lat), Number(pickup.lng)] : null;
    const dropPos = drop ? [Number(drop.lat), Number(drop.lng)] : null;

    const handleSetPickupCurrent = () => {
        if (!currentLocation) return;
        setPickup({ lat: currentLocation[0], lng: currentLocation[1], display_name: 'Current Location' });
        setDrop(null);
    };

    return (
        <div style={{ display: 'flex', height: '100vh' }}>
            {/* LEFT PANEL */}
            <div style={{ width: '30%', padding: 20, borderRight: '1px solid #ccc' }}>
                <h2>📍 Ride Booking</h2>

                <LocationSearchInput
                    type="pickup"
                    value={pickup?.display_name}
                    onSelectLocation={(t, loc) => {
                        setPickup(loc);
                        setDrop(null);
                    }}
                />

                <LocationSearchInput
                    type="drop"
                    value={drop?.display_name}
                    onSelectLocation={(t, loc) => setDrop(loc)}
                />

                <button onClick={handleSetPickupCurrent} style={{ marginTop: 10, padding: 10, background: '#4caf50', color: '#fff', border: 'none', cursor: 'pointer' }}>
                    Set Pickup: Current Location
                </button>

                <button onClick={() => { setPickup(null); setDrop(null); }} style={{ marginTop: 10, padding: 10, background: '#f44336', color: '#fff', border: 'none', cursor: 'pointer' }}>
                    Clear Locations
                </button>

                <button
                    onClick={() => alert(`Ride requested!\nPickup: ${pickup?.display_name}\nDrop: ${drop?.display_name}`)}
                    style={{ marginTop: 20, padding: 10, background: '#007bff', color: '#fff', border: 'none', cursor: 'pointer', width: '100%' }}
                    disabled={!pickup || !drop}
                >
                    Request Ride
                </button>

                <div style={{ marginTop: 20 }}>
                    <p>Pickup: {pickup ? pickup.display_name : 'Not Set'}</p>
                    <p>Drop: {drop ? drop.display_name : 'Not Set'}</p>
                    <p>GPS: {currentLocation ? `${currentLocation[0].toFixed(5)}, ${currentLocation[1].toFixed(5)}` : 'Fetching...'}</p>
                </div>
            </div>

            {/* MAP */}
            <div style={{ width: '70%' }}>
                <MapContainer center={INITIAL_CENTER} zoom={INITIAL_ZOOM} style={{ height: '100%', width: '100%' }}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

                    {/* MARKERS */}
                    {pickupPos && <Marker position={pickupPos}><Popup>Pickup: {pickup.display_name}</Popup></Marker>}
                    {dropPos && <Marker position={dropPos}><Popup>Drop: {drop.display_name}</Popup></Marker>}
                    {currentLocation && <Marker position={currentLocation}><Popup>Your Location</Popup></Marker>}

                    {/* ROUTING */}
                    {pickup && drop && <MapFeatures pickup={pickup} drop={drop} />}
                </MapContainer>
            </div>
        </div>
    );
};

export default RiderMap;
