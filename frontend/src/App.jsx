import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, CircleMarker, Marker, Popup, Polyline, useMap } from 'react-leaflet';
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

function FitBounds({ path }){
  const map = useMap();
  useEffect(() => {
    if (path && path.length > 0) {
      const bounds = path.map(stop => [stop.lon, stop.lat]);
      map.fitBounds(bounds, {padding: [50, 50]});
    }
  }, [path, map]);
  return null;
}

function App() {
  const [routes, setRoutes] = useState([]);

  // Independent State for departure
  const [startRouteId, setStartRouteId] = useState("");
  const [startRouteStops, setStartRouteStops] = useState([]);
  const [startStopId, setStartStopId] = useState("");

  // Independent State for Arrival
  const [endRouteId, setEndRouteId] = useState("");
  const [endRouteStops, setEndRouteStops] = useState([]);
  const [endStopId, setEndStopId] = useState("");

  // The Path returned from Java's Routing Engine
  const [optimalPath, setOptimalPath] = useState([]);
  const [busLocation, setBusLocation] = useState(null);

  const [curvedStreetPath, setCurveStreetPath] = useState([]);

  // Use a Ref to hold the socket so the button can talk to it
  const socketRef = useRef(null);
  const mapCenter = [33.8100, -117.9100];

  // 1. Initial Load
  useEffect(() => {
    axios.get('https://busway-backend-engine.onrender.com/api/v1/transit/routes')
        .then(res => setRoutes(res.data))
        .catch(res => console.error(err));

    socketRef.current = io('https://transit-simulator-engine.onrender.com');
    socketRef.current.on('busLocationUpdate', (data) => setBusLocation(data));
    socketRef.current.on('journeyComplete', (data) => {
      alert(data.message);
      setBusLocation(null);
    });

    return () => socketRef.current.disconnect();
  }, []);

  // 2. Fetch Departure Stops
  useEffect(() => {
    if (!startRouteId) return setStartRouteStops([]);
    axios.get(`https://busway-backend-engine.onrender.com/api/v1/transit/routes/${startRouteId}`)
        .then(res => setStartRouteStops(res.data.stops));
  }, [startRouteId]);

  // 3. Fetch Arrival Stops
  useEffect(() => {
    if (!endRouteId) return setEndRouteStops([]);
    axios.get(`https://busway-backend-engine.onrender.com/api/v1/transit/routes/${endRouteId}`)
        .then(res => setEndRouteStops(res.data.stops));
  }, [endRouteId]);

  // Routing Engine Trigger
  const calculateRoute = async () => {
    if (!startStopId || !endStopId) return;
    try {
      const response = await axios.get(`https://busway-backend-engine.onrender.com/api/v1/transit/navigate?startStopId=${startStopId}&endStopId=${endStopId}`);
      const pathStops = response.data;

      if (pathStops.length === 0){
        alert("No route found between these locations");
        return;
      }
      setOptimalPath(response.data);

      // Prepare data for ORSM
      let waypoints = pathStops;
      if (pathStops.length > 50){
        waypoints = pathStops.filter((_, idx) => idx % Math.ceil(pathStops.length / 50) === 0);
      }
      if (waypoints[waypoints.length - 1].stopId !== pathStops[pathStops.length - 1].stopId){
        waypoints.push(pathStops[pathStops.length - 1]);
      }

      // Build the url. ORSM expects: longitude,latitude;longitude,latitude
      // Reminder: Database stops are reversed! stop.lat = Longitude, stop.lon = Latitude
      const coordString = waypoints.map(s => `${s.lat},${s.lon}`).join(';');

      // Fetch the real street shapes from OSRM
      const osrmRes = await axios.get(`https://router.project-osrm.org/route/v1/driving/${coordString}?overview=full&geometries=geojson`);

      // OSRM returns GeoJson [lon, lat] but leaflet needs [lat, lon] so we swap them
      const geoJsonCoords = osrmRes.data.routes[0].geometry.coordinates;
      setCurveStreetPath(geoJsonCoords.map(c => [c[1], c[0]]));
    } catch (error) {
      console.log("Routing error:", error);
    }
  };

  const startSimulation = () => {
    if (optimalPath.length > 1 && socketRef.current) {
      socketRef.current.emit('startJourney', optimalPath);
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

        <div className="app-body">
          <div className="control-panel">
            <h3>Plan Your Trip</h3>

            {/* DEPARTURE SECTION */}
            <div style={{padding: '10px', backgroundColor: '#f0f0f0', borderRadius: '5px', marginBottom: '10px'}}>
              <label style={{fontWeight: 'bold'}}>DEPARTURE</label>
              <div className="input-group" style={{marginTop: '10px'}}>
                <select value={startRouteId} onChange={(e) => setStartRouteId(e.target.value)}>
                  <option value="">-- 1. Select Route --</option>
                  {routes.map(r => <option key={`s-route-${r.routeId}`} value={r.routeId}>{r.routeName}</option>)}
                </select>
                <select value={startStopId} onChange={(e) => setStartStopId(e.target.value)} disabled={!startRouteStops.length}>
                  <option value="">-- 2. Select Stop --</option>
                  {startRouteStops.map(s => <option key={`s-stop-${s.stopId}`} value={s.stopId}>{s.routeName || s.stopName}</option>)}
                </select>
              </div>
            </div>

            {/* ARRIVAL SECTION */}
            <div style={{padding: '10px', backgroundColor: '#f0f0f0', borderRadius: '5px'}}>
              <label style={{fontWeight: 'bold'}}>ARRIVAL</label>
              <div className="input-group" style={{marginTop: '10px'}}>
                <select value={endRouteId} onChange={(e) => setEndRouteId(e.target.value)}>
                  <option value="">-- 1. Select Route --</option>
                  {routes.map(r => <option key={`e-route-${r.routeId}`} value={r.routeId}>{r.routeName}</option>)}
                </select>
                <select value={endStopId} onChange={(e) => setEndStopId(e.target.value)} disabled={!endRouteStops.length}>
                  <option value="">-- 2. Select Stop --</option>
                  {endRouteStops.map(s => <option key={`e-stop-${s.stopId}`} value={s.stopId}>{s.routeName || s.stopName}</option>)}
                </select>
              </div>
            </div>

            <button
                onClick={calculateRoute}
                style={{ padding: '10px', backgroundColor: '#333', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', marginTop: '10px' }}>
              Find Optimal Route
            </button>

            {optimalPath.length > 0 && (
                <div style={{marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px'}}>
                  <div style={{padding: '15px', backgroundColor: '#e2f0d9', borderRadius: '5px', color: '#2e7d32'}}>
                    <strong>Route Found!</strong><br/>
                    Total Stops / Transfers: {optimalPath.length}
                  </div>

                  <button
                      onClick={startSimulation}
                      style={{ padding: '12px', backgroundColor: '#0055ff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
                    Dispatch Bus Simulation
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

            <FitBounds path={optimalPath}/>

            {/* Draws the thick highlighted route between the selected stops */}
            {curvedStreetPath.length > 0 && (
                <Polyline
                    positions={curvedStreetPath}
                    color="#FF4500"
                    weight={6}
                    opacity={0.8}
                />
            )}

            {optimalPath.map((stop) => (
                <CircleMarker
                    key={stop.stopId}
                    center={[parseFloat(stop.lon), parseFloat(stop.lat)]}
                    radius={5}
                    pathOptions={{ color: '#0055ff', fillColor: '#0055ff', fillOpacity: 1.0 }}
                >
                  <Popup>{stop.stopName}</Popup>
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