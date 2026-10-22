import type { Track } from "@/types/spotify";

interface SongCardProps {
  track: Track;
  onPress: () => void;
}

export function SongCard({ track, onPress }: SongCardProps) {
  return (
    <button
      type="button"
      onClick={onPress}
      className="w-[calc(var(--art,220px)+16px)] p-2 flex flex-col items-center transition-transform duration-150 active:scale-95"
    >
      <img
        src={track.albumArtUrl}
        alt={track.name}
        className="size-[var(--art,220px)] rounded-lg mb-2 object-cover"
        draggable={false}
      />
      <p className="text-base font-semibold text-center w-full truncate text-[var(--color-text)]">
        {track.name}
      </p>
      <p className="text-sm text-center w-full truncate text-[var(--color-text-secondary)]">
        {track.artist}
      </p>
    </button>
  );
}
