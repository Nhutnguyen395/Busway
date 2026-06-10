import {useEffect, useState, useRef} from 'react';
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

  // Use a Ref to hold the socket so the button can talk to it
  const socketRef = useRef(null);

  const mapCenter = [33.8100, -117.9100];

  useEffect(() => {
    // fetch static route data (Java Backend - port 8080)
    const fetchRouteData = async () => {
      try {
        const response = await axios.get('http://localhost:8080/api/v1/transit/routes/43')
        setStops(response.data.stops);
      } catch (error) {
        console.error("Error fetching route from Java:", error);
      }
    };

    fetchRouteData();

    // connect to live GPS Stream (Node.js backend - port 3001)
    socketRef.current = io('http://localhost:3001');

    socketRef.current.on('busLocationUpdate', (data) => {
      // Update the React state every second, causing the bus marker to move
      setBusLocation(data);
    });

    socketRef.current.on('journeyComplete', (data) => {
      alert(data.message);
      setBusLocation(null);
    });

    // clean up connection when components unmounts
    return () => socketRef.current.disconnect();
  }, []); // Empty array means this only runs once when the page loads

  const getRouteObjects = () => {
    if (!startStopId || !endStopId || stops.length === 0) return [];

    const startIndex = stops.findIndex(s => s.stopId === startStopId);
    const endIndex = stops.findIndex(s => s.stopId === endStopId);
    if (startIndex === -1 || endIndex === -1) return [];

    const minIndex = Math.min(startIndex, endIndex);
    const maxIndex = Math.max(startIndex, endIndex);

    // Reverse the array if they are traveling backwards up the list
    let segment = stops.slice(minIndex, maxIndex + 1);
    if (startIndex > endIndex) {
      segment = segment.reverse();
    }
    return segment;
  };

  const customRoute = getRouteObjects();
  const polylinePositions = customRoute.map(stop => [stop.lon, stop.lat]);

  const startSimulation = () => {
    if (customRoute.length > 1 && socketRef.current) {
      socketRef.current.emit('startJourney', customRoute);
    }
  };

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

            {customRoute.length > 0 && (
                <div style={{marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px'}}>
                  <div style={{padding: '15px', backgroundColor: '#e2f0d9', borderRadius: '5px', color: '#2e7d32'}}>
                    <strong>Route Found!</strong><br/>
                    {customRoute.length} stops on your journey.
                  </div>

                  {/* NEW: Start Journey Button */}
                  <button
                      onClick={startSimulation}
                      style={{
                        padding: '12px',
                        backgroundColor: '#0055ff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                      }}>
                    Start Simulation
                  </button>
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
                    center={[stop.lon, stop.lat]}
                    radius={5}
                    pathOptions={{ color: '#0055ff', fillColor: '#0055ff', fillOpacity: 0.8 }}
                >
                  <Popup>{stop.routeName} (Stop #{stop.stopOrder})</Popup>
                </CircleMarker>
            ))}

            {busLocation && (
                <Marker position={[busLocation.lon, busLocation.lat]}>
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