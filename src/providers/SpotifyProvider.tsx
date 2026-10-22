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
  activate: () => void;
  play: (uri: string) => Promise<void>;
  pause: () => void;
  resume: () => void;
  subscribe: (handler: MessageHandler) => () => void;
  isReady: boolean;
}

const SpotifyPlayerContext = createContext<SpotifyPlayerContextValue>({
  activate: () => {},
  play: async () => {},
  pause: () => {},
  resume: () => {},
  subscribe: () => () => {},
  isReady: false,
});

export function useSpotifyPlayerContext() {
  return useContext(SpotifyPlayerContext);
}

const DEVICE_SUFFIX_KEY = "spotify_device_suffix";
const DEVICE_READY_TIMEOUT_MS = 10_000;

// A per-browser suffix so each kiosk shows up as its own device in Spotify
function getDeviceName(): string {
  let suffix = localStorage.getItem(DEVICE_SUFFIX_KEY);
  if (!suffix) {
    suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
    localStorage.setItem(DEVICE_SUFFIX_KEY, suffix);
  }
  return `Library Jukebox ${suffix}`;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function SpotifyProvider({ children }: { children: ReactNode }) {
  const playerRef = useRef<SpotifyPlayerInstance | null>(null);
  const deviceIdRef = useRef<string | null>(null);
  // Last SDK error, so play() can explain why the device never became ready
  const playerErrorRef = useRef<string | null>(null);
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
        name: getDeviceName(),
        getOAuthToken: (cb) => {
          getAccessToken().then((t) => {
            if (t) cb(t);
          });
        },
        volume: 1.0,
      });

      player.addListener("ready", ({ device_id }) => {
        deviceIdRef.current = device_id;
        playerErrorRef.current = null;
        setIsReady(true);
        emit({ type: "READY", deviceId: device_id });
      });

      player.addListener("not_ready", () => {
        deviceIdRef.current = null;
        setIsReady(false);
        emit({ type: "ERROR", message: "Spotify player went offline" });
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

      const reportError = (kind: string) => ({ message }: { message: string }) => {
        const text = `Spotify ${kind} error: ${message}`;
        console.error("[spotify]", text);
        playerErrorRef.current = text;
        emit({ type: "ERROR", message: text });
      };
      player.addListener("initialization_error", reportError("initialization"));
      player.addListener("authentication_error", reportError("authentication"));
      player.addListener("account_error", reportError("account"));

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

  // Must be called synchronously inside a tap/click handler: unlocks audio
  // playback in browsers that block autoplay (Safari, mobile browsers).
  const activate = useCallback(() => {
    playerRef.current?.activateElement().catch(() => {});
  }, []);

  const play = useCallback(async (uri: string) => {
    // The player may still be connecting (e.g. right after a page load)
    const deadline = Date.now() + DEVICE_READY_TIMEOUT_MS;
    while (!deviceIdRef.current && !playerErrorRef.current && Date.now() < deadline) {
      await sleep(200);
    }
    const deviceId = deviceIdRef.current;
    if (!deviceId) {
      emit({
        type: "ERROR",
        message:
          playerErrorRef.current ??
          "Spotify player isn't ready on this device. This browser may not support Spotify playback.",
      });
      return;
    }
    const token = await getAccessToken();
    if (!token) {
      emit({ type: "ERROR", message: "Not signed in to Spotify" });
      return;
    }

    // Spotify sometimes 404s/5xxs right after a device registers; retry once
    for (let attempt = 0; attempt < 2; attempt++) {
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
      if (res.ok) return;
      if (attempt === 0 && (res.status === 404 || res.status >= 500)) {
        await sleep(1000);
        continue;
      }
      const body = await res.json().catch(() => null);
      const detail = body?.error?.message ? ` (${body.error.message})` : "";
      emit({ type: "ERROR", message: `Play failed: ${res.status}${detail}` });
      return;
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
      value={{ activate, play, pause, resume, subscribe, isReady }}
    >
      {children}
    </SpotifyPlayerContext.Provider>
  );
}
