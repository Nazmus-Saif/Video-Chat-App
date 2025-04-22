import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useSocket } from "../providers/SocketIO";

export default function Home() {
  const { socket } = useSocket();
  const navigate = useNavigate();

  const [emailId, setEmail] = useState("");
  const [roomId, setRoomId] = useState("");

  const handleRoomJoin = useCallback(({ roomId }) => {
    navigate(`/room/${roomId}`);
  });

  useEffect(() => {
    socket.on("joined-room", handleRoomJoin);
    return () => {
      socket.off("joined-room", handleRoomJoin);
    };
  }, [handleRoomJoin, socket]);

  const handleJoinRoom = () => {
    socket.emit("join-room", { emailId, roomId });
  };

  return (
    <div className="homepage-container">
      <div className="input-container">
        <input
          value={emailId}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          placeholder="Enter Your Email"
        />
        <input
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          type="text"
          placeholder="Enter Room Code"
        />
        <button onClick={handleJoinRoom}>Enter Room</button>
      </div>
    </div>
  );
}
