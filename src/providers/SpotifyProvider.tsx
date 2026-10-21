import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { getAccessToken } from "@/services/spotifyAuth";

export interface SpotifyMessage {
  type: "READY" | "STATE_CHANGE" | "TRACK_END" | "ERROR";
  deviceId?: string;
  position?: number;
  duration?: number;
  paused?: boolean;
  message?: string;
}

type MessageHandler = (msg: SpotifyMessage) => void;

interface SpotifyPlayerContextValue {
  play: (uri: string) => Promise<void>;
  pause: () => void;
  resume: () => void;
  subscribe: (handler: MessageHandler) => () => void;
  isReady: boolean;
}

const SpotifyPlayerContext = createContext<SpotifyPlayerContextValue>({
  play: async () => {},
  pause: () => {},
  resume: () => {},
  subscribe: () => () => {},
  isReady: false,
});

export function useSpotifyPlayerContext() {
  return useContext(SpotifyPlayerContext);
}

export function SpotifyProvider({ children }: { children: ReactNode }) {
  const playerRef = useRef<SpotifyPlayerInstance | null>(null);
  const deviceIdRef = useRef<string | null>(null);
  const handlersRef = useRef<Set<MessageHandler>>(new Set());
  const [isReady, setIsReady] = useState(false);

  const emit = useCallback((msg: SpotifyMessage) => {
    handlersRef.current.forEach((h) => h(msg));
  }, []);

  const subscribe = useCallback((handler: MessageHandler) => {
    handlersRef.current.add(handler);
    return () => {
      handlersRef.current.delete(handler);
    };
  }, []);

  useEffect(() => {
    let disposed = false;

    const initPlayer = async () => {
      const token = await getAccessToken();
      if (!token || disposed) return;

      const player = new window.Spotify.Player({
        name: "Library Jukebox",
        getOAuthToken: (cb) => {
          getAccessToken().then((t) => {
            if (t) cb(t);
          });
        },
        volume: 1.0,
      });

      player.addListener("ready", ({ device_id }) => {
        deviceIdRef.current = device_id;
        setIsReady(true);
        emit({ type: "READY", deviceId: device_id });
      });

      player.addListener("not_ready", () => {
        emit({ type: "ERROR", message: "Device went offline" });
      });

      player.addListener("player_state_changed", (state) => {
        if (!state) return;
        emit({
          type: "STATE_CHANGE",
          position: state.position,
          duration: state.duration,
          paused: state.paused,
        });
        // Detect track end: paused at position 0 with previous tracks
        if (
          state.paused &&
          state.position === 0 &&
          state.track_window.previous_tracks.length > 0
        ) {
          emit({ type: "TRACK_END" });
        }
      });

      player.addListener("initialization_error", ({ message }) => {
        emit({ type: "ERROR", message });
      });
      player.addListener("authentication_error", ({ message }) => {
        emit({ type: "ERROR", message });
      });
      player.addListener("account_error", ({ message }) => {
        emit({ type: "ERROR", message });
      });

      player.connect();
      playerRef.current = player;
    };

    (window as any).__spotifySDKReady.then(() => {
      if (!disposed) initPlayer();
    });

    return () => {
      disposed = true;
      playerRef.current?.disconnect();
    };
  }, [emit]);

  const play = useCallback(async (uri: string) => {
    const deviceId = deviceIdRef.current;
    if (!deviceId) {
      emit({ type: "ERROR", message: "No device ready" });
      return;
    }
    const token = await getAccessToken();
    if (!token) {
      emit({ type: "ERROR", message: "No token" });
      return;
    }
    const res = await fetch(
      `https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ uris: [uri] }),
      },
    );
    if (!res.ok) {
      emit({ type: "ERROR", message: `Play failed: ${res.status}` });
    }
  }, [emit]);

  const pause = useCallback(() => {
    playerRef.current?.pause();
  }, []);

  const resume = useCallback(() => {
    playerRef.current?.resume();
  }, []);

  return (
    <SpotifyPlayerContext.Provider
      value={{ play, pause, resume, subscribe, isReady }}
    >
      {children}
    </SpotifyPlayerContext.Provider>
  );
}
