const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors"); // Move this down

const app = express();
app.use(cors()); // This must come after `app` is defined

const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

io.on("connection", (socket) => {
  socket.on("message", (msg) => {
    io.emit("message", msg);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log("BlipChat server live on port", PORT);
});
