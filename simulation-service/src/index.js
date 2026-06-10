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

    socket.on('startJourney', (customRoute) => {
        console.log(`Starting custom journey for ${socket.id} with ${customRoute.length}`);

        if (activeSimulations.has(socket.id)) {
            clearInterval(activeSimulations.get(socket.id));
        }

        if (!customRoute || customRoute.length < 2) return;

        let currentStopIndex = 0;
        let progress = 0.0;

        const intervalId = setInterval(() => {
            if (currentStopIndex >= customRoute.length - 1){
                socket.emit('journeyComplete', {message: 'You have arrived at your destination!'});
                clearInterval(intervalId);
                activeSimulations.delete(socket.id);
                console.log(`Journey complete for ${socket.id}`);
                return;
            }

            const currentStop = customRoute[currentStopIndex];
            const nextStop = customRoute[currentStopIndex + 1];

            const currentLat = lerp(currentStop.lat, nextStop.lat, progress);
            const currentLon = lerp(currentStop.lon, nextStop.lon, progress);

            const safeStopName = nextStop.routeName;

            // only use socket.emit to only emit to THIS user instead of everyone
            socket.emit('busLocationUpdate', {
                busId: `bus_${socket.id.substring(0,4)}`,
                lat: currentLat,
                lon: currentLon,
                nextStop: safeStopName
            });

            progress += 0.1;
            if (progress >= 1.0){
                progress = 0.0;
                currentStopIndex++;
            }
        }, 1000);
        activeSimulations.set(socket.id, intervalId);
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