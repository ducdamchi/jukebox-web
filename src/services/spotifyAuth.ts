import {
  SPOTIFY_CLIENT_ID,
  SPOTIFY_REDIRECT_URI,
  SPOTIFY_SCOPES,
} from "@/constants/app";

const TOKEN_KEY = "spotify_tokens";
const CODE_VERIFIER_KEY = "spotify_code_verifier";

interface TokenData {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

function generateRandomString(length: number): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => chars[b % chars.length]).join("");
}

async function sha256(plain: string): Promise<ArrayBuffer> {
  const data = new TextEncoder().encode(plain);
  return crypto.subtle.digest("SHA-256", data);
}

function base64UrlEncode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** Redirects the browser to Spotify's OAuth authorize page (PKCE flow). */
export async function openSpotifyLogin(): Promise<void> {
  const codeVerifier = generateRandomString(64);
  localStorage.setItem(CODE_VERIFIER_KEY, codeVerifier);

  const hashed = await sha256(codeVerifier);
  const codeChallenge = base64UrlEncode(hashed);

  const params = new URLSearchParams({
    client_id: SPOTIFY_CLIENT_ID,
    response_type: "code",
    redirect_uri: SPOTIFY_REDIRECT_URI,
    scope: SPOTIFY_SCOPES,
    code_challenge_method: "S256",
    code_challenge: codeChallenge,
  });

  window.location.href = `https://accounts.spotify.com/authorize?${params}`;
}

/** Called from the /callback page after Spotify redirects back with a code. */
export async function handleAuthCallback(code: string): Promise<void> {
  const codeVerifier = localStorage.getItem(CODE_VERIFIER_KEY);
  if (!codeVerifier) throw new Error("Missing code verifier — login may have expired");

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: SPOTIFY_REDIRECT_URI,
      client_id: SPOTIFY_CLIENT_ID,
      code_verifier: codeVerifier,
    }),
  });

  const data = await response.json();
  storeTokens(data);
  localStorage.removeItem(CODE_VERIFIER_KEY);
}

async function refreshAccessToken(refreshToken: string): Promise<void> {
  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: SPOTIFY_CLIENT_ID,
    }),
  });

  const data = await response.json();
  storeTokens(data, refreshToken);
}

function storeTokens(
  data: { access_token: string; refresh_token?: string; expires_in: number },
  existingRefreshToken?: string,
): void {
  const tokens: TokenData = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? existingRefreshToken ?? "",
    expiresAt: Date.now() + data.expires_in * 1000,
  };
  localStorage.setItem(TOKEN_KEY, JSON.stringify(tokens));
}

export async function getAccessToken(): Promise<string | null> {
  const raw = localStorage.getItem(TOKEN_KEY);
  if (!raw) return null;

  const tokens: TokenData = JSON.parse(raw);

  // Refresh if expiring within 5 minutes
  if (Date.now() > tokens.expiresAt - 5 * 60 * 1000) {
    try {
      await refreshAccessToken(tokens.refreshToken);
      const updated = localStorage.getItem(TOKEN_KEY);
      if (updated) return (JSON.parse(updated) as TokenData).accessToken;
    } catch {
      return null;
    }
  }

  return tokens.accessToken;
}
