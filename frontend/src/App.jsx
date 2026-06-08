import {useEffect, useState } from 'react';
import {MapContainer, TileLayer, CircleMarker, Marker, Popup, Polyline} from 'react-leaflet';
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
  const [stops, setStops] = useState([]);
  const [busLocation, setBusLocation] = useState(null);

  const [startStopId, setStartStopId] = useState("");
  const [endStopId, setEndStopId] = useState("");

  const mapCenter = [33.8100, -117.9100];

  useEffect(() => {
    // fetch static route data (Java Backend - port 8080)
    const fetchRouteData = async () => {
      try {
        const response = await axios.get('http://localhost:8080/api/v1/transit/routes/43')
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

  const getHighlightedRoute = () => {
    if (!startStopId || !endStopId || stops.length === 0) return [];

    const startIndex = stops.findIndex(s => s.stopId === startStopId);
    const endIndex = stops.findIndex(s => s.stopId === endStopId);

    if (startIndex === -1 || endIndex === -1) return [];

    // ensures the array slice works whether they are going North or South
    const minIndex = Math.min(startIndex, endIndex);
    const maxIndex = Math.max(startIndex, endIndex);

    // grab only the stops between start and end
    const routeSegment = stops.slice(minIndex, maxIndex + 1);

    // map them into [lat, lon] format leaflet requires
    return routeSegment.map(stop => [stop.lon, stop.lat]);
  };

  const polylinePositions = getHighlightedRoute();

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

        {/* New Flexbox Layout */}
        <div className="app-body">

          {/* LEFT SIDEBAR: The Control Panel */}
          <div className="control-panel">
            <h3>Plan Your Trip</h3>

            <div className="input-group">
              <label>Starting Location</label>
              <select value={startStopId} onChange={(e) => setStartStopId(e.target.value)}>
                <option value="">-- Select Start Stop --</option>
                {stops.map(stop => (
                    <option key={`start-${stop.stopId}`} value={stop.stopId}>
                      {stop.routeName}
                    </option>
                ))}
              </select>
            </div>

            <div className="input-group">
              <label>Destination</label>
              <select value={endStopId} onChange={(e) => setEndStopId(e.target.value)}>
                <option value="">-- Select Destination --</option>
                {stops.map(stop => (
                    <option key={`end-${stop.stopId}`} value={stop.stopId}>
                      {stop.routeName}
                    </option>
                ))}
              </select>
            </div>

            {polylinePositions.length > 0 && (
                <div style={{marginTop: '20px', padding: '15px', backgroundColor: '#e2f0d9', borderRadius: '5px'}}>
                  <strong>Route Found!</strong><br/>
                  {polylinePositions.length} stops on your journey.
                </div>
            )}
          </div>

          {/* RIGHT SIDEBAR: The Map */}
          <MapContainer center={mapCenter} zoom={13} className="map-container">
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Draws the thick highlighted route between the selected stops */}
            {polylinePositions.length > 0 && (
                <Polyline
                    positions={polylinePositions}
                    color="#FF4500"
                    weight={6}
                    opacity={0.8}
                />
            )}

            {stops.map((stop) => (
                <CircleMarker
                    key={stop.stopId}
                    center={[parseFloat(stop.lon), parseFloat(stop.lat)]}
                    radius={5}
                    pathOptions={{ color: '#0055ff', fillColor: '#0055ff', fillOpacity: 0.8 }}
                >
                  <Popup>{stop.routeName} (Stop #{stop.stopOrder})</Popup>
                </CircleMarker>
            ))}

            {busLocation && (
                <Marker position={[parseFloat(busLocation.lon), parseFloat(busLocation.lat)]}>
                  <Popup>
                    <strong>Bus: {busLocation.busId}</strong><br/>
                    Next Stop: {busLocation.nextStop}
                  </Popup>
                </Marker>
            )}
          </MapContainer>
        </div>
      </div>
  );
}

export default App;