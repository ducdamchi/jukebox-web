import { SPOTIFY_PLAYLIST_ID } from "@/constants/app"
import { getAccessToken } from "@/services/spotifyAuth"
import type { Track } from "@/types/spotify"

let cachedTracks: Track[] = []
let lastFetchTime = 0
const CACHE_DURATION_MS = 30 * 60 * 1000 // 30 minutes

async function fetchPlaylistTracks(): Promise<Track[]> {
  const token = await getAccessToken()
  if (!token) throw new Error("No Spotify token available")

  const tracks: Track[] = []
  let url: string | null =
    `https://api.spotify.com/v1/playlists/${SPOTIFY_PLAYLIST_ID}/items?limit=50&fields=items(item(id,name,uri,duration_ms,artists(name),album(images))),next`

  while (url) {
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!response.ok) throw new Error(`Spotify API error: ${response.status}`)
    const data = await response.json()

    for (const entry of data.items) {
      const t = entry.item
      if (!t || !t.id) continue
      tracks.push({
        id: t.id,
        name: t.name,
        artist: t.artists.map((a: { name: string }) => a.name).join(", "),
        albumArtUrl: t.album.images[0]?.url ?? "",
        durationMs: t.duration_ms,
        uri: t.uri,
      })
    }

    url = data.next
  }

  return tracks
}

async function getPlaylistTracks(): Promise<Track[]> {
  const now = Date.now()
  if (cachedTracks.length === 0 || now - lastFetchTime > CACHE_DURATION_MS) {
    cachedTracks = await fetchPlaylistTracks()
    lastFetchTime = now
  }
  return cachedTracks
}

export async function getRandomizedSongs(count: number): Promise<Track[]> {
  const all = await getPlaylistTracks()
  const shuffled = [...all].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}
