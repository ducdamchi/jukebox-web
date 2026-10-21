export const SPOTIFY_CLIENT_ID =
  import.meta.env.VITE_SPOTIFY_CLIENT_ID ?? "";
export const SPOTIFY_REDIRECT_URI =
  import.meta.env.VITE_SPOTIFY_REDIRECT_URI ?? "http://127.0.0.1:5173/callback";
export const SPOTIFY_PLAYLIST_ID =
  import.meta.env.VITE_SPOTIFY_PLAYLIST_ID ?? "";
export const SPOTIFY_SCOPES =
  import.meta.env.VITE_SPOTIFY_SCOPES ??
  "streaming user-read-email user-read-private";

export const DAILY_PLAY_LIMIT =
  Number(import.meta.env.VITE_DAILY_PLAY_LIMIT) || 3;
export const SONG_CHOICES_COUNT =
  Number(import.meta.env.VITE_SONG_CHOICES_COUNT) || 4;
export const IDLE_RETURN_TIMEOUT_MS =
  Number(import.meta.env.VITE_IDLE_RETURN_TIMEOUT_MS) || 30_000;
