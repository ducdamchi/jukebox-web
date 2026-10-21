import { useEffect, useState } from "react";

interface RingCountdownProps {
  totalSeconds: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
}

export function RingCountdown({
  totalSeconds,
  size = 120,
  strokeWidth = 8,
  color = "#4ade80",
}: RingCountdownProps) {
  const [secondsLeft, setSecondsLeft] = useState(totalSeconds);
  const [started, setStarted] = useState(false);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const fontSize = Math.round(size * 0.3);

  // Trigger CSS transition on mount
  useEffect(() => {
    const frame = requestAnimationFrame(() => setStarted(true));
    const interval = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => {
      cancelAnimationFrame(frame);
      clearInterval(interval);
    };
  }, []);

  const offset = started ? circumference : 0;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        {/* Background ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="var(--color-bg-element)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Animated foreground ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{
            transition: `stroke-dashoffset ${totalSeconds}s linear`,
          }}
        />
      </svg>
      <span
        className="absolute text-[var(--color-text)]"
        style={{ fontSize, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}
      >
        {secondsLeft}
      </span>
    </div>
  );
}
