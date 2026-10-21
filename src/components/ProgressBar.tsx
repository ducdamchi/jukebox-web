interface ProgressBarProps {
  progress: number;
  className?: string;
}

export function ProgressBar({ progress, className = "" }: ProgressBarProps) {
  return (
    <div
      className={`h-1 rounded-sm overflow-hidden bg-[var(--color-bg-element)] ${className}`}
    >
      <div
        className="h-full rounded-sm bg-[var(--color-text)] transition-[width] duration-1000 linear"
        style={{ width: `${Math.min(progress * 100, 100)}%` }}
      />
    </div>
  );
}
