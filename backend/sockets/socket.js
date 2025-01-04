
const { Server } = require("socket.io");
const onlineUsers = new Map(); // To track online users

function initializeSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: "*", // Adjust the origin based on your frontend URL
    },
  });

  io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    // Load socket event handlers
    require('./socketHandlers/userEvents')(io, socket, onlineUsers);
    require('./socketHandlers/chatEvents')(io, socket, onlineUsers);
    require('./socketHandlers/messageEvents')(io, socket, onlineUsers);
    require('./socketHandlers/callEvents')(io, socket, onlineUsers);

  });
}

module.exports = { initializeSocket };
