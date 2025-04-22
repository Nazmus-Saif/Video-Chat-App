import React, {
  useMemo,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";

const PeerContext = React.createContext(null);
export const usePeer = () => React.useContext(PeerContext);

export const PeerProviders = (props) => {
  const [remoteStream, setRemoteStream] = useState(null);
  const isStreamSent = useRef(false);

  const peer = useMemo(
    () =>
      new RTCPeerConnection({
        iceServers: [
          {
            urls: [
              "stun:stun.l.google.com:19302",
              "stun:global.stun.twilio.com:3478",
            ],
          },
        ],
      }),
    []
  );

  const createOffer = async () => {
    const offer = await peer.createOffer({});
    await peer.setLocalDescription(offer);
    return offer;
  };

  const createAnswer = async (offer) => {
    await peer.setRemoteDescription(offer);
    const answer = await peer.createAnswer();
    await peer.setLocalDescription(answer);
    return answer;
  };

  const setRemoteAnswer = async (ans) => {
    await peer.setRemoteDescription(ans);
  };

  const sendStream = async (stream) => {
    if (isStreamSent.current) {
      console.warn("Stream already sent, skipping addTrack.");
      return;
    }

    stream.getTracks().forEach((track) => {
      peer.addTrack(track, stream);
    });

    isStreamSent.current = true;
  };

  const handleTrackEvent = useCallback((event) => {
    const streams = event.streams;
    if (streams && streams[0]) {
      setRemoteStream(streams[0]);
    }
  }, []);

  useEffect(() => {
    peer.addEventListener("track", handleTrackEvent);
    return () => {
      peer.removeEventListener("track", handleTrackEvent);
    };
  }, [handleTrackEvent, peer]);

  return (
    <PeerContext.Provider
      value={{
        peer,
        createOffer,
        createAnswer,
        setRemoteAnswer,
        sendStream,
        remoteStream,
      }}
    >
      {props.children}
    </PeerContext.Provider>
  );
};
