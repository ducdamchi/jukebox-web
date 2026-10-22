import { useEffect, useRef, useState } from "react"
import { useNavigate, useParams } from "react-router"
import { RingCountdown } from "@/components/RingCountdown"
import { SongCarousel } from "@/components/SongCarousel"
import {
  DAILY_PLAY_LIMIT,
  IDLE_RETURN_TIMEOUT_MS,
  SONG_CHOICES_COUNT,
  SONGS_PER_PAGE,
} from "@/constants/app"
import { getPlayCountToday, recordPlay } from "@/services/database"
import { getOrCreateNickname } from "@/services/nameGenerator"
import { getRandomizedSongs } from "@/services/spotifyApi"
import type { Track } from "@/types/spotify"

export function SelectPage() {
  const navigate = useNavigate()
  const { barcode } = useParams<{ barcode: string }>()
  const [tracks, setTracks] = useState<Track[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [nickname, setNickname] = useState<string | null>(null)
  const [creditsRemaining, setCreditsRemaining] = useState<number | null>(null)
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [countdownKey, setCountdownKey] = useState(0)

  const resetIdleTimer = () => {
    if (idleTimer.current) clearTimeout(idleTimer.current)
    setCountdownKey((k) => k + 1)
    idleTimer.current = setTimeout(() => {
      navigate("/", { replace: true })
    }, IDLE_RETURN_TIMEOUT_MS)
  }

  useEffect(() => {
    resetIdleTimer()

    if (barcode) {
      try {
        setNickname(getOrCreateNickname(barcode))
        setCreditsRemaining(
          Math.max(0, DAILY_PLAY_LIMIT - getPlayCountToday(barcode)),
        )
      } catch (e) {
        console.error("[db]", e)
      }
    }

    getRandomizedSongs(SONG_CHOICES_COUNT)
      .then(setTracks)
      .catch((e) => {
        console.error("[songs]", e)
        const msg = e instanceof Error ? e.message : "Failed to load songs"
        if (msg.includes("token") || msg.includes("Token")) {
          setError(
            "Not signed in to Spotify. Long-press the home screen title to sign in.",
          )
        } else {
          setError(msg)
        }
      })
      .finally(() => setLoading(false))

    return () => {
      if (idleTimer.current) clearTimeout(idleTimer.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Auto-return when limit reached
  useEffect(() => {
    if (creditsRemaining !== 0) return
    const timer = setTimeout(() => {
      navigate("/", { replace: true })
    }, 5000)
    return () => clearTimeout(timer)
  }, [creditsRemaining, navigate])

  const handleSelectTrack = (track: Track) => {
    if (barcode) recordPlay(barcode)
    navigate("/now-playing", { state: { barcode, track } })
  }

  return (
    <div className="flex flex-col h-full bg-[var(--color-bg)] p-6">
      {/* Header */}
      <div className="shrink-0 flex flex-col items-center justify-center">
        {nickname && (
          <h2 className="text-2xl font-semibold text-[var(--color-text)] p-2">
            Welcome, {nickname}!
          </h2>
        )}
        {creditsRemaining !== null && (
          <p className="text-[var(--color-text-secondary)] p-2">
            {creditsRemaining}/{DAILY_PLAY_LIMIT} credits remaining
          </p>
        )}
      </div>

      {/* Content — takes the remaining space; song cards shrink to fit it */}
      <div className="flex-1 min-h-0 w-full flex flex-col">
        {creditsRemaining === 0 ? (
          <div className="my-auto flex flex-col items-center p-6">
            <h2 className="text-2xl font-semibold text-center text-[var(--color-text)]">
              Daily Limit Reached
            </h2>
            <p className="text-center mt-4 text-lg leading-7 text-[var(--color-text-secondary)]">
              You've used all your tokens today.
              <br />
              Come back tomorrow!
            </p>
          </div>
        ) : (
          <div className="flex-1 min-h-0 flex flex-col items-center pt-4">
            <h2 className="shrink-0 text-2xl font-semibold text-[var(--color-text)]">
              Pick a Song
            </h2>
            {loading ? (
              <p className="text-[var(--color-text-secondary)] mt-4">
                Loading songs...
              </p>
            ) : error ? (
              <p className="text-[#e53935] text-center mt-4 px-4">{error}</p>
            ) : (
              <SongCarousel
                className="flex-1 min-h-0 w-full max-w-[640px] mt-4"
                tracks={tracks}
                perPage={SONGS_PER_PAGE}
                onSelect={(track) => {
                  resetIdleTimer()
                  handleSelectTrack(track)
                }}
              />
            )}
          </div>
        )}
      </div>

      {/* Footer — countdown + back button, always visible */}
      <div className="shrink-0 flex flex-col justify-center items-center gap-4 pt-4">
        <RingCountdown
          key={countdownKey}
          totalSeconds={Math.floor(IDLE_RETURN_TIMEOUT_MS / 1000)}
          size={80}
          strokeWidth={6}
        />
        <button
          type="button"
          onClick={() => navigate("/", { replace: true })}
          className="px-6 py-3 bg-green-400 rounded-lg active:opacity-60 transition-opacity">
          <span className="text-black text-lg">Back to Home</span>
        </button>
      </div>
    </div>
  )
}
