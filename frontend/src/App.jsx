import {useEffect, useState } from 'react';
import {MapContainer, TileLayer, CircleMarker, Marker, Popup} from 'react-leaflet';
import { io } from 'socket.io-client';
import axios from 'axios';
import L from 'leaflet';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow
});

function App() {
  // static bus stops from java
  const [stops, setStops] = useState([]);

  // Live bus location from Node.js
  const [busLocation, setBusLocation] = useState(null);

  // Mock data: center of Garden Grove
  const mapCenter = [33.8100, -117.9100];

  useEffect(() => {
    // fetch static route data (Java Backend - port 8080)
    const fetchRouteData = async () => {
      try {
        const response = await axios.get('http://localhost:8080/api/v1/transit/routes/route_red')
        setStops(response.data.stops);
        console.log("Loaded stops from Java:", response.data.stops);
      } catch (error) {
        console.error("Error fetching route from Java:", error);
      }
    };

    fetchRouteData();

    // connect to live GPS Stream (Node.js backend - port 3001)
    const socket = io('http://localhost:3001');
    socket.on('connect', () =>{
      console.log('Connected to Node.js WebSocket!');
    });

    socket.on('busLocationUpdate', (data) => {
      // Update the React state every second, causing the bus marker to move
      setBusLocation(data);
    });

    // clean up connection when components unmounts
    return () => socket.disconnect();
  }, []); // Empty array means this only runs once when the page loads

  return (
      <div>
        <header className="dashboard-header">
          <h2>Busway Command Center</h2>
          {busLocation && (
              <span style={{marginLeft: 'auto'}}>
                Live Tracking: <strong>{busLocation.busId}</strong> | Next: <strong>{busLocation.nextStop}</strong>
              </span>
          )}
        </header>

        <MapContainer center={mapCenter} zoom={14} className={'map-container'}>
          {/* The underlying street map tiles (Free OpenStreetMap data) */}
          <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Draw the Static Bus Stops (Blue Circles) */}
          {stops.map((stop) => (
              <CircleMarker
                  key={stop.stopId}
                  center={[stop.lat, stop.lon]}
                  radius={8}
                  pathOptions={{ color: 'blue', fillColor: 'blue', fillOpacity: 0.5 }}
              >
                <Popup>{stop.stopName} (Stop #{stop.stopOrder})</Popup>
              </CircleMarker>
          ))}

          {/* Draw the Live Moving Bus (Standard Map Pin) */}
          {busLocation && (
              <Marker position={[busLocation.lat, busLocation.lon]}>
                <Popup>
                  <strong>Bus: {busLocation.busId}</strong><br/>
                  Next Stop: {busLocation.nextStop}
                </Popup>
              </Marker>
          )}
        </MapContainer>
      </div>
  );
}

export default App;