/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SPOTIFY_CLIENT_ID: string;
  readonly VITE_SPOTIFY_REDIRECT_URI: string;
  readonly VITE_SPOTIFY_PLAYLIST_ID: string;
  readonly VITE_SPOTIFY_SCOPES: string;
  readonly VITE_DAILY_PLAY_LIMIT: string;
  readonly VITE_SONG_CHOICES_COUNT: string;
  readonly VITE_IDLE_RETURN_TIMEOUT_MS: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Spotify Web Playback SDK global types
interface SpotifyPlayerState {
  position: number;
  duration: number;
  paused: boolean;
  track_window: {
    current_track: { id: string; name: string; uri: string };
    previous_tracks: unknown[];
  };
}

interface SpotifyPlayerInstance {
  connect(): Promise<boolean>;
  disconnect(): void;
  pause(): Promise<void>;
  resume(): Promise<void>;
  addListener(event: "ready", cb: (data: { device_id: string }) => void): void;
  addListener(event: "not_ready", cb: () => void): void;
  addListener(
    event: "player_state_changed",
    cb: (state: SpotifyPlayerState | null) => void,
  ): void;
  addListener(
    event: "initialization_error" | "authentication_error" | "account_error",
    cb: (data: { message: string }) => void,
  ): void;
  _options: { getOAuthToken: (cb: (token: string) => void) => void };
}

interface Window {
  onSpotifyWebPlaybackSDKReady: () => void;
  Spotify: {
    Player: new (config: {
      name: string;
      getOAuthToken: (cb: (token: string) => void) => void;
      volume?: number;
    }) => SpotifyPlayerInstance;
  };
}
