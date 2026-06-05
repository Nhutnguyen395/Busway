import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import axios from 'axios';
import cors from 'cors';

const app = express();
app.use(cors());

// Wrap express in a standard HTTP server so socket.io can attach to it
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {origin: "*"}
});

function lerp(start, end, progress){
    return start + (end - start) * progress;
}

async function startSimulation() {
    try {
        const response = await axios.get('http://localhost:8080/api/v1/transit/routes/43');
        const stops = response.data.stops;

        let currentStopIndex = 0;
        let progress = 0.0;

        setInterval(() => {
            const currentStop = stops[currentStopIndex];
            const nextStop = stops[(currentStopIndex + 1) % stops.length];

            const currentLat = lerp(currentStop.lat, nextStop.lat, progress);
            const currentLon = lerp(currentStop.lon, nextStop.lon, progress);

            const busData = {
                busId: 'bus_red_001',
                routeId: 'route_red',
                lat: currentLat,
                lon: currentLon,
                nextStop: nextStop.routeName
            };

            io.emit('busLocationUpdate', busData);
            console.log(`Broadcasting: Bus at ${currentLat.toFixed(5)}, ${currentLon.toFixed(5)} -> Heading to ${nextStop.routeName}`);

            // Move the bus by 10% every second
            progress += 0.1;
            if (progress >= 1.0) {
                progress = 0.0;
                currentStopIndex = (currentStopIndex + 1) % stops.length;
            }
        }, 1000);
    } catch (error) {
        console.error("Simulation failed to start");
        console.error(error.message);
    }
}

io.on('connection', (socket) => {
    console.log(`New user connected to live map! Socket ID: ${socket.id}`)
});

const PORT = 3001;
httpServer.listen(PORT, () => {
    console.log(`Simulation Service running on port ${PORT}`);
    startSimulation();
});