// server.js (or index.js) - This file goes into your GitHub repository
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);

// Configure CORS for Socket.IO
// VERY IMPORTANT for Playcode to connect
const io = new socketIo.Server(server, {
    cors: {
        origin: "*", // Allows connections from any origin. For production, you'd specify your Playcode/GitHub Pages URL.
        methods: ["GET", "POST"]
    }
});

// Serve static files from a 'public' directory if you have any,
// though for a pure API/Socket.IO backend, this might not be strictly necessary.
// If you want to serve a simple HTML file to test the server directly, uncomment:
// app.use(express.static(path.join(__dirname, 'public')));

// Basic route for health check
app.get('/', (req, res) => {
    res.send('BlipChat Socket.IO server is running!');
});

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Listen for 'chat message' events from the client
    socket.on('chat message', (msg) => {
        console.log('Message received:', msg);
        // Broadcast the message to all connected clients, including the sender
        io.emit('chat message', msg);
    });

    // Listen for 'disconnect' events
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

// Define the port to listen on. Render will provide this via process.env.PORT
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`BlipChat server listening on port ${PORT}`);
});
