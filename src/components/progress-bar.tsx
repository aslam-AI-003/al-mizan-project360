export function ProgressBar({
  value,
  className = "",
  trackClassName = "bg-black/[0.06]",
  barClassName,
}: {
  value: number;
  className?: string;
  trackClassName?: string;
  barClassName?: string;
}) {
  const clamped = Math.max(0, Math.min(100, value));
  const color =
    barClassName ??
    (clamped >= 80 ? "bg-[var(--status-success)]" : clamped >= 40 ? "bg-brand-gold" : "bg-[var(--status-info)]");

  return (
    <div className={`h-2 w-full overflow-hidden rounded-full ${trackClassName} ${className}`}>
      <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${clamped}%` }} />
    </div>
  );
}
