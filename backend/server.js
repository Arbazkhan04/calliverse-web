require("dotenv").config();
const express = require("express");
const connectDb = require("./db/connect.js");
const errorHandler = require("./middleware/errorHandler.js");
const path = require('path'); 
const admin = require("./config/firebase.js")
const cors = require("cors");
const morgan = require("morgan");
const { initializeSocket } = require("./sockets/socket.js");

const app = express();
const http = require("http");
const server = http.createServer(app); // Attach the server for Socket.IO

const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());


// Expose the 'uploads' directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));



// Log every request to the console
app.use(morgan(":method :url :status :response-time ms"));

// Routes
const userManagementRoutes = require("./routes/userManagementRouter.js");
const messageManagementRoutes = require("./routes/messageManagementRouter.js");
const chatManagementRoutes = require("./routes/chatManagementRouter.js");
const FCMManagementRoutes = require("./routes/FCMManagementRouter.js");



app.use("/api/userManagementRoutes", userManagementRoutes);
app.use("/api/messageManagmentRoutes", messageManagementRoutes);
app.use("/api/chatManagmentRoutes", chatManagementRoutes);
app.use("/api/FCMManagmentRoutes", FCMManagementRoutes);



// Error Handling Middleware
app.use(errorHandler);

// Initialize Socket.IO
initializeSocket(server); // Pass the server instance to socket logic

// Start the server
const start = async () => {
  try {
    await connectDb(process.env.MONGO_URL);
    console.log("Database connected");
    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (err) {
    console.log(err);
  }
};

start();
