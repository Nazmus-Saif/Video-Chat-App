import React from "react";
import { Routes, Route } from "react-router-dom";
import HomePage from "./pages/Home.jsx";
import RoomPage from "./pages/Room.jsx";
import { SocketProvider } from "./providers/SocketIO.jsx";
import { PeerProviders } from "./providers/Peer.jsx";
import "./styles/styles.css";

export default function App() {
  return (
    <div className="App">
      <SocketProvider>
        <PeerProviders>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/room/:roomId" element={<RoomPage />} />
          </Routes>
        </PeerProviders>
      </SocketProvider>
    </div>
  );
}
