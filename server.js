// server.js (or index.js) - UPDATE THIS FILE IN YOUR GITHUB REPO

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);

const io = new socketIo.Server(server, {
    cors: {
        origin: "*", // Still allows connections from any origin
        methods: ["GET", "POST"]
    }
});

// --- NEW: In-memory array to store chat messages ---
const messages = []; // This will hold our chat history
const MAX_MESSAGES = 50; // Keep only the last 50 messages in memory

// Basic route for health check
app.get('/', (req, res) => {
    res.send('BlipChat Socket.IO server is running!');
});

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // --- NEW: Send existing messages to the newly connected client ---
    // This uses socket.emit (to specific client) instead of io.emit (to all clients)
    socket.emit('history', messages);

    // Listen for 'chat message' events from the client
    socket.on('chat message', (msg) => {
        console.log('Message received:', msg);

        // --- NEW: Add message to history ---
        messages.push(msg);
        // Trim history if it exceeds MAX_MESSAGES
        if (messages.length > MAX_MESSAGES) {
            messages.shift(); // Remove the oldest message
        }

        // Broadcast the message to all connected clients, including the sender
        io.emit('chat message', msg);
    });

    // Listen for 'disconnect' events
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`BlipChat server listening on port ${PORT}`);
});
