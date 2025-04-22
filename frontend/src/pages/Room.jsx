import React, { useCallback, useEffect, useState } from "react";
import { useSocket } from "../providers/SocketIO.jsx";
import { usePeer } from "../providers/Peer.jsx";
import ReactPlayer from "react-player";

export default function Room() {
  const { socket } = useSocket();
  const {
    peer,
    createOffer,
    createAnswer,
    setRemoteAnswer,
    sendStream,
    remoteStream,
  } = usePeer();
  const [myStream, setMyStream] = useState(null);
  const [remoteEmailId, setRemoteEmailId] = useState();

  const handleIncomingCall = useCallback(
    async (data) => {
      const { from, offer } = data;
      console.log("Incoming Call from", from, offer);
      const ans = await createAnswer(offer);
      socket.emit("call-accepted", { emailId: from, ans });
      setRemoteEmailId(from);

      sendStream(myStream);
    },
    [createAnswer, socket, myStream, sendStream]
  );

  const handleNewUserJoin = useCallback(
    async (data) => {
      const { emailId } = data;
      console.log("New User Joined Room", emailId);
      const offer = await createOffer();
      socket.emit("call-user", { emailId, offer });
      setRemoteEmailId(emailId);

      sendStream(myStream);
    },
    [createOffer, socket, myStream, sendStream]
  );


  const handleCallAccepted = useCallback(
    async (data) => {
      const { ans } = data;
      await setRemoteAnswer(ans);
      console.log("Call Accepted", ans);
    },
    [setRemoteAnswer]
  );

  const getUserMediaStream = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    });
    setMyStream(stream);
  }, []);

  const handleNegotiationNeeded = useCallback(async () => {
    console.log("Negotiation needed");

    try {
      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);

      socket.emit("call-user", { emailId: remoteEmailId, offer });
    } catch (err) {
      console.error("Negotiation offer error", err);
    }
  }, [peer, remoteEmailId, socket]);


  useEffect(() => {
    socket.on("user-joined", handleNewUserJoin);
    socket.on("incoming-call", handleIncomingCall);
    socket.on("call-accepted", handleCallAccepted);

    return () => {
      socket.off("user-joined", handleNewUserJoin);
      socket.off("incoming-call", handleIncomingCall);
      socket.off("call-accepted", handleCallAccepted);
    };
  }, [handleNewUserJoin, handleIncomingCall, handleCallAccepted, socket]);

  useEffect(() => {
    getUserMediaStream();
  }, [getUserMediaStream]);

  useEffect(() => {
    if (!peer) return;

    peer.addEventListener("negotiationneeded", handleNegotiationNeeded);
    return () => {
      peer.removeEventListener("negotiationneeded", handleNegotiationNeeded);
    };
  }, [peer, handleNegotiationNeeded]);


  return (
    <div className="room-page-container" style={{ padding: "2rem" }}>
      <h1 style={{ textAlign: "center", marginBottom: "2rem" }}>Room Page</h1>
      <h4 style={{ textAlign: "center", marginBottom: "1.5rem" }}>
        Connected with {remoteEmailId || "..."}</h4>

      <div className="video-container" style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: "3rem",
      }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ marginBottom: "0.5rem" }}>You</p>
          {myStream ? (
            <ReactPlayer
              playing
              muted
              url={myStream}
              height="300px"
              width="400px"
            />
          ) : (
            <p>Loading your video...</p>
          )}
        </div>

        <div style={{ textAlign: "center" }}>
          <p style={{ marginBottom: "0.5rem" }}>Caller</p>
          {remoteStream ? (
            <ReactPlayer
              playing
              muted={false}
              url={remoteStream}
              height="300px"
              width="400px"
            />
          ) : (
            <p>Waiting for caller video...</p>
          )}
        </div>
      </div>

      <div style={{ textAlign: "center", marginTop: "2rem" }}>
        <button onClick={() => sendStream(myStream, socket, remoteEmailId)}>
          Send My Video
        </button>
      </div>
    </div>
  );

}
