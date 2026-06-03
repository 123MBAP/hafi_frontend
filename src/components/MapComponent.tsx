// src/components/MapComponent.tsx

import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import React, { useEffect } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';

// Fix for default icon issues in Leaflet
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});


type MarkerItem = {
  id: string;
  lat: number;
  lng: number;
  title?: string;
  image_url?: string;
  price?: number;
  productId?: string;
};

interface MapComponentProps {
  markers?: MarkerItem[];
  userLocation?: { lat: number; lng: number } | null;
  zoom?: number;
  height?: string | number;
  fitToMarkers?: boolean;
}

function FitBounds({ markers }: { markers?: MarkerItem[] }) {
  const map = useMap();
  useEffect(() => {
    if (!markers || markers.length === 0) return;
    const latlngs = markers
      .filter((m) => m.lat != null && m.lng != null)
      .map((m) => [m.lat, m.lng] as [number, number]);
    if (latlngs.length === 0) return;
    try {
      map.fitBounds(latlngs as any, { padding: [40, 40] });
    } catch (e) {
      // ignore
    }
  }, [map, markers]);
  return null;
}

const MapComponent: React.FC<MapComponentProps> = ({ markers = [], userLocation = null, zoom = 6, height = '400px', fitToMarkers = true }) => {
  const center: [number, number] = userLocation ? [userLocation.lat, userLocation.lng] : [-1.9706, 30.1044];

  return (
    <div className="w-full" style={{ height }}>
      <MapContainer center={center} zoom={zoom} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {fitToMarkers && <FitBounds markers={markers} />}

        {userLocation && (
          <Marker position={[userLocation.lat, userLocation.lng]}>
            <Popup>You are here</Popup>
          </Marker>
        )}

        {markers.map((m) => (
          <Marker key={m.id} position={[m.lat, m.lng]}>
            <Popup>
              <div style={{ width: 220 }}>
                {m.image_url && <img src={m.image_url} alt={m.title} style={{ width: '100%', height: 100, objectFit: 'cover', borderRadius: 6, marginBottom: 6 }} />}
                <div style={{ fontWeight: 600 }}>{m.title}</div>
                {typeof m.price === 'number' && <div>Fr{m.price.toLocaleString()}</div>}
                {m.productId && (
                  <div style={{ marginTop: 6 }}>
                    <a href={`/product/${m.productId}`} className="underline text-emerald-600">View product</a>
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default MapComponent;
