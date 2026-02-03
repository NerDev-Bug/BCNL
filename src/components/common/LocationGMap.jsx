import React, { useEffect, useState, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, Tooltip, Polyline, Circle, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const DELIVERY_RADIUS_KM = 10;
const DELIVERY_RADIUS_METERS = DELIVERY_RADIUS_KM * 1000;

// Haversine distance in km between two [lat, lng] points
function distanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const adminIcon = L.divIcon({
  className: "admin-marker",
  html: `<div style="background:#2563eb;width:24px;height:24px;border-radius:50%;border:3px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.4);"></div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

const customerIcon = L.divIcon({
  className: "customer-marker",
  html: `<div style="background:#dc2626;width:24px;height:24px;border-radius:50%;border:3px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.4);"></div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

// OSRM route API (no API key)
const getRoute = async (fromLat, fromLng, toLat, toLng) => {
  const url = `https://router.project-osrm.org/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  if (!data.routes?.[0]?.geometry?.coordinates?.length) return null;
  // GeoJSON is [lng, lat]; Leaflet wants [lat, lng]
  return data.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]);
};

// Nominatim geocode (OpenStreetMap)
const geocodeAddress = async (address) => {
  if (!address?.trim()) return null;
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`;
  const res = await fetch(url, { headers: { "Accept-Language": "en" } });
  if (!res.ok) return null;
  const data = await res.json();
  const first = data?.[0];
  if (!first) return null;
  return { lat: parseFloat(first.lat), lng: parseFloat(first.lon) };
};

function FitBounds({ points }) {
  const map = useMap();
  useEffect(() => {
    if (!points?.length) return;
    const bounds = L.latLngBounds(points);
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
  }, [map, points]);
  return null;
}

function LocationGMap({ isOpen, onClose, address, location, adminLocation, adminLabel, customerLabel }) {
  const [geocodedCoords, setGeocodedCoords] = useState(null);
  const [routeCoords, setRouteCoords] = useState(null);
  const [loading, setLoading] = useState(false);
  const [routeError, setRouteError] = useState(null);

  const hasCustomer = location?.lat != null && location?.lng != null;
  const customerCoordsFromLocation = hasCustomer ? [location.lat, location.lng] : null;
  const customerCoords = customerCoordsFromLocation ?? geocodedCoords;

  // Geocode address when no lat/lng (async only, no sync setState)
  useEffect(() => {
    if (!isOpen || hasCustomer || !address?.trim()) {
      if (!hasCustomer && !address?.trim()) {
        queueMicrotask(() => setGeocodedCoords(null));
      }
      return;
    }
    let cancelled = false;
    queueMicrotask(() => setLoading(true));
    geocodeAddress(address).then((coords) => {
      if (!cancelled) {
        setGeocodedCoords(coords ? [coords.lat, coords.lng] : null);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [isOpen, address, hasCustomer]);

  // Fetch route when both admin and customer coords are available
  useEffect(() => {
    if (!isOpen || adminLocation?.lat == null || !customerCoords?.length) {
      queueMicrotask(() => {
        setRouteCoords(null);
        setRouteError(null);
      });
      return;
    }
    let cancelled = false;
    queueMicrotask(() => setRouteError(null));
    getRoute(
      adminLocation.lat,
      adminLocation.lng,
      customerCoords[0],
      customerCoords[1]
    ).then((coords) => {
      if (!cancelled) {
        setRouteCoords(coords || []);
        if (!coords) setRouteError("Route could not be calculated.");
      }
    });
    return () => { cancelled = true; };
  }, [isOpen, adminLocation?.lat, adminLocation?.lng, customerCoords]);

  const allPoints = useMemo(() => {
    const pts = [];
    if (adminLocation?.lat != null) pts.push([adminLocation.lat, adminLocation.lng]);
    if (customerCoords?.length) pts.push(customerCoords);
    if (routeCoords?.length) pts.push(...routeCoords);
    return pts;
  }, [adminLocation, customerCoords, routeCoords]);

  const distanceFromAdmin = useMemo(() => {
    if (adminLocation?.lat == null || adminLocation?.lng == null || !customerCoords?.length) return null;
    return distanceKm(
      adminLocation.lat,
      adminLocation.lng,
      customerCoords[0],
      customerCoords[1]
    );
  }, [adminLocation, customerCoords]);

  const isWithinDeliveryZone = distanceFromAdmin != null && distanceFromAdmin <= DELIVERY_RADIUS_KM;

  if (!isOpen) return null;

  const hasAdmin = adminLocation?.lat != null && adminLocation?.lng != null;
  const showMap = hasAdmin || customerCoords?.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg w-[90%] max-w-3xl p-4 shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">Delivery Route</h3>
          <button
            onClick={onClose}
            className="text-xl font-bold text-gray-500 hover:text-red-500"
          >
            ×
          </button>
        </div>

        {loading && (
          <div className="flex items-center justify-center h-64 text-gray-500">
            Resolving address…
          </div>
        )}

        {!loading && !showMap && (
          <div className="flex items-center justify-center h-64 text-gray-500">
            No location or address available to show.
          </div>
        )}

        {!loading && showMap && (
          <div className="relative h-[400px] rounded overflow-hidden border border-gray-200">
            <MapContainer
              center={
                customerCoords?.length
                  ? customerCoords
                  : [adminLocation?.lat ?? 52.37, adminLocation?.lng ?? 4.9]
              }
              zoom={11}
              className="h-full w-full"
              scrollWheelZoom={true}
              zoomControl={false}
              attributionControl={false}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <FitBounds points={allPoints} />
              {hasAdmin && (
                <>
                  <Circle
                    center={[adminLocation.lat, adminLocation.lng]}
                    radius={DELIVERY_RADIUS_METERS}
                    pathOptions={{
                      color: "#2563eb",
                      fillColor: "#2563eb",
                      fillOpacity: 0.08,
                      weight: 2,
                      dashArray: "6 4",
                    }}
                  />
                  <Marker position={[adminLocation.lat, adminLocation.lng]} icon={adminIcon}>
                    <Tooltip direction="top" permanent={false} opacity={0.95}>
                      {adminLabel || "BCNL"}
                    </Tooltip>
                    <Popup>Admin / Store (10 km delivery zone)</Popup>
                  </Marker>
                </>
              )}
              {customerCoords?.length === 2 && (
                <Marker position={customerCoords} icon={customerIcon}>
                  <Tooltip direction="top" permanent={false} opacity={0.95}>
                    {customerLabel || "Customer"}
                  </Tooltip>
                  <Popup>Customer</Popup>
                </Marker>
              )}
              {routeCoords?.length > 0 && (
                <Polyline
                  positions={routeCoords}
                  pathOptions={{ color: "#2563eb", weight: 5, opacity: 0.8 }}
                />
              )}
            </MapContainer>
          </div>
        )}

        {routeError && (
          <p className="mt-2 text-sm text-amber-600">{routeError}</p>
        )}
        {distanceFromAdmin != null && (
          <p className={`mt-2 text-sm ${isWithinDeliveryZone ? "text-green-600" : "text-red-600"}`}>
            {isWithinDeliveryZone
              ? `Within delivery zone: ${distanceFromAdmin.toFixed(1)} km from store (max ${DELIVERY_RADIUS_KM} km).`
              : `Outside delivery zone: ${distanceFromAdmin.toFixed(1)} km from store (max ${DELIVERY_RADIUS_KM} km).`}
          </p>
        )}
      </div>
    </div>
  );
}

export default LocationGMap;
