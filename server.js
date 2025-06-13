// server.js - THE ENTIRE NEW CODE FOR YOUR GITHUB REPO

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);

const io = new socketIo.Server(server, {
    cors: {
        origin: "*", // Allows connections from any origin
        methods: ["GET", "POST"]
    }
});

// --- Room Configuration ---
const ROOMS = {
    GENERAL: 'General',
    TECH_TALK: 'Tech Talk',
    ADMIN_ROOM: 'Admin Room'
};
const ADMIN_PASSWORD = 'o5i'; // Password for the Admin Room

// In-memory storage for message history per room
// Each history will be an array of message objects: { id: 'clientId', username: 'Name', text: 'Message content', room: 'RoomName' }
const roomsHistory = {
    [ROOMS.GENERAL]: [],
    [ROOMS.TECH_TALK]: [],
    [ROOMS.ADMIN_ROOM]: []
};
const MAX_MESSAGES_PER_ROOM = 25; // Keep only the last 25 messages per room

// Basic route for health check
app.get('/', (req, res) => {
    res.send('BlipChat Socket.IO server is running!');
});

io.on('connection', (socket) => {
    console.log(`A user connected: ${socket.id}`);
    
    // Store the current room the socket is in (useful for tracking disconnections)
    socket.currentRoom = null;

    // Handle joining a room
    socket.on('joinRoom', (data) => {
        const { roomName, password } = data;

        // Leave previous room if any
        if (socket.currentRoom && socket.currentRoom !== roomName) {
            socket.leave(socket.currentRoom);
            io.to(socket.currentRoom).emit('chat message', {
                username: 'System',
                text: `${socket.username || 'A user'} left the room.`,
                room: socket.currentRoom,
                id: 'system' // System message ID
            });
            console.log(`${socket.id} left room: ${socket.currentRoom}`);
        }

        // Admin Room password check
        if (roomName === ROOMS.ADMIN_ROOM && password !== ADMIN_PASSWORD) {
            console.log(`${socket.id} failed to join Admin Room: Incorrect password`);
            socket.emit('roomJoinFailed', 'Incorrect password for Admin Room.');
            return;
        }

        // Join the new room
        socket.join(roomName);
        socket.currentRoom = roomName;
        
        // --- NEW: Optional, store username on socket for easier access ---
        // This makes sure the username is available for system messages
        if (data.username) {
            socket.username = data.username;
        }

        // Send confirmation and history to the client that just joined
        socket.emit('roomJoined', {
            roomName: roomName,
            history: roomsHistory[roomName] || [] // Send specific room history
        });
        console.log(`${socket.id} joined room: ${roomName}`);

        // Notify others in the room (and the sender) that a user joined
        io.to(roomName).emit('chat message', {
            username: 'System',
            text: `${socket.username || 'A user'} joined ${roomName}.`,
            room: roomName,
            id: 'system' // System message ID
        });
    });

    // Listen for 'chat message' events from the client
    // msg is an object: { id: 'clientId', username: 'Name', text: 'Message content', room: 'RoomName' }
    socket.on('chat message', (msg) => {
        // Basic validation: ensure msg is an object and has required properties
        if (typeof msg === 'object' && msg.text && msg.username && msg.room) {
            console.log(`[${msg.room}] ${msg.username} (${msg.id}): ${msg.text}`);
            
            // Add message object to history for the specific room
            if (!roomsHistory[msg.room]) {
                roomsHistory[msg.room] = []; // Initialize if room history doesn't exist (shouldn't happen with predefined rooms)
            }
            roomsHistory[msg.room].push(msg);

            // Trim history if it exceeds MAX_MESSAGES_PER_ROOM
            if (roomsHistory[msg.room].length > MAX_MESSAGES_PER_ROOM) {
                roomsHistory[msg.room].shift(); // Remove the oldest message
            }

            // Broadcast the message object to all connected clients IN THAT ROOM
            io.to(msg.room).emit('chat message', msg);
        } else {
            console.warn('Received invalid message format:', msg);
        }
    });

    // Listen for 'disconnect' events
    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
        // Notify others if the user was in a room
        if (socket.currentRoom) {
            io.to(socket.currentRoom).emit('chat message', {
                username: 'System',
                text: `${socket.username || 'A user'} left the room.`,
                room: socket.currentRoom,
                id: 'system' // System message ID
            });
        }
    });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`BlipChat server listening on port ${PORT}`);
});
