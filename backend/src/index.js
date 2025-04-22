import express from "express";
import bodyParser from "body-parser";
import { Server } from "socket.io";
import http from "http"; // Import http module

// Initialize express app
const app = express();

// Middleware for CORS
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "https://video-chat-app-frontend-pied.vercel.app"); // Replace with your frontend URL
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

// Body parser middleware
app.use(bodyParser.json());

// Create an HTTP server using Express
const server = http.createServer(app);

// Initialize Socket.IO with the HTTP server
const io = new Server(server, {
  cors: {
    origin: "https://video-chat-app-frontend-pied.vercel.app", // Replace with your frontend URL
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
    credentials: true, // Allow credentials (cookies) to be sent with requests
  },
  pingInterval: 25000, // Interval for pinging clients (25 seconds)
  pingTimeout: 5000,   // Timeout for waiting for a pong from client (5 seconds)
});

// Maps to store socket-email relationships
const emailToSocketMapping = new Map();
const socketToEmailMapping = new Map();

// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log("User Connected", socket.id);

  // Handle user joining a room
  socket.on("join-room", (data) => {
    const { roomId, emailId } = data;
    console.log("User", emailId, "Joined Room", roomId);

    // Store the socket ID associated with the email and vice versa
    emailToSocketMapping.set(emailId, socket.id);
    socketToEmailMapping.set(socket.id, emailId);

    // Join the room
    socket.join(roomId);

    // Emit back to the socket that they have joined the room
    socket.emit("joined-room", { roomId });

    // Notify others in the room that the user has joined
    socket.broadcast.to(roomId).emit("user-joined", { emailId });
  });

  // Handle incoming calls
  socket.on("call-user", (data) => {
    const { emailId, offer } = data;
    const fromEmail = socketToEmailMapping.get(socket.id);
    const socketId = emailToSocketMapping.get(emailId);

    if (socketId) {
      socket.to(socketId).emit("incoming-call", { from: fromEmail, offer });
    }
  });

  // Handle call acceptance
  socket.on("call-accepted", (data) => {
    const { emailId, ans } = data;
    const socketId = emailToSocketMapping.get(emailId);

    if (socketId) {
      socket.to(socketId).emit("call-accepted", { ans });
    }
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log("User Disconnected", socket.id);

    // Clean up the socket-email mapping when a user disconnects
    const emailId = socketToEmailMapping.get(socket.id);
    if (emailId) {
      emailToSocketMapping.delete(emailId);
      socketToEmailMapping.delete(socket.id);
    }
  });
});

// Start the HTTP server
server.listen(8000, () => {
  console.log("Server is running on port 8000");
});

// Start listening to socket.io on the HTTP server
io.listen(8001);

