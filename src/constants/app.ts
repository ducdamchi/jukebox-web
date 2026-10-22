// Per-environment values, set in .env.dev / .env.prod
export const SPOTIFY_CLIENT_ID =
  import.meta.env.VITE_SPOTIFY_CLIENT_ID ?? "";
export const SPOTIFY_REDIRECT_URI =
  import.meta.env.VITE_SPOTIFY_REDIRECT_URI ?? "http://127.0.0.1:5173/callback";
export const SPOTIFY_PLAYLIST_ID =
  import.meta.env.VITE_SPOTIFY_PLAYLIST_ID ?? "";

// Spotify scopes required for Web Playback SDK + user info
export const SPOTIFY_SCOPES = "streaming user-read-email user-read-private";

// Max plays per barcode per day
export const DAILY_PLAY_LIMIT = 3;
// Number of song choices shown on the select screen
export const SONG_CHOICES_COUNT = 20;
// Song choices per carousel page on the select screen
export const SONGS_PER_PAGE = 4;
// Idle timeout before returning to scan screen
export const IDLE_RETURN_TIMEOUT_MS = 60_000;
