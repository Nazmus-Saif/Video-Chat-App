import express from "express";
import bodyParser from "body-parser";
import { Server } from "socket.io";
import serverless from "serverless-http";

const app = express();
const io = new Server({
  cors: {
    origin: "https://video-chat-app-frontend.vercel.app",
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

// Wrapping the express app for serverless function
module.exports.handler = serverless(app);
