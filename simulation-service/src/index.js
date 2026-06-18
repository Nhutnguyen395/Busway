import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
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

const activeSimulations = new Map();

io.on('connection', (socket) => {
    console.log(`New user connected! Socket ID: ${socket.id}`);

    socket.on('startJourney', (payload) => {
        const routeCoords = payload.curve || [];
        const stops = payload.stops || [];

        console.log(`Starting custom journey for ${socket.id} with ${routeCoords.length} path points.`);

        if (activeSimulations.has(socket.id)) {
            clearInterval(activeSimulations.get(socket.id));
        }

        if (routeCoords.length < 2) return;

        let currentCurveIndex = 0;
        let currentStopIndex = 1;
        let progress = 0.0;

        const intervalId = setInterval(() => {
            // 1. Check if we reached the absolute end of the OSRM curve
            if (currentCurveIndex >= routeCoords.length - 1){
                socket.emit('journeyComplete', {message: 'You have arrived at your destination!'});
                clearInterval(intervalId);
                activeSimulations.delete(socket.id);
                console.log(`Journey complete for ${socket.id}`);
                return;
            }

            // 2. Grab the current and next GPS breadcrumb on the street
            const currentPt = routeCoords[currentCurveIndex];
            const nextPt = routeCoords[currentCurveIndex + 1];

            // OSRM arrays are just [lat, lon]
            const currentLat = lerp(currentPt[0], nextPt[0], progress);
            const currentLon = lerp(currentPt[1], nextPt[1], progress);

            // 3. Figure out the name of the next stop
            let targetStopName = "Destination";
            if (stops && stops[currentStopIndex]) {
                targetStopName = stops[currentStopIndex].stopName;

                const stopTrueLat = stops[currentStopIndex].lon;
                const stopTrueLon = stops[currentStopIndex].lat;

                const distToStop = Math.pow(currentLat - stopTrueLat, 2) + Math.pow(currentLon - stopTrueLon, 2);

                // If we get extremely close to the target stop, increment the index!
                // (Note: We slightly increased the threshold to 0.00005 to ensure the bus "hits" the stop zone even on wide streets)
                if (distToStop < 0.00005 && currentStopIndex < stops.length - 1) {
                    currentStopIndex++;
                }
            }

            // 4. Emit the exact street location and the correct stop name to React
            socket.emit('busLocationUpdate', {
                busId: `BUS-${socket.id.substring(0,4).toUpperCase()}`,
                lat: currentLat,
                lon: currentLon,
                nextStop: targetStopName
            });

            // 5. Move the bus! Since OSRM curves have hundreds of points, we move quickly.
            progress += 0.5;
            if (progress >= 1.0){
                progress = 0.0;
                currentCurveIndex++;
            }
            activeSimulations.set(socket.id, intervalId);
        }, 150);
    });

    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
        if (activeSimulations.has(socket.id)) {
            clearInterval(activeSimulations.get(socket.id));
            activeSimulations.delete(socket.id);
        }
    });
});

const PORT = 3001;
httpServer.listen(PORT, () => {
    console.log(`Simulation Service running on port ${PORT}`);
});