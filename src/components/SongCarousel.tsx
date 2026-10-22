import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { CSSProperties, PointerEvent, TransitionEvent } from "react";
import { SongCard } from "@/components/SongCard";
import type { Track } from "@/types/spotify";

interface SongCarouselProps {
  tracks: Track[];
  perPage: number;
  onSelect: (track: Track) => void;
  className?: string;
}

const SWIPE_THRESHOLD_PX = 50;
const TAP_SLOP_PX = 10;

// Album art edge length: as large as possible (up to 220px) while a 2x2 grid of
// cards still fits the carousel viewport. 50cqh - 80px leaves room for each
// card's title/artist text, padding and the row gap.
const ART_SIZE = "max(0px, min(220px, calc(50cqw - 24px), calc(50cqh - 80px)))";

export function SongCarousel({
  tracks,
  perPage,
  onSelect,
  className = "",
}: SongCarouselProps) {
  const pages: Track[][] = [];
  for (let i = 0; i < tracks.length; i += perPage) {
    pages.push(tracks.slice(i, i + perPage));
  }
  const pageCount = pages.length;
  const looping = pageCount > 1;

  // Clone the last page in front and the first page at the end so wrapping
  // around animates seamlessly; after the animation we jump to the real page.
  const slides = looping ? [pages[pageCount - 1]!, ...pages, pages[0]!] : pages;

  const [position, setPosition] = useState(looping ? 1 : 0);
  const [animate, setAnimate] = useState(true);
  const [dragPx, setDragPx] = useState(0);
  const moving = useRef(false);
  const dragStartX = useRef<number | null>(null);
  const dragged = useRef(false);

  const activePage = looping
    ? (position - 1 + pageCount) % pageCount
    : position;

  const goTo = (nextPosition: number) => {
    if (!looping || moving.current || nextPosition === position) return;
    moving.current = true;
    setAnimate(true);
    setPosition(nextPosition);
  };

  const handleTransitionEnd = (e: TransitionEvent) => {
    // Ignore transitions bubbling up from the cards (e.g. press scale)
    if (e.target !== e.currentTarget) return;
    moving.current = false;
    if (position === 0 || position === pageCount + 1) {
      setAnimate(false);
      setPosition(position === 0 ? pageCount : 1);
    }
  };

  const handlePointerDown = (e: PointerEvent) => {
    if (!looping || moving.current) return;
    dragStartX.current = e.clientX;
    dragged.current = false;
    setAnimate(false);
  };

  const handlePointerMove = (e: PointerEvent) => {
    if (dragStartX.current === null) return;
    const dx = e.clientX - dragStartX.current;
    if (Math.abs(dx) > TAP_SLOP_PX) dragged.current = true;
    setDragPx(dx);
  };

  const handlePointerUp = () => {
    if (dragStartX.current === null) return;
    dragStartX.current = null;
    setAnimate(true);
    setDragPx(0);
    if (dragPx <= -SWIPE_THRESHOLD_PX) goTo(position + 1);
    else if (dragPx >= SWIPE_THRESHOLD_PX) goTo(position - 1);
  };

  return (
    <div className={`flex flex-col ${className}`}>
      <div className="flex-1 min-h-0 flex items-center gap-2">
        {looping && (
          <ArrowButton direction="prev" onClick={() => goTo(position - 1)} />
        )}

        <div
          className="flex-1 h-full min-w-0 overflow-hidden touch-none [container-type:size]"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onPointerLeave={handlePointerUp}
          onClickCapture={(e) => {
            // A swipe that ends on a card shouldn't count as picking it
            if (dragged.current) {
              e.stopPropagation();
              dragged.current = false;
            }
          }}
        >
          <div
            className="flex h-full"
            style={{
              transform: `translateX(calc(${-position * 100}% + ${dragPx}px))`,
              transition: animate ? "transform 300ms ease-out" : "none",
            }}
            onTransitionEnd={handleTransitionEnd}
          >
            {slides.map((page, i) => (
              <div
                key={i}
                className="w-full h-full shrink-0 grid grid-cols-2 auto-rows-min content-center justify-items-center gap-4"
                style={{ "--art": ART_SIZE } as CSSProperties}
              >
                {page.map((track) => (
                  <SongCard
                    key={track.id}
                    track={track}
                    onPress={() => onSelect(track)}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        {looping && (
          <ArrowButton direction="next" onClick={() => goTo(position + 1)} />
        )}
      </div>

      {looping && (
        <div className="shrink-0 flex justify-center gap-2 pt-3">
          {pages.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Page ${i + 1}`}
              onClick={() => goTo(i + 1)}
              className={`size-2.5 rounded-full transition-colors ${
                i === activePage
                  ? "bg-green-400"
                  : "bg-[var(--color-bg-selected)]"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ArrowButton({
  direction,
  onClick,
}: {
  direction: "prev" | "next";
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={direction === "prev" ? "Previous songs" : "Next songs"}
      onClick={onClick}
      className="shrink-0 size-12 p-0 rounded-full flex items-center justify-center bg-[var(--color-bg-element)] text-[var(--color-text)] active:opacity-60 transition-opacity"
    >
      {direction === "prev" ? (
        <ChevronLeft size={28} strokeWidth={2.5} />
      ) : (
        <ChevronRight size={28} strokeWidth={2.5} />
      )}
    </button>
  );
}
