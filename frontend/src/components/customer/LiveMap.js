import React, { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';
import './LiveMap.css';

// We use a dynamic import approach to avoid SSR issues with Leaflet
// and fix the "window is not defined" error on some environments
export default function LiveMap({ order, riderLocation }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const riderMarkerRef = useRef(null);
  const initializedRef = useRef(false);

  const RANGPUR = [25.7439, 89.2752];

  const restaurantCoords = order?.restaurant?.address?.coordinates?.lat
    ? [order.restaurant.address.coordinates.lat, order.restaurant.address.coordinates.lng]
    : RANGPUR;

  const customerCoords = order?.deliveryAddress?.coordinates?.lat
    ? [order.deliveryAddress.coordinates.lat, order.deliveryAddress.coordinates.lng]
    : [25.7480, 89.2810];

  const riderCoords = riderLocation?.lat
    ? [riderLocation.lat, riderLocation.lng]
    : null;

  useEffect(() => {
    if (!mapRef.current || initializedRef.current) return;

    // Dynamically import leaflet to avoid window issues
    import('leaflet').then((L) => {
      const leaflet = L.default || L;

      // Fix default icon
      delete leaflet.Icon.Default.prototype._getIconUrl;
      leaflet.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      });

      const createIcon = (emoji, color) => leaflet.divIcon({
        html: `<div style="background:${color};width:40px;height:40px;border-radius:50%;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;font-size:20px;">${emoji}</div>`,
        className: '',
        iconSize: [40, 40],
        iconAnchor: [20, 20],
        popupAnchor: [0, -22]
      });

      const center = riderCoords || restaurantCoords;
      const map = leaflet.map(mapRef.current, { zoomControl: true, scrollWheelZoom: false }).setView(center, 14);
      mapInstanceRef.current = map;
      initializedRef.current = true;

      leaflet.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(map);

      // Restaurant marker
      leaflet.marker(restaurantCoords, { icon: createIcon('🍽️', '#f39c12') })
        .addTo(map)
        .bindPopup(`<strong>${order?.restaurant?.name || 'Restaurant'}</strong><br>${order?.restaurant?.address?.area || ''}`);

      // Customer marker
      leaflet.marker(customerCoords, { icon: createIcon('🏠', '#27ae60') })
        .addTo(map)
        .bindPopup(`<strong>Your Address</strong><br>${order?.deliveryAddress?.area || ''}, ${order?.deliveryAddress?.city || 'Rangpur'}`);

      // Route line
      const routePoints = riderCoords
        ? [restaurantCoords, riderCoords, customerCoords]
        : [restaurantCoords, customerCoords];
      leaflet.polyline(routePoints, { color: '#c0392b', weight: 3, opacity: 0.6, dashArray: '8 6' }).addTo(map);

      // Rider marker
      if (riderCoords) {
        const riderMarker = leaflet.marker(riderCoords, { icon: createIcon('🏍️', '#c0392b') })
          .addTo(map)
          .bindPopup(`<strong>Your Rider</strong><br>${order?.rider?.name || 'On the way!'}`);
        riderMarkerRef.current = riderMarker;
      }

      // Fit bounds
      const bounds = leaflet.latLngBounds([restaurantCoords, customerCoords]);
      if (riderCoords) bounds.extend(riderCoords);
      map.fitBounds(bounds, { padding: [40, 40] });
    }).catch(err => console.error('Leaflet load error:', err));

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        initializedRef.current = false;
      }
    };
  }, []);

  // Update rider marker position when location changes
  useEffect(() => {
    if (!riderCoords || !riderMarkerRef.current || !mapInstanceRef.current) return;
    riderMarkerRef.current.setLatLng(riderCoords);
    mapInstanceRef.current.panTo(riderCoords, { animate: true, duration: 0.5 });
  }, [riderLocation?.lat, riderLocation?.lng]);

  return (
    <div className="live-map-wrapper">
      <div className="map-header">
        <h3>📍 Live Order Tracking</h3>
        <div className="map-legend">
          <span>🍽️ Restaurant</span>
          {riderCoords && <span>🏍️ Rider</span>}
          <span>🏠 You</span>
        </div>
      </div>
      <div ref={mapRef} style={{ height: '380px', width: '100%' }} />
      {!riderCoords ? (
        <div className="map-waiting">🕐 Rider location will appear once they start delivering</div>
      ) : (
        <div className="map-active">🏍️ Rider is on the way — updates every 10 seconds</div>
      )}
    </div>
  );
}
