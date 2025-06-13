// server.js - THE ENTIRE NEW CODE FOR YOUR GITHUB REPO

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);

const io = new socketIo.Server(server, {
    cors: {
        origin: "*", // Still allows connections from any origin
        methods: ["GET", "POST"]
    }
});

// In-memory array to store chat messages
// Each message will now be an object: { id: 'clientId', username: 'Name', text: 'Message content' }
const messages = []; 
const MAX_MESSAGES = 50; // Keep only the last 50 messages in memory

// Basic route for health check
app.get('/', (req, res) => {
    res.send('BlipChat Socket.IO server is running!');
});

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Send existing messages (objects) to the newly connected client
    socket.emit('history', messages);

    // Listen for 'chat message' events from the client
    // msg is now an object: { id: 'clientId', username: 'Name', text: 'Message content' }
    socket.on('chat message', (msg) => {
        // Basic validation: ensure msg is an object and has text/username
        if (typeof msg === 'object' && msg.text && msg.username) {
            console.log(`Message received from ${msg.username} (${msg.id}): ${msg.text}`);
            
            // Add message object to history
            messages.push(msg);
            if (messages.length > MAX_MESSAGES) {
                messages.shift(); // Remove the oldest message
            }

            // Broadcast the message object to all connected clients
            io.emit('chat message', msg);
        } else {
            console.warn('Received invalid message format:', msg);
        }
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
