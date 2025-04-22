import express from "express";
import bodyParser from "body-parser";
import { Server } from "socket.io";

const app = express();

// Explicit CORS setup for HTTP requests
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "https://video-chat-app-frontend-pied.vercel.app"); // Replace with your frontend URL
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

const io = new Server(app, {
  cors: {
    origin: "https://video-chat-app-frontend-pied.vercel.app", // Ensure this is the correct frontend URL
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
    credentials: true, // Allow credentials (if needed)
  },
});

app.use(bodyParser.json());

const emailToSocketMapping = new Map();
const socketToEmailMapping = new Map();

io.on("connection", (socket) => {
  console.log("User Connected", socket.id);

  socket.on("join-room", (data) => {
    console.log("User", data.emailId, "Joined Room", data.roomId);
    const { roomId, emailId } = data;
    emailToSocketMapping.set(emailId, socket.id);
    socketToEmailMapping.set(socket.id, emailId);
    socket.join(roomId);
    socket.emit("joined-room", { roomId });
    socket.broadcast.to(roomId).emit("user-joined", { emailId });
  });

  socket.on("call-user", (data) => {
    const { emailId, offer } = data;
    const fromEmail = socketToEmailMapping.get(socket.id);
    const socketId = emailToSocketMapping.get(emailId);
    socket.to(socketId).emit("incoming-call", { from: fromEmail, offer });
  });

  socket.on("call-accepted", (data) => {
    const { emailId, ans } = data;
    const socketId = emailToSocketMapping.get(emailId);
    socket.to(socketId).emit("call-accepted", { ans });
  });
});

// Start the express server on port 8000
app.listen(8000, () => {
  console.log("Server is running on port 8000");
});

// Listen to socket.io on port 8001
io.listen(8001);
