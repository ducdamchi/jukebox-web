import { useEffect } from "react";
import {
  useSpotifyPlayerContext,
  type SpotifyMessage,
} from "@/providers/SpotifyProvider";

interface UseSpotifyPlayerOptions {
  onStateChange?: (state: {
    position: number;
    duration: number;
    paused: boolean;
  }) => void;
  onTrackEnd?: () => void;
  onError?: (message: string) => void;
}

export function useSpotifyPlayer(options: UseSpotifyPlayerOptions) {
  const { play, pause, resume, subscribe } = useSpotifyPlayerContext();

  useEffect(() => {
    return subscribe((msg: SpotifyMessage) => {
      switch (msg.type) {
        case "STATE_CHANGE":
          options.onStateChange?.({
            position: msg.position ?? 0,
            duration: msg.duration ?? 0,
            paused: msg.paused ?? false,
          });
          break;
        case "TRACK_END":
          options.onTrackEnd?.();
          break;
        case "ERROR":
          options.onError?.(msg.message ?? "Unknown error");
          break;
      }
    });
  }, [subscribe, options.onStateChange, options.onTrackEnd, options.onError]);

  return { play, pause, resume };
}
