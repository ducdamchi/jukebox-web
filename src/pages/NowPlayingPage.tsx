import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { ProgressBar } from "@/components/ProgressBar";
import { useSpotifyPlayer } from "@/hooks/useSpotifyPlayer";
import type { Track } from "@/types/spotify";

export function NowPlayingPage() {
  const navigate = useNavigate();
  const { state } = useLocation() as { state: { barcode: string; track: Track } | null };
  const track = state?.track ?? null;
  const [progress, setProgress] = useState(0);

  const { play, pause } = useSpotifyPlayer({
    onStateChange: (s) => {
      if (s.duration > 0) {
        setProgress(s.position / s.duration);
      }
    },
    onTrackEnd: () => {
      navigate("/", { replace: true });
    },
    onError: () => {
      navigate("/", { replace: true });
    },
  });

  // Redirect home if no track state (direct nav or page refresh)
  useEffect(() => {
    if (!track) navigate("/", { replace: true });
  }, [track, navigate]);

  // Start playback
  useEffect(() => {
    if (track) play(track.uri);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Block browser back navigation and page refresh
  useEffect(() => {
    const handlePopState = () => {
      window.history.pushState(null, "", window.location.href);
    };
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.history.pushState(null, "", window.location.href);
    window.addEventListener("popstate", handlePopState);
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  if (!track) return null;

  const handleEndEarly = () => {
    pause();
    navigate("/", { replace: true });
  };

  return (
    <div className="flex flex-col h-full items-center justify-center p-6 bg-[var(--color-bg)]">
      <img
        src={track.albumArtUrl}
        alt={track.name}
        className="w-[280px] h-[280px] rounded-2xl mb-8 object-cover"
        draggable={false}
      />
      <h2 className="text-2xl font-semibold text-center text-[var(--color-text)] line-clamp-2">
        {track.name}
      </h2>
      <p className="text-center mt-2 text-lg text-[var(--color-text-secondary)] truncate max-w-[400px]">
        {track.artist}
      </p>
      <ProgressBar progress={progress} className="mt-8 w-[280px]" />
      <button
        type="button"
        onClick={handleEndEarly}
        className="mt-8 px-6 py-3 bg-[var(--color-bg-element)] rounded-lg active:opacity-60 transition-opacity"
      >
        <span className="text-[var(--color-text-secondary)] text-lg">End Song</span>
      </button>
    </div>
  );
}
